import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { roles, type Role } from "@/lib/auth/permissions";
import { ensureSeedProjects } from "@/modules/projects/queries";

import type { Profile, UserProjectAccess } from "./types";

export async function listUsers(): Promise<Profile[]> {
  return [];
}

const demoUsers: UserProjectAccess[] = [
  {
    id: "demo-admin",
    name: "Administrador Geral",
    email: "admin@ciaviva.com",
    role: "admin",
    is_active: true,
    must_change_password: false,
    projectIds: [],
  },
  {
    id: "demo-executive-director",
    name: "Diretor executivo do projeto",
    email: "direcao@ciaviva.com",
    role: "diretor_executivo",
    is_active: true,
    must_change_password: false,
    projectIds: ["formacao-artistas-rua-espetaculo-refens"],
  },
];

function normalizeRole(role: unknown): Role {
  return roles.includes(role as Role) ? (role as Role) : "visualizador";
}

function metadataProjectSlugs(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  const projectSlugs = (metadata as { projectSlugs?: unknown }).projectSlugs;

  return Array.isArray(projectSlugs)
    ? projectSlugs.filter((slug): slug is string => typeof slug === "string")
    : [];
}

export async function listUsersWithProjectAccess(): Promise<UserProjectAccess[]> {
  if (!hasSupabaseServerEnv()) {
    return demoUsers;
  }

  const admin = createAdminClient();

  if (!admin) {
    return demoUsers;
  }

  await ensureSeedProjects();

  const [profilesResult, membershipsResult, projectsResult, authUsersResult] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, name, email, role, is_active, must_change_password")
        .order("name"),
      admin.from("project_memberships").select("profile_id, project_id"),
      admin.from("projects").select("id, slug"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

  const profiles = profilesResult.error ? [] : profilesResult.data ?? [];
  const projects = projectsResult.error ? [] : projectsResult.data ?? [];
  const memberships = membershipsResult.error ? [] : membershipsResult.data ?? [];
  const authUsers = authUsersResult.error
    ? []
    : ((authUsersResult.data?.users ?? []) as Array<{
        id: string;
        email?: string | null;
        user_metadata?: Record<string, unknown> | null;
      }>);

  const projectSlugs = new Map(projects.map((project) => [project.id, project.slug]));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const usedIds = new Set<string>();

  const getProjectIds = (profileId: string, metadata: unknown) => {
    const fromMemberships = memberships
      .filter((membership) => membership.profile_id === profileId)
      .map((membership) => projectSlugs.get(membership.project_id))
      .filter((slug): slug is string => Boolean(slug));

    return fromMemberships.length > 0 ? fromMemberships : metadataProjectSlugs(metadata);
  };

  const usersFromAuth = authUsers.map((authUser) => {
    usedIds.add(authUser.id);

    const profile = profileById.get(authUser.id);
    const metadata = authUser.user_metadata ?? {};
    const email = profile?.email ?? authUser.email ?? "";

    return {
      id: authUser.id,
      name:
        profile?.name ??
        (typeof metadata.name === "string" ? metadata.name : null) ??
        email.split("@")[0] ??
        "Usuário sem nome",
      email,
      role: normalizeRole(profile?.role ?? metadata.role),
      is_active: profile?.is_active ?? true,
      must_change_password: profile?.must_change_password ?? false,
      projectIds: getProjectIds(authUser.id, metadata),
    } satisfies UserProjectAccess;
  });

  const orphanProfiles = profiles
    .filter((profile) => !usedIds.has(profile.id))
    .map((profile) => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: normalizeRole(profile.role),
      is_active: profile.is_active,
      must_change_password: profile.must_change_password ?? false,
      projectIds: getProjectIds(profile.id, {}),
    } satisfies UserProjectAccess));

  return [...usersFromAuth, ...orphanProfiles].sort((a, b) => {
    const order: Record<Role, number> = {
      super_admin: 0,
      admin: 1,
      diretor_executivo: 2,
      financeiro: 3,
      editor_projeto: 4,
      equipe_tecnica: 5,
      visualizador: 6,
    };

    return order[a.role] - order[b.role] || a.name.localeCompare(b.name);
  });
}
