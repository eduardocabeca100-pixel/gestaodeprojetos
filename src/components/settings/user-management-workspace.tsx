"use client";

import { startTransition, useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderCheck, LockKeyhole, Save, ShieldCheck, UserPlus } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { projectManagerRoles, type Role } from "@/lib/auth/permissions";
import type { Project } from "@/modules/projects/types";
import {
  createUser,
  type CreateUserState,
  updateUserProjectAccess,
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
          projectIds: createdUser.projectIds,
        }
      : null;

    const baseUsers = nextCreatedUser
      ? [nextCreatedUser, ...users.filter((user) => user.id !== nextCreatedUser.id)]
      : users;

    return baseUsers.map((user) => {
      const projectIds = projectAccessOverrides[user.id];

      return projectIds
        ? { ...user, projectIds }
        : user;
    });
  }, [createdUser, projectAccessOverrides, users]);
  const scopedUsers = managedUsers.filter((user) => user.role === "diretor_executivo");

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
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Usuários configurados" value={String(managedUsers.length)} />
        <StatCard title="Acesso limitado" value={String(scopedUsers.length)} />
        <StatCard title="Projetos disponíveis" value={String(projects.length)} />
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Acesso executivo protegido por projeto</h2>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              O Diretor/Produtor Executivo enxerga somente os projetos marcados abaixo,
              incluindo o financeiro desses projetos. Novos projetos ficam ocultos até
              o Administrador Geral ou Super Admin liberar o acesso manualmente.
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
        title="Acesso da direção executiva"
        description="Revise ou altere os projetos visíveis para cada Diretor/Produtor Executivo."
      >
            {scopedUsers.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {scopedUsers.map((user) => (
              <ProjectAccessEditor
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
            Cadastre um Diretor/Produtor Executivo para definir o projeto de trabalho.
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ProjectAccessEditor({
  user,
  projects,
  onUpdated,
}: {
  user: UserProjectAccess;
  projects: Project[];
  onUpdated: (profileId: string, projectIds: string[]) => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateUserProjectAccess, {
    ok: false,
    message: "Marque os projetos permitidos.",
  });

  useEffect(() => {
    if (!state.ok) {
      return;
    }

    startTransition(() => router.refresh());
  }, [router, state.ok]);

  return (
    <form
      action={async (formData) => {
        onUpdated(user.id, formData.getAll("projectIds").map(String));
        await action(formData);
      }}
      className="rounded-lg border border-border bg-white p-4 soft-shadow"
    >
      <input type="hidden" name="profileId" value={user.id} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          {roleLabels[user.role]}
        </span>
      </div>

      <div className="my-4 border-t border-border" />
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <FolderCheck className="size-4 text-primary" />
        Projetos visíveis
      </div>
      <ProjectCheckboxes projects={projects} defaultProjectIds={user.projectIds} />

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className={state.ok ? "text-xs text-emerald-700" : "text-xs text-muted-foreground"}>
          {state.message}
        </p>
        <Button size="sm" type="submit" disabled={pending}>
          <Save className="size-3.5" />
          {pending ? "Salvando..." : "Salvar acesso"}
        </Button>
      </div>
    </form>
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
