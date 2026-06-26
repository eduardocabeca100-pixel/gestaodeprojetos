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

function pick(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== null && value !== undefined && String(value).trim()) {
      return value;
    }
  }

  return "";
}

function mapRow(row: AnyRow, projectId: string, table: string, index: number): TeamMember {
  const name = text(
    pick(row, [
      "name",
      "full_name",
      "fullName",
      "member_name",
      "person_name",
      "display_name",
      "nome",
    ]),
  );

  const role = text(
    pick(row, [
      "role",
      "function",
      "position",
      "funcao",
      "area",
      "area_atuacao",
      "rubric",
      "category",
      "description",
    ]),
  );

  return {
    id:
      text(
        pick(row, [
          "id",
          "member_id",
          "person_id",
          "team_roster_id",
          "teamRosterId",
          "user_id",
        ]),
      ) || `${table}-${index}-${name}`,
    projectId:
      text(pick(row, ["project_id", "projectId", "project"])) || projectId,
    name: name || "Pessoa sem nome",
    role: role || "Equipe",
    document: text(
      pick(row, ["document", "cpf", "cnpj", "cpf_cnpj", "document_number"]),
    ),
    email: text(pick(row, ["email"])),
    phone: text(pick(row, ["phone", "telefone", "whatsapp", "mobile"])),
    expectedAmount: money(
      pick(row, [
        "expectedAmount",
        "expected_amount",
        "amount",
        "value",
        "payment_amount",
        "budget_amount",
        "planned_amount",
      ]),
    ),
    paidAmount: money(pick(row, ["paidAmount", "paid_amount"])),
    paymentStatus: text(pick(row, ["paymentStatus", "payment_status"])) || "Pendente",
    documents: Array.isArray(row.documents) ? row.documents : [],
    status: text(pick(row, ["status"])) || "Ativo",
    notes: text(
      pick(row, [
        "notes",
        "bio",
        "description",
        "observations",
        "curriculum",
        "resume",
      ]),
    ),
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
      documents: Array.isArray(member.documents)
        ? member.documents
        : previous?.documents || [],
      notes: member.notes || previous?.notes || "",
    } as TeamMember);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}

async function selectRows(table: string, projectId: string) {
  if (!hasSupabaseServerEnv()) return [] as AnyRow[];

  const supabase = await createClient();
  if (!supabase) return [] as AnyRow[];

  const client = supabase as any;

  const attempts = [
    () => client.from(table).select("*").eq("project_id", projectId),
    () => client.from(table).select("*").eq("projectId", projectId),
    () => client.from(table).select("*").eq("project", projectId),
    () => client.from(table).select("*"),
  ];

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt();

      if (!error && Array.isArray(data)) {
        return data as AnyRow[];
      }
    } catch {
      // tenta próxima forma
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
    "team_roster_members",
    "team_roster_assignments",
    "team_assignments",
    "team_roster_assignment",
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
