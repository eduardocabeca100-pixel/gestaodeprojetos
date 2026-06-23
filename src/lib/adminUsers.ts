import { getSupabaseClient } from "./supabase";

export type AdminRole = "diretor_executivo" | "admin" | "super_admin";

export type CreateAdminUserInput = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  permissions?: string[];
};

export async function createAdminUser(input: CreateAdminUserInput) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke("create-admin-user", {
    body: input,
  });

  if (error) {
    throw new Error(error.message || "Erro ao criar usuário administrativo.");
  }

  return data;
}
