"use client";

import { useActionState, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth/permissions";
import { createUser } from "@/modules/users/actions";

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
  diretor_executivo: "Direção Executiva",
  financeiro: "Financeiro",
  editor_projeto: "Editor de Projeto",
  equipe_tecnica: "Equipe Técnica",
  visualizador: "Visualizador",
};

export function UserManagementWorkspace() {
  const [state, action, pending] = useActionState(createUser, undefined);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "diretor_executivo" as Role,
    tempPassword: "",
    confirmPassword: "",
    mustChangePassword: true,
  });
  const createdUser = state?.user ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Usuários criados" value={createdUser ? "1" : "0"} />
        <StatCard title="Ativos" value={createdUser?.isActive ? "1" : "0"} />
        <StatCard title="Troca obrigatória" value={createdUser?.mustChangePassword ? "1" : "0"} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Criar usuário"
          description="Central para adicionar pessoas, definir papel e exigir nova senha no primeiro acesso."
          actions={
            <Button form="user-create-form" type="submit" disabled={pending}>
              <UserPlus className="size-4" />
              {pending ? "Criando..." : "Adicionar usuário"}
            </Button>
          }
        >
          <form id="user-create-form" action={action} className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <input
                className="form-input mt-1"
                name="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome da pessoa"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">E-mail</span>
              <input
                className="form-input mt-1"
                type="email"
                name="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="usuario@ciaviva.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Perfil</span>
              <select
                className="form-input mt-1"
                name="role"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
              >
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Senha temporária</span>
              <input
                className="form-input mt-1"
                type="password"
                name="tempPassword"
                value={form.tempPassword}
                onChange={(event) => setForm((current) => ({ ...current, tempPassword: event.target.value }))}
                placeholder="Senha para o primeiro acesso"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Confirmar senha</span>
              <input
                className="form-input mt-1"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                placeholder="Repita a senha temporária"
              />
            </label>
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
          </form>
        </SectionCard>

        <SectionCard title="Resumo" description="Último usuário criado nesta sessão.">
          <div className="space-y-3">
            {createdUser ? (
              <article className="rounded-lg border border-border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{createdUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{createdUser.email}</p>
                  </div>
                  <Button size="sm" type="button" variant="outline">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">
                    {roleLabels[createdUser.role as Role]}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-1 font-semibold text-muted-foreground">
                    {createdUser.mustChangePassword ? "Troca obrigatória" : "Senha livre"}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                    {createdUser.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </article>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Nenhum usuário criado ainda.
              </div>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            {state?.message ?? "Cadastre usuários, defina o perfil e marque a troca de senha no primeiro acesso."}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
