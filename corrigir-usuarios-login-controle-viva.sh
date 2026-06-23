#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo " Corrigindo Configurações > Usuários e Logins"
echo "=================================================="

if [ ! -f package.json ]; then
  echo "ERRO: rode este script na raiz do projeto, onde está o package.json."
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".backup-usuarios-login-$TS"
mkdir -p "$BACKUP_DIR"

echo "Criando backup..."
[ -f src/modules/users/queries.ts ] && cp src/modules/users/queries.ts "$BACKUP_DIR/queries.ts"
[ -f src/modules/users/actions.ts ] && cp src/modules/users/actions.ts "$BACKUP_DIR/actions.ts"
[ -f src/modules/users/types.ts ] && cp src/modules/users/types.ts "$BACKUP_DIR/types.ts"
[ -f src/components/settings/user-management-workspace.tsx ] && cp src/components/settings/user-management-workspace.tsx "$BACKUP_DIR/user-management-workspace.tsx"

echo "Atualizando tipos..."

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/users/types.ts")
text = path.read_text()

text = text.replace(
    '"id" | "name" | "email" | "role" | "is_active"',
    '"id" | "name" | "email" | "role" | "is_active" | "must_change_password"'
)

path.write_text(text)
PY

echo "Atualizando consulta de usuários..."

cat > src/modules/users/queries.ts <<'TSEOF'
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
TSEOF

echo "Adicionando ações de editar, alterar senha e excluir usuário..."

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/users/actions.ts")
text = path.read_text()

if 'from "@/lib/auth/permissions"' not in text:
    text = text.replace(
        'import { getCurrentProfile } from "@/lib/auth/require-role";\n',
        'import { getCurrentProfile } from "@/lib/auth/require-role";\nimport { projectManagerRoles, roles, type Role } from "@/lib/auth/permissions";\n'
    )

if "export type UserManagementActionState" not in text:
    text = text.replace(
        "export type ProjectAccessActionState = {\n  ok: boolean;\n  message: string;\n};\n",
        "export type ProjectAccessActionState = {\n  ok: boolean;\n  message: string;\n};\n\nexport type UserManagementActionState = {\n  ok: boolean;\n  message: string;\n};\n"
    )

insert = r'''

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
'''

if "export async function updateUserDetails" not in text:
    text = text.replace("\nexport async function logout() {", insert + "\n\nexport async function logout() {")

path.write_text(text)
PY

echo "Atualizando tela Configurações > Usuários..."

cat > src/components/settings/user-management-workspace.tsx <<'TSEOF'
"use client";

import { startTransition, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Edit3,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { projectManagerRoles, type Role } from "@/lib/auth/permissions";
import type { Project } from "@/modules/projects/types";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  type CreateUserState,
  updateUserDetails,
} from "@/modules/users/actions";
import type { UserProjectAccess } from "@/modules/users/types";

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
  diretor_executivo: "Diretor / Produtor Executivo",
  financeiro: "Financeiro",
  editor_projeto: "Produtor / Editor de projeto",
  equipe_tecnica: "Equipe Técnica",
  visualizador: "Visualizador",
};

const availableRoles: Role[] = ["super_admin", "admin", "diretor_executivo"];
const initialCreateUserForm = {
  name: "",
  email: "",
  role: "diretor_executivo" as Role,
  tempPassword: "",
  mustChangePassword: true,
};

function hasProjectScope(role: Role) {
  return !projectManagerRoles.includes(role);
}

