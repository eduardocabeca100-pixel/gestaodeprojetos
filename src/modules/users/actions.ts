"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/require-role";
import { projectManagerRoles, roles, type Role } from "@/lib/auth/permissions";
import { ensureSeedProjects } from "@/modules/projects/queries";

import { createUserSchema, loginSchema, passwordResetSchema } from "./schemas";

export type LoginState = {
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
  };
};

export type PasswordResetState = {
  message?: string;
  errors?: {
    password?: string[];
  };
};

export type CreateUserState = {
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    role?: string[];
    tempPassword?: string[];
    projectIds?: string[];
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
    isActive: boolean;
    projectIds: string[];
  };
};

export type ProjectAccessActionState = {
  ok: boolean;
  message: string;
};

export type UserManagementActionState = {
  ok: boolean;
  message: string;
};

const userManagerRoles = ["admin", "super_admin"];

function getErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "";
}

function normalizeCreateUserError(error: unknown) {
  const message = getErrorMessage(error);

  if (
    /already registered|duplicate key value violates unique constraint|profiles_email_key/i.test(
      message,
    )
  ) {
    return "Já existe um usuário cadastrado com esse e-mail.";
  }

  if (message) {
    return message;
  }

  return "Não foi possível criar o usuário.";
}

async function findAuthUserByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
) {
  const usersResult = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (usersResult.error) {
    throw new Error(usersResult.error.message);
  }

  return (
    ((usersResult.data?.users ?? []) as Array<{ email?: string | null; id?: string; user_metadata?: Record<string, unknown> }>).find((user) => user.email?.trim().toLowerCase() === email) ??
    null
  );
}

function isProjectMembershipsUnavailable(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };

  return (
    maybeError.code === "PGRST205" ||
    maybeError.message?.includes("project_memberships") === true
  );
}

async function syncProjectSlugsToUserMetadata(profileId: string, projectKeys: string[]) {
  const admin = createAdminClient();

  if (!admin) {
    throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY para salvar o acesso do usuário.");
  }

  const userResult = await admin.auth.admin.getUserById(profileId);

  if (userResult.error || !userResult.data.user) {
    throw new Error(userResult.error?.message ?? "Não foi possível carregar o usuário no Auth.");
  }

  const currentMetadata =
    userResult.data.user.user_metadata &&
    typeof userResult.data.user.user_metadata === "object"
      ? userResult.data.user.user_metadata
      : {};

  const updateResult = await admin.auth.admin.updateUserById(profileId, {
    user_metadata: {
      ...currentMetadata,
      projectSlugs: projectKeys,
    },
  });

  if (updateResult.error) {
    throw new Error(updateResult.error.message);
  }
}

async function resolveProjectIds(projectKeys: string[]) {
  const admin = createAdminClient();

  if (!admin || projectKeys.length === 0) {
    return [];
  }

  await ensureSeedProjects();

  const result = await admin
    .from("projects")
    .select("id, slug")
    .in("slug", projectKeys);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data.map((project) => project.id);
}

async function replaceProjectMemberships(profileId: string, projectKeys: string[]) {
  const admin = createAdminClient();

  if (!admin) {
    throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY para salvar os acessos.");
  }

  const projectIds = await resolveProjectIds(projectKeys);

  if (projectKeys.length > 0 && projectIds.length !== projectKeys.length) {
    throw new Error("Um dos projetos selecionados não foi encontrado no Supabase.");
  }

  const deleteResult = await admin
    .from("project_memberships")
    .delete()
    .eq("profile_id", profileId);

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message);
  }

  if (projectIds.length === 0) {
    return;
  }

  const insertResult = await admin.from("project_memberships").insert(
    projectIds.map((projectId) => ({
      profile_id: profileId,
      project_id: projectId,
    })),
  );

  if (insertResult.error) {
    throw new Error(insertResult.error.message);
  }
}

