import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { ensureSeedProjects } from "@/modules/projects/queries";

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

  await ensureSeedProjects();

  const [profilesResult, membershipsResult, projectsResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, name, email, role, is_active")
      .order("name"),
    admin.from("project_memberships").select("profile_id, project_id"),
    admin.from("projects").select("id, slug"),
  ]);

  if (profilesResult.error || projectsResult.error) {
    return [];
  }

  const projectSlugs = new Map(
    projectsResult.data.map((project) => [project.id, project.slug]),
  );
  const membershipsAvailable =
    !membershipsResult.error ||
    membershipsResult.error.code !== "PGRST205";
  const memberships = membershipsResult.data ?? [];

  const scopedUsers = await Promise.all(
    profilesResult.data.map(async (profile) => {
      let projectIds = memberships
        .filter((membership) => membership.profile_id === profile.id)
        .map((membership) => projectSlugs.get(membership.project_id))
        .filter((slug): slug is string => Boolean(slug));

      if (projectIds.length === 0 && (!membershipsAvailable || profile.role === "diretor_executivo")) {
        const userResult = await admin.auth.admin.getUserById(profile.id);
        const metadata =
          userResult.data.user?.user_metadata &&
          typeof userResult.data.user.user_metadata === "object"
            ? userResult.data.user.user_metadata
            : {};
        const metadataProjectSlugs = Array.isArray(metadata.projectSlugs)
          ? metadata.projectSlugs.filter((slug): slug is string => typeof slug === "string")
          : [];

        if (metadataProjectSlugs.length > 0) {
          projectIds = metadataProjectSlugs;
        }
      }

      return {
        ...profile,
        projectIds,
      };
    }),
  );

  return scopedUsers;
}
