"use server";

import { redirect } from "next/navigation";

import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

import { loginSchema } from "./schemas";

export type LoginState = {
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
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

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      message: "E-mail ou senha inválidos.",
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