async function persistProjectAccess(profileId: string, projectKeys: string[]) {
  await syncProjectSlugsToUserMetadata(profileId, projectKeys);

  try {
    await replaceProjectMemberships(profileId, projectKeys);
  } catch (error) {
    if (isProjectMembershipsUnavailable(error)) {
      return;
    }

    throw error;
  }
}

export async function login(
  _state: LoginState | undefined,
  formData: FormData,
): Promise<LoginState | undefined> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Revise os dados de acesso.",
    };
  }

  if (!hasSupabaseServerEnv()) {
    redirect("/projetos/selecionar");
  }

  const supabase = await createClient();

  if (!supabase) {
    redirect("/projetos/selecionar");
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      message: "E-mail ou senha inválidos.",
    };
  }

  if (data.user) {
    const profileResult = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", data.user.id)
      .maybeSingle();

    const profile = profileResult.data as { must_change_password?: boolean } | null;

    if (profile?.must_change_password) {
      redirect("/redefinir-senha");
    }
  }

  redirect("/projetos/selecionar");
}

export async function updatePassword(
  _state: PasswordResetState | undefined,
  formData: FormData,
): Promise<PasswordResetState | undefined> {
  const parsed = passwordResetSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Revise os campos da nova senha.",
    };
  }

  if (!hasSupabaseServerEnv()) {
    redirect("/projetos/selecionar");
  }

  const supabase = await createClient();

  if (!supabase) {
    redirect("/projetos/selecionar");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  if (!admin) {
    return {
      message:
        "Configure SUPABASE_SERVICE_ROLE_KEY para concluir a troca de senha.",
    };
  }

  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    password: parsed.data.password,
  });

  if (authError) {
    return {
      message: authError.message ?? "Não foi possível atualizar a senha agora.",
    };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: false } as never)
    .eq("id", user.id);

  if (profileError) {
    return {
      message:
        profileError.message ?? "Não foi possível liberar o acesso do usuário.",
    };
  }

  redirect("/projetos/selecionar");
}

export async function createUser(
  _state: CreateUserState | undefined,
  formData: FormData,
): Promise<CreateUserState | undefined> {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile || !userManagerRoles.includes(currentProfile.role)) {
      return {
        message: "Você não tem permissão para criar usuários.",
      };
    }

    const parsed = createUserSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      tempPassword: formData.get("tempPassword"),
      mustChangePassword: formData.get("mustChangePassword"),
      projectIds: formData.getAll("projectIds"),
    });

    if (!parsed.success) {
      return {
        errors: parsed.error.flatten().fieldErrors,
        message: "Revise os campos do novo usuário.",
      };
    }

    const admin = createAdminClient();

    if (!admin) {
      return {
        message:
          "Configure SUPABASE_SERVICE_ROLE_KEY para criar usuários no Supabase.",
      };
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const existingProfile = await admin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingProfile.error) {
      return {
        message: existingProfile.error.message,
      };
    }

    if (existingProfile.data) {
      return {
        message: "Já existe um usuário cadastrado com esse e-mail.",
      };
    }

    const existingAuthUser = await findAuthUserByEmail(admin, normalizedEmail);
    let userId = existingAuthUser?.id ?? null;
    let createdAuthUser = false;

    if (existingAuthUser) {
      const updateResult = await admin.auth.admin.updateUserById(existingAuthUser.id, {
        password: parsed.data.tempPassword,
        email_confirm: true,
        user_metadata: {
          ...(existingAuthUser.user_metadata &&
          typeof existingAuthUser.user_metadata === "object"
            ? existingAuthUser.user_metadata
            : {}),
          name: parsed.data.name,
          projectSlugs: parsed.data.projectIds,
        },
      });

      if (updateResult.error) {
        return {
          message: normalizeCreateUserError(updateResult.error),
        };
      }
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: parsed.data.tempPassword,
        email_confirm: true,
        user_metadata: {
          name: parsed.data.name,
          projectSlugs: parsed.data.projectIds,
        },
      });

      if (error || !data.user) {
        return {
          message: normalizeCreateUserError(error),
        };
      }

      userId = data.user.id;
      createdAuthUser = true;
    }

    if (!userId) {
      return {
        message: "Não foi possível localizar o usuário autenticado criado.",
      };
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      is_active: true,
      must_change_password: parsed.data.mustChangePassword,
    } as never);

    if (profileError) {
      if (createdAuthUser && userId) {
        await admin.auth.admin.deleteUser(userId);
      }
      return {
        message: normalizeCreateUserError(profileError),
      };
    }

    try {
      await persistProjectAccess(userId, parsed.data.projectIds);
    } catch (membershipError) {
      await admin.from("profiles").delete().eq("id", userId);
      if (createdAuthUser && userId) {
        await admin.auth.admin.deleteUser(userId);
      }

      return {
        message:
          membershipError instanceof Error
            ? membershipError.message
            : "Não foi possível definir os projetos deste usuário.",
      };
    }

    revalidatePath("/configuracoes/usuarios", "page");

    return {
      message: `Usuário ${parsed.data.name} criado no Supabase.`,
      user: {
        id: userId,
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        mustChangePassword: parsed.data.mustChangePassword,
        isActive: true,
        projectIds: parsed.data.projectIds,
      },
    };
  } catch (error) {
    console.error("createUser failed", error);

    return {
      message: normalizeCreateUserError(error),
    };
  }
}

