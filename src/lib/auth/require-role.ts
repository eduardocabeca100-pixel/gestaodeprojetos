import { redirect } from "next/navigation";

import { canAccessRole, type Role } from "@/lib/auth/permissions";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
};

export const demoProfile: CurrentProfile = {
  id: "demo-admin",
  name: "Eduardo / Marcel",
  email: "admin@viva.local",
  role: "admin",
  avatar_url: null,
  is_active: true,
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  if (!hasSupabaseServerEnv()) {
    return demoProfile;
  }

  const supabase = await createClient();

  if (!supabase) {
    return demoProfile;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role, avatar_url, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      id: user.id,
      name: user.user_metadata?.name ?? user.email ?? "Usuário",
      email: user.email ?? "",
      role: "visualizador",
      avatar_url: null,
      is_active: true,
    };
  }

  return profile;
}

export async function requireAuthorizedProfile(
  roles: Role[] = ["admin", "diretor_executivo"],
) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.is_active || !roles.includes(profile.role)) {
    redirect("/acesso-negado");
  }

  return profile;
}

export function assertOperationalRole(role: string | null | undefined) {
  return canAccessRole(role);
}
