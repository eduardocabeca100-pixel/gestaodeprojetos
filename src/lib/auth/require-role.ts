import { redirect } from "next/navigation";
import { cache } from "react";

import { canAccessRole, dashboardRoles, type Role } from "@/lib/auth/permissions";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
  must_change_password: boolean;
};

export const demoProfile: CurrentProfile = {
  id: "demo-admin",
  name: "Administrador Geral",
  email: "admin@ciaviva.com",
  role: "admin",
  avatar_url: null,
  is_active: true,
  must_change_password: false,
};

export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
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

  const profileResult = await supabase
    .from("profiles")
    .select("id, name, email, role, avatar_url, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileResult.data as CurrentProfile | null;

  if (!profile) {
    return {
      id: user.id,
      name: user.user_metadata?.name ?? user.email ?? "Usuário",
      email: user.email ?? "",
      role: "visualizador",
      avatar_url: null,
      is_active: true,
      must_change_password: false,
    };
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatar_url: profile.avatar_url,
    is_active: profile.is_active,
    must_change_password: profile.must_change_password ?? false,
  };
});

export async function requireAuthorizedProfile(
  roles: Role[] = [...dashboardRoles],
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
