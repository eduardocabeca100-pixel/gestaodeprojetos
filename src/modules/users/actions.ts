"use server";

import { redirect } from "next/navigation";

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
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
    isActive: boolean;
  };
};

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

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      message: "Não foi possível atualizar a senha agora.",
    };
  }

  await supabase
    .from("profiles")
    .update({ must_change_password: false } as never)
    .eq("id", user.id);

  redirect("/dashboard");
}

export async function createUser(
  _state: CreateUserState | undefined,
  formData: FormData,
): Promise<CreateUserState | undefined> {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile || !["admin", "super_admin"].includes(currentProfile.role)) {
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
      return {
        message: profileError.message,
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
      },
    };
  } catch (error) {
    console.error("createUser failed", error);

    return {
      message: error instanceof Error ? error.message : "Erro inesperado ao criar o usuário.",
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
