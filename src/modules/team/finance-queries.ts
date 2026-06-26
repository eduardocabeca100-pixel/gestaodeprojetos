import "server-only";

import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { listTeamMembers } from "@/modules/team/queries";
import type { TeamMember } from "@/modules/team/types";

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function makeId(row: AnyRow, index: number) {
  return text(row.id) || text(row.user_id) || `finance-team-${index}`;
}

function mapRow(row: AnyRow, projectId: string, index: number): TeamMember {
  const name =
    text(row.name) ||
    text(row.full_name) ||
    text(row.fullName) ||
    text(row.member_name) ||
    text(row.person_name) ||
    "Pessoa sem nome";

  const expected =
    number(row.expectedAmount) ||
    number(row.expected_amount) ||
    number(row.amount) ||
    number(row.value) ||
    number(row.payment_amount) ||
    number(row.budget_amount) ||
    number(row.planned_amount);

  return {
    id: makeId(row, index),
    projectId: text(row.project_id) || projectId,
    name,
    role:
      text(row.role) ||
      text(row.function) ||
      text(row.position) ||
      text(row.rubric) ||
      text(row.category) ||
      "Equipe",
    document:
      text(row.document) ||
      text(row.cpf) ||
      text(row.cnpj) ||
      text(row.cpf_cnpj) ||
      text(row.document_number),
    email: text(row.email),
    phone: text(row.phone) || text(row.telefone) || text(row.whatsapp) || text(row.mobile),
    expectedAmount: expected,
    paidAmount: number(row.paidAmount) || number(row.paid_amount),
    paymentStatus: text(row.paymentStatus) || text(row.payment_status) || "Pendente",
    documents: Array.isArray(row.documents) ? row.documents : [],
    status: text(row.status) || "Ativo",
    notes: text(row.notes),
  } as TeamMember;
}

function key(member: TeamMember) {
  return (
    text(member.document).toLowerCase() ||
    text(member.email).toLowerCase() ||
    `${text(member.name).toLowerCase()}|${text(member.role).toLowerCase()}`
  );
}

function dedupe(members: TeamMember[]) {
  const map = new Map<string, TeamMember>();

  for (const member of members) {
    if (!member.name || member.name === "Pessoa sem nome") continue;

    const memberKey = key(member);
    const previous = map.get(memberKey);

    map.set(memberKey, {
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

async function trySelect(table: string, mode: "project" | "global" | "all", projectId: string) {
  if (!hasSupabaseServerEnv()) return [] as AnyRow[];

  const supabase = await createClient();

  if (!supabase) return [] as AnyRow[];

  try {
    let query = (supabase as any).from(table).select("*");

    if (mode === "project") {
      query = query.eq("project_id", projectId);
    }

    if (mode === "global") {
      query = query.or("project_id.is.null,project_id.eq.global,is_global.eq.true,scope.eq.global");
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data as AnyRow[];
  } catch {
    return [] as AnyRow[];
  }
}

export async function listFinanceTeamMembers(projectId: string) {
  const projectMembers = await listTeamMembers(projectId);

  const rows = [
    ...(await trySelect("team_members", "project", projectId)),
    ...(await trySelect("team_members", "global", projectId)),
    ...(await trySelect("team_roster", "all", projectId)),
    ...(await trySelect("people", "all", projectId)),
  ];

  const extraMembers = rows.map((row, index) => mapRow(row, projectId, index));

  return dedupe([...projectMembers, ...extraMembers]);
}