export async function updateUserProjectAccess(
  _state: ProjectAccessActionState,
  formData: FormData,
): Promise<ProjectAccessActionState> {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile || !userManagerRoles.includes(currentProfile.role)) {
      return { ok: false, message: "Você não tem permissão para alterar acessos." };
    }

    const profileId = String(formData.get("profileId") ?? "");
    const projectIds = formData.getAll("projectIds").map(String);

    if (!profileId) {
      return { ok: false, message: "Usuário inválido." };
    }

    if (projectIds.length === 0) {
      return { ok: false, message: "Selecione ao menos um projeto." };
    }

    await persistProjectAccess(profileId, projectIds);
    revalidatePath("/configuracoes/usuarios", "page");

    return { ok: true, message: "Acesso aos projetos atualizado." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível atualizar os acessos.",
    };
  }
}


function normalizeManagedRole(role: FormDataEntryValue | null): Role {
  const rawRole = String(role ?? "diretor_executivo");

  if (["super_admin", "admin", "diretor_executivo"].includes(rawRole) && roles.includes(rawRole as Role)) {
    return rawRole as Role;
  }

  return "diretor_executivo";
}

function roleHasProjectScope(role: Role) {
  return !projectManagerRoles.includes(role);
}

async function requireUserManagementAccess() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile || !userManagerRoles.includes(currentProfile.role)) {
    throw new Error("Você não tem permissão para gerenciar usuários.");
  }

  return currentProfile;
}

function getBooleanFromForm(formData: FormData, key: string) {
  return formData.get(key) === "true";
}

function getProfileIdFromForm(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "").trim();

  if (!profileId) {
    throw new Error("Usuário inválido.");
  }

  return profileId;
}

