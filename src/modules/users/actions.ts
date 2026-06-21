"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/require-role";

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
    confirmation?: string[];
  };
};

export type CreateUserState = {
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    role?: string[];
    tempPassword?: string[];
    confirmPassword?: string[];
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

const userManagerRoles = ["admin", "super_admin"];

async function resolveProjectIds(projectKeys: string[]) {
  const admin = createAdminClient();

  if (!admin || projectKeys.length === 0) {
    return [];
  }

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
    redirect("/dashboard");
  }

  const supabase = await createClient();

  if (!supabase) {
    redirect("/dashboard");
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

  redirect("/dashboard");
}

export async function updatePassword(
  _state: PasswordResetState | undefined,
  formData: FormData,
): Promise<PasswordResetState | undefined> {
  const parsed = passwordResetSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Revise os campos da nova senha.",
    };
  }

  if (!hasSupabaseServerEnv()) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  if (!supabase) {
    redirect("/dashboard");
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

  redirect("/dashboard");
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
      confirmPassword: formData.get("confirmPassword"),
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

    const { data, error } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.tempPassword,
      email_confirm: true,
      user_metadata: { name: parsed.data.name },
    });

    if (error || !data.user) {
      return {
        message: error?.message ?? "Não foi possível criar o usuário.",
      };
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      is_active: true,
      must_change_password: parsed.data.mustChangePassword,
    } as never);

    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return {
        message: profileError.message,
      };
    }

    try {
      await replaceProjectMemberships(data.user.id, parsed.data.projectIds);
    } catch (membershipError) {
      await admin.from("profiles").delete().eq("id", data.user.id);
      await admin.auth.admin.deleteUser(data.user.id);

      return {
        message:
          membershipError instanceof Error
            ? membershipError.message
            : "Não foi possível definir os projetos deste usuário.",
      };
    }

    return {
      message: `Usuário ${parsed.data.name} criado no Supabase.`,
      user: {
        id: data.user.id,
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
      message: error instanceof Error ? error.message : "Erro inesperado ao criar o usuário.",
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

    await replaceProjectMemberships(profileId, projectIds);
    revalidatePath("/configuracoes/usuarios");

    return { ok: true, message: "Acesso aos projetos atualizado." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível atualizar os acessos.",
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