export function UserManagementWorkspace({
  projects,
  users,
}: {
  projects: Project[];
  users: UserProjectAccess[];
}) {
  const router = useRouter();
  const [createState, setCreateState] = useState<CreateUserState | undefined>(undefined);
  const [form, setForm] = useState(initialCreateUserForm);
  const [createFormVersion, setCreateFormVersion] = useState(0);
  const [projectAccessOverrides, setProjectAccessOverrides] = useState<Record<string, string[]>>({});
  const [pending, startCreateTransition] = useTransition();
  const createdUser = createState?.user ?? null;
  const managedUsers = useMemo(() => {
    const nextCreatedUser = createdUser
      ? {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role as Role,
          is_active: createdUser.isActive,
          must_change_password: createdUser.mustChangePassword,
          projectIds: createdUser.projectIds,
        }
      : null;

    const baseUsers = nextCreatedUser
      ? [nextCreatedUser, ...users.filter((user) => user.id !== nextCreatedUser.id)]
      : users;

    return baseUsers.map((user) => {
      const projectIds = projectAccessOverrides[user.id];

      return projectIds ? { ...user, projectIds } : user;
    });
  }, [createdUser, projectAccessOverrides, users]);
  const scopedUsers = managedUsers.filter((user) => user.role === "diretor_executivo");
  const inactiveUsers = managedUsers.filter((user) => !user.is_active);

  async function handleCreateUser(formData: FormData) {
    startCreateTransition(async () => {
      const result = await createUser(undefined, formData);

      setCreateState(result);

      if (result?.user) {
        setForm(initialCreateUserForm);
        setCreateFormVersion((current) => current + 1);
        startTransition(() => router.refresh());
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Logins cadastrados" value={String(managedUsers.length)} />
        <StatCard title="Acesso limitado" value={String(scopedUsers.length)} />
        <StatCard title="Inativos" value={String(inactiveUsers.length)} />
        <StatCard title="Projetos disponíveis" value={String(projects.length)} />
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Controle real dos logins do sistema</h2>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              Esta tela agora lista todos os logins cadastrados, permite editar dados,
              ativar/desativar acesso, alterar projetos visíveis, redefinir senha e excluir usuário.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Criar usuário"
          description="Cadastre a pessoa, escolha o perfil e limite o acesso aos projetos necessários."
        >
          <form
            key={createFormVersion}
            id="user-create-form"
            action={handleCreateUser}
            className="grid gap-4 md:grid-cols-2"
          >
            {createState?.message ? (
              <div
                className={
                  createState.errors
                    ? "md:col-span-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                    : "md:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                }
              >
                {createState.message}
              </div>
            ) : null}

            <FormField label="Nome" error={createState?.errors?.name?.[0]} wide>
              <input
                className="form-input"
                name="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome da pessoa"
              />
            </FormField>

            <FormField label="E-mail" error={createState?.errors?.email?.[0]} wide>
              <input
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="usuario@ciaviva.com"
              />
            </FormField>

            <FormField label="Perfil" error={createState?.errors?.role?.[0]}>
              <select
                className="form-input"
                name="role"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Senha temporária" error={createState?.errors?.tempPassword?.[0]}>
              <input
                className="form-input"
                type="password"
                name="tempPassword"
                value={form.tempPassword}
                onChange={(event) => setForm((current) => ({ ...current, tempPassword: event.target.value }))}
                placeholder="Mínimo de 8 caracteres"
              />
            </FormField>

            {hasProjectScope(form.role) ? (
              <fieldset className="rounded-lg border border-primary/20 bg-primary/5 p-4 md:col-span-2">
                <legend className="px-1 text-sm font-semibold">Projetos que este usuário poderá acessar</legend>
                <p className="mb-3 mt-1 text-xs leading-5 text-muted-foreground">
                  Todo projeto não marcado, inclusive os que forem criados depois, permanecerá invisível.
                </p>
                <ProjectCheckboxes projects={projects} defaultProjectIds={projects[0] ? [projects[0].slug] : []} />
                {createState?.errors?.projectIds?.[0] ? (
                  <p className="mt-2 text-xs text-destructive">{createState.errors.projectIds[0]}</p>
                ) : null}
              </fieldset>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 md:col-span-2">
                Este perfil administrativo visualiza todos os projetos atuais e futuros.
              </div>
            )}

            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                name="mustChangePassword"
                value="true"
                checked={form.mustChangePassword}
                onChange={(event) => setForm((current) => ({ ...current, mustChangePassword: event.target.checked }))}
              />
              Obrigar redefinição no primeiro login
            </label>

            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={pending}>
                <UserPlus className="size-4" />
                {pending ? "Criando..." : "Adicionar usuário"}
              </Button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Resumo" description="Último usuário criado nesta sessão.">
          {createdUser ? (
            <article className="rounded-lg border border-border bg-white p-3">
              <h3 className="font-semibold">{createdUser.name}</h3>
              <p className="text-sm text-muted-foreground">{createdUser.email}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">
                  {roleLabels[createdUser.role as Role]}
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                  {createdUser.projectIds.length} projeto(s) liberado(s)
                </span>
              </div>
            </article>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Nenhum usuário criado nesta sessão.
            </div>
          )}
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            {createState?.message ?? "O Diretor/Produtor Executivo receberá somente os projetos escolhidos no cadastro."}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Logins cadastrados"
        description="Edite dados, perfil, status, senha, projetos visíveis ou exclua logins do sistema."
      >
        {managedUsers.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {managedUsers.map((user) => (
              <UserAccountEditor
                key={user.id}
                user={user}
                projects={projects}
                onUpdated={(profileId, projectIds) => {
                  setProjectAccessOverrides((current) => ({
                    ...current,
                    [profileId]: projectIds,
                  }));
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
            Nenhum login cadastrado ainda.
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function UserAccountEditor({
  user,
  projects,
  onUpdated,
}: {
  user: UserProjectAccess;
  projects: Project[];
  onUpdated: (profileId: string, projectIds: string[]) => void;
}) {
  const router = useRouter();
  const [pending, startPending] = useTransition();
  const [message, setMessage] = useState("Pronto para editar este login.");
  const [password, setPassword] = useState("");

  const canScopeProjects = hasProjectScope(user.role);

  async function handleUpdate(formData: FormData) {
    startPending(async () => {
      const projectIds = formData.getAll("projectIds").map(String);
      onUpdated(user.id, projectIds);

      const result = await updateUserDetails(formData);
      setMessage(result.message);

      if (result.ok) {
        startTransition(() => router.refresh());
      }
    });
  }

  async function handlePasswordReset(formData: FormData) {
    startPending(async () => {
      const result = await resetUserPassword(formData);
      setMessage(result.message);

      if (result.ok) {
        setPassword("");
        startTransition(() => router.refresh());
      }
    });
  }

  async function handleDelete() {
    if (!window.confirm(`Excluir o login de ${user.name}? Esta ação remove o acesso do usuário.`)) {
      return;
    }

    startPending(async () => {
      const formData = new FormData();
      formData.set("profileId", user.id);

      const result = await deleteUser(formData);
      setMessage(result.message);

      if (result.ok) {
        startTransition(() => router.refresh());
      }
    });
  }

  return (
    <article className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">
              {roleLabels[user.role]}
            </span>
            <span
              className={
                user.is_active
                  ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700"
                  : "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 font-semibold text-destructive"
              }
            >
              {user.is_active ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
              {user.is_active ? "Ativo" : "Inativo"}
            </span>
            {user.must_change_password ? (
              <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                Redefinir senha no login
              </span>
            ) : null}
          </div>
        </div>

        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={pending}>
          <Trash2 className="size-3.5" />
          Excluir
        </Button>
      </div>

      <form action={handleUpdate} className="grid gap-3 md:grid-cols-2">
        <input type="hidden" name="profileId" value={user.id} />

        <FormField label="Nome">
          <input className="form-input" name="name" defaultValue={user.name} />
        </FormField>

        <FormField label="E-mail de login">
          <input className="form-input" type="email" name="email" defaultValue={user.email} />
        </FormField>

        <FormField label="Perfil">
          <select className="form-input" name="role" defaultValue={user.role}>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid content-end gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isActive" value="true" defaultChecked={user.is_active} />
            Login ativo
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="mustChangePassword"
              value="true"
              defaultChecked={user.must_change_password}
            />
            Obrigar troca de senha
          </label>
        </div>

        <fieldset className="rounded-lg border border-border bg-muted/20 p-3 md:col-span-2">
          <legend className="px-1 text-sm font-semibold">Projetos visíveis</legend>
          {canScopeProjects ? (
            <>
              <p className="mb-3 mt-1 text-xs leading-5 text-muted-foreground">
                Para Diretor/Produtor Executivo, marque somente os projetos liberados.
              </p>
              <ProjectCheckboxes projects={projects} defaultProjectIds={user.projectIds} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Administradores visualizam todos os projetos atuais e futuros.
            </p>
          )}
        </fieldset>

        <div className="flex items-center justify-between gap-3 md:col-span-2">
          <p className="text-xs text-muted-foreground">{message}</p>
          <Button size="sm" type="submit" disabled={pending}>
            <Edit3 className="size-3.5" />
            {pending ? "Salvando..." : "Salvar edição"}
          </Button>
        </div>
      </form>

      <form action={handlePasswordReset} className="mt-4 grid gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-3 md:grid-cols-[1fr_auto]">
        <input type="hidden" name="profileId" value={user.id} />
        <input
          className="form-input"
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nova senha temporária, mínimo de 8 caracteres"
        />
        <Button size="sm" type="submit" disabled={pending || password.length < 8}>
          <KeyRound className="size-3.5" />
          Alterar senha
        </Button>
      </form>
    </article>
  );
}

function ProjectCheckboxes({
  projects,
  defaultProjectIds,
}: {
  projects: Project[];
  defaultProjectIds: string[];
}) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum projeto disponível.</p>;
  }

  return (
    <div key={defaultProjectIds.join("|")} className="grid gap-2 sm:grid-cols-2">
      {projects.map((project) => (
        <label
          key={project.id}
          className="flex items-start gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
        >
          <input
            className="mt-1"
            type="checkbox"
            name="projectIds"
            value={project.slug}
            defaultChecked={defaultProjectIds.includes(project.slug)}
          />
          <span>
            <span className="block font-medium">{project.name}</span>
            <span className="block text-xs text-muted-foreground">{project.edital}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function FormField({
  label,
  error,
  children,
  wide,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
          <p className="mt-2 text-xl font-semibold">{value}</p>
        </div>
        <LockKeyhole className="size-5 text-primary/60" />
      </div>
    </div>
  );
}
TSEOF

echo "Protegendo .env e .env.local..."

touch .gitignore
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF ".env.*.local" .gitignore || echo ".env.*.local" >> .gitignore
grep -qxF "!.env.example" .gitignore || echo "!.env.example" >> .gitignore

git rm --cached .env .env.local 2>/dev/null || true

echo "Rodando build..."

npm run build

echo ""
echo "Correção aplicada com sucesso."
echo "Agora a tela deve listar todos os logins e permitir editar, excluir e alterar senha."
