import "server-only";

import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { listTeamMembers } from "@/modules/team/queries";
import type { TeamMember } from "@/modules/team/types";

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function money(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value: unknown) {
  return text(value) || "Pendente";
}

function idFrom(row: AnyRow, table: string, index: number) {
  return (
    text(row.id) ||
    text(row.member_id) ||
    text(row.person_id) ||
    text(row.user_id) ||
    `${table}-${index}`
  );
}

function mapRow(row: AnyRow, projectId: string, table: string, index: number): TeamMember {
  const name =
    text(row.name) ||
    text(row.full_name) ||
    text(row.fullName) ||
    text(row.member_name) ||
    text(row.person_name) ||
    text(row.display_name) ||
    text(row.nome) ||
    "Pessoa sem nome";

  const role =
    text(row.role) ||
    text(row.function) ||
    text(row.position) ||
    text(row.rubric) ||
    text(row.category) ||
    text(row.area) ||
    text(row.area_atuacao) ||
    text(row.funcao) ||
    "Equipe";

  return {
    id: idFrom(row, table, index),
    projectId:
      text(row.project_id) ||
      text(row.projectId) ||
      text(row.project) ||
      projectId,
    name,
    role,
    document:
      text(row.document) ||
      text(row.cpf) ||
      text(row.cnpj) ||
      text(row.cpf_cnpj) ||
      text(row.document_number),
    email: text(row.email),
    phone:
      text(row.phone) ||
      text(row.telefone) ||
      text(row.whatsapp) ||
      text(row.mobile),
    expectedAmount:
      money(row.expectedAmount) ||
      money(row.expected_amount) ||
      money(row.amount) ||
      money(row.value) ||
      money(row.payment_amount) ||
      money(row.budget_amount) ||
      money(row.planned_amount),
    paidAmount:
      money(row.paidAmount) ||
      money(row.paid_amount),
    paymentStatus:
      normalizeStatus(row.paymentStatus) ||
      normalizeStatus(row.payment_status),
    documents: Array.isArray(row.documents) ? row.documents : [],
    status: text(row.status) || "Ativo",
    notes:
      text(row.notes) ||
      text(row.bio) ||
      text(row.description) ||
      text(row.observations),
  } as TeamMember;
}

function dedupe(members: TeamMember[]) {
  const map = new Map<string, TeamMember>();

  for (const member of members) {
    if (!member.name || member.name === "Pessoa sem nome") continue;

    const key =
      text(member.document).toLowerCase() ||
      text(member.email).toLowerCase() ||
      `${text(member.name).toLowerCase()}|${text(member.role).toLowerCase()}`;

    const previous = map.get(key);

    map.set(key, {
      ...(previous ?? member),
      ...member,
      document: member.document || previous?.document || "",
      email: member.email || previous?.email || "",
      phone: member.phone || previous?.phone || "",
      expectedAmount: Number(member.expectedAmount || previous?.expectedAmount || 0),
      paidAmount: Number(member.paidAmount || previous?.paidAmount || 0),
      paymentStatus: member.paymentStatus || previous?.paymentStatus || "Pendente",
      documents: Array.isArray(member.documents) ? member.documents : previous?.documents || [],
      notes: member.notes || previous?.notes || "",
    } as TeamMember);
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

async function selectRows(table: string, projectId: string) {
  if (!hasSupabaseServerEnv()) return [] as AnyRow[];

  const supabase = await createClient();
  if (!supabase) return [] as AnyRow[];

  const attempts = [
    () => (supabase as any).from(table).select("*").eq("project_id", projectId),
    () => (supabase as any).from(table).select("*").eq("projectId", projectId),
    () => (supabase as any).from(table).select("*").eq("project", projectId),
    () => (supabase as any).from(table).select("*").or(`project_id.eq.${projectId},project_id.is.null`),
    () => (supabase as any).from(table).select("*"),
  ];

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt();
      if (!error && Array.isArray(data)) return data as AnyRow[];
    } catch {
      // tenta próximo formato/tabela
    }
  }

  return [];
}

export async function listFinanceTeamMembers(projectId: string) {
  const baseMembers = await listTeamMembers(projectId);

  const tables = [
    "team_members",
    "project_team_members",
    "project_members",
    "project_team",
    "team_roster",
    "team_assignments",
    "team_roster_assignments",
    "people",
    "professionals",
    "participants",
  ];

  const rowsByTable = await Promise.all(
    tables.map(async (table) => ({
      table,
      rows: await selectRows(table, projectId),
    })),
  );

  const extraMembers = rowsByTable.flatMap(({ table, rows }) =>
    rows.map((row, index) => mapRow(row, projectId, table, index)),
  );

  return dedupe([...baseMembers, ...extraMembers]);
}
