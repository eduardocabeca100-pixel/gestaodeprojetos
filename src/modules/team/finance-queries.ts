import "server-only";

import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";

import type { TeamMember } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function makeFallbackId(row: Record<string, unknown>, index: number) {
  const name = normalizeText(row.name ?? row.full_name ?? row.fullName ?? row.member_name);
  const document = normalizeText(row.document ?? row.cpf ?? row.cnpj ?? row.cpf_cnpj);
  const email = normalizeText(row.email);

  return `finance-team-${name || email || document || index}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapTeamRow(
  row: Record<string, unknown>,
  projectId: string,
  index: number,
): TeamMember {
  const profile = (row.profile ?? row.profiles ?? {}) as Record<string, unknown>;

  return {
    id: normalizeText(row.id) || normalizeText(row.user_id) || makeFallbackId(row, index),
    projectId: normalizeText(row.project_id) || projectId,
    name:
      normalizeText(row.name) ||
      normalizeText(row.full_name) ||
      normalizeText(row.fullName) ||
      normalizeText(row.member_name) ||
      normalizeText(row.person_name) ||
      normalizeText(profile.name) ||
      "Pessoa sem nome",
    role:
      normalizeText(row.role) ||
      normalizeText(row.function) ||
      normalizeText(row.position) ||
      normalizeText(row.rubric) ||
      normalizeText(row.category) ||
      "Equipe",
    document:
      normalizeText(row.document) ||
      normalizeText(row.cpf) ||
      normalizeText(row.cnpj) ||
      normalizeText(row.cpf_cnpj) ||
      normalizeText(row.document_number),
    email: normalizeText(row.email) || normalizeText(profile.email),
    phone:
      normalizeText(row.phone) ||
      normalizeText(row.telefone) ||
      normalizeText(row.whatsapp) ||
      normalizeText(row.mobile),
    amount:
      normalizeNumber(row.amount) ||
      normalizeNumber(row.value) ||
      normalizeNumber(row.payment_amount) ||
      normalizeNumber(row.budget_amount) ||
      normalizeNumber(row.planned_amount),
    status: normalizeText(row.status) || "Ativo",
    notes: normalizeText(row.notes),
  } as TeamMember;
}

function teamKey(member: TeamMember) {
  const document = normalizeText(member.document).toLowerCase();
  const email = normalizeText(member.email).toLowerCase();
  const nameRole = `${normalizeText(member.name).toLowerCase()}|${normalizeText(member.role).toLowerCase()}`;

  return document || email || nameRole || member.id;
}

function dedupeTeam(members: TeamMember[]) {
  const map = new Map<string, TeamMember>();

  for (const member of members) {
    if (!member.name || member.name === "Pessoa sem nome") continue;

    const key = teamKey(member);
    const previous = map.get(key);

    map.set(key, {
      ...(previous ?? member),
      ...member,
      document: member.document || previous?.document || "",
      email: member.email || previous?.email || "",
      phone: member.phone || previous?.phone || "",
      amount: Number(member.amount || previous?.amount || 0),
      notes: member.notes || previous?.notes || "",
    } as TeamMember);
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

async function trySelect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  mode:
    | { type: "eq"; column: string; value: string | boolean }
    | { type: "is-null"; column: string }
    | { type: "all" },
) {
  if (!supabase) return [] as Record<string, unknown>[];

  let query = (supabase as any).from(table).select("*");

  if (mode.type === "eq") {
    query = query.eq(mode.column, mode.value);
  }

  if (mode.type === "is-null") {
    query = query.is(mode.column, null);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [] as Record<string, unknown>[];
  }

  return data as Record<string, unknown>[];
}

export async function listFinanceTeamMembers(projectId?: string) {
  const project = await getScopedProject(projectId);

  if (!hasSupabaseServerEnv()) {
    return [] satisfies TeamMember[];
  }

  const supabase = await createClient();

  if (!supabase) {
    return [] satisfies TeamMember[];
  }

  const rows: Record<string, unknown>[] = [];

  rows.push(...(await trySelect(supabase, "team_members", {
    type: "eq",
    column: "project_id",
    value: project.id,
  })));

  rows.push(...(await trySelect(supabase, "team_members", {
    type: "is-null",
    column: "project_id",
  })));

  rows.push(...(await trySelect(supabase, "team_members", {
    type: "eq",
    column: "project_id",
    value: "global",
  })));

  rows.push(...(await trySelect(supabase, "team_members", {
    type: "eq",
    column: "is_global",
    value: true,
  })));

  rows.push(...(await trySelect(supabase, "team_members", {
    type: "eq",
    column: "scope",
    value: "global",
  })));

  rows.push(...(await trySelect(supabase, "team_roster", {
    type: "all",
  })));

  return dedupeTeam(rows.map((row, index) => mapTeamRow(row, project.id, index)));
}
