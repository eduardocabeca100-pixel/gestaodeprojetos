import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

import type { Profile, UserProjectAccess } from "./types";

export async function listUsers(): Promise<Profile[]> {
  return [];
}

const demoUsers: UserProjectAccess[] = [
  {
    id: "demo-executive-director",
    name: "Diretor executivo do projeto",
    email: "direcao@ciaviva.com",
    role: "diretor_executivo",
    is_active: true,
    projectIds: ["formacao-artistas-rua-espetaculo-refens"],
  },
];

export async function listUsersWithProjectAccess(): Promise<UserProjectAccess[]> {
  if (!hasSupabaseServerEnv()) {
    return demoUsers;
  }

  const admin = createAdminClient();

  if (!admin) {
    return [];
  }

  const [profilesResult, membershipsResult, projectsResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, name, email, role, is_active")
      .order("name"),
    admin.from("project_memberships").select("profile_id, project_id"),
    admin.from("projects").select("id, slug"),
  ]);

  if (profilesResult.error || membershipsResult.error || projectsResult.error) {
    return [];
  }

  const projectSlugs = new Map(
    projectsResult.data.map((project) => [project.id, project.slug]),
  );

  return profilesResult.data.map((profile) => ({
    ...profile,
    projectIds: membershipsResult.data
      .filter((membership) => membership.profile_id === profile.id)
      .map((membership) => projectSlugs.get(membership.project_id))
      .filter((slug): slug is string => Boolean(slug)),
  }));
}