export async function updateUserDetails(
  formData: FormData,
): Promise<UserManagementActionState> {
  try {
    await requireUserManagementAccess();

    const admin = createAdminClient();

    if (!admin) {
      return {
        ok: false,
        message: "Configure SUPABASE_SERVICE_ROLE_KEY nas variáveis do servidor para editar usuários.",
      };
    }

    const profileId = getProfileIdFromForm(formData);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = normalizeManagedRole(formData.get("role"));
    const isActive = getBooleanFromForm(formData, "isActive");
    const mustChangePassword = getBooleanFromForm(formData, "mustChangePassword");
    const projectIds = roleHasProjectScope(role)
      ? formData.getAll("projectIds").map(String)
      : [];

    if (name.length < 2) {
      return { ok: false, message: "Informe o nome do usuário." };
    }

    if (!email.includes("@")) {
      return { ok: false, message: "Informe um e-mail válido." };
    }

    if (roleHasProjectScope(role) && projectIds.length === 0) {
      return { ok: false, message: "Selecione ao menos um projeto para este usuário." };
    }

    const authUserResult = await admin.auth.admin.getUserById(profileId);

    if (authUserResult.error || !authUserResult.data.user) {
      return {
        ok: false,
        message: authUserResult.error?.message ?? "Usuário não encontrado no Supabase Auth.",
      };
    }

    const currentMetadata =
      authUserResult.data.user.user_metadata &&
      typeof authUserResult.data.user.user_metadata === "object"
        ? authUserResult.data.user.user_metadata
        : {};

    const authUpdate = await admin.auth.admin.updateUserById(profileId, {
      email,
      email_confirm: true,
      user_metadata: {
        ...currentMetadata,
        name,
        role,
        projectSlugs: projectIds,
      },
    });

    if (authUpdate.error) {
      return { ok: false, message: normalizeCreateUserError(authUpdate.error) };
    }

    const profileResult = await admin.from("profiles").upsert(
      {
        id: profileId,
        name,
        email,
        role,
        is_active: isActive,
        must_change_password: mustChangePassword,
      } as never,
      { onConflict: "id" },
    );

    if (profileResult.error) {
      return { ok: false, message: normalizeCreateUserError(profileResult.error) };
    }

    await persistProjectAccess(profileId, projectIds);

    revalidatePath("/configuracoes/usuarios", "page");

    return { ok: true, message: "Login atualizado com sucesso." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível editar o usuário.",
    };
  }
}

export async function resetUserPassword(
  formData: FormData,
): Promise<UserManagementActionState> {
  try {
    await requireUserManagementAccess();

    const admin = createAdminClient();

    if (!admin) {
      return {
        ok: false,
        message: "Configure SUPABASE_SERVICE_ROLE_KEY nas variáveis do servidor para alterar senhas.",
      };
    }

    const profileId = getProfileIdFromForm(formData);
    const password = String(formData.get("password") ?? "");

    if (password.length < 8) {
      return { ok: false, message: "A nova senha precisa ter pelo menos 8 caracteres." };
    }

    const authUpdate = await admin.auth.admin.updateUserById(profileId, {
      password,
    });

    if (authUpdate.error) {
      return { ok: false, message: authUpdate.error.message };
    }

    const profileResult = await admin
      .from("profiles")
      .update({ must_change_password: true } as never)
      .eq("id", profileId);

    if (profileResult.error) {
      return { ok: false, message: profileResult.error.message };
    }

    revalidatePath("/configuracoes/usuarios", "page");

    return {
      ok: true,
      message: "Senha temporária alterada. O usuário será obrigado a redefinir no próximo login.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível alterar a senha.",
    };
  }
}

export async function deleteUser(
  formData: FormData,
): Promise<UserManagementActionState> {
  try {
    const currentProfile = await requireUserManagementAccess();
    const profileId = getProfileIdFromForm(formData);

    if (currentProfile.id === profileId) {
      return { ok: false, message: "Você não pode excluir o próprio login enquanto está conectado." };
    }

    const admin = createAdminClient();

    if (!admin) {
      return {
        ok: false,
        message: "Configure SUPABASE_SERVICE_ROLE_KEY nas variáveis do servidor para excluir usuários.",
      };
    }

    const membershipsResult = await admin
      .from("project_memberships")
      .delete()
      .eq("profile_id", profileId);

    if (membershipsResult.error && !isProjectMembershipsUnavailable(membershipsResult.error)) {
      return { ok: false, message: membershipsResult.error.message };
    }

    await admin.from("profiles").delete().eq("id", profileId);

    const deleteResult = await admin.auth.admin.deleteUser(profileId);

    if (deleteResult.error && !/not found|does not exist/i.test(deleteResult.error.message)) {
      return { ok: false, message: deleteResult.error.message };
    }

    revalidatePath("/configuracoes/usuarios", "page");

    return { ok: true, message: "Login excluído do sistema." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível excluir o usuário.",
    };
  }
}


export async function logout() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
