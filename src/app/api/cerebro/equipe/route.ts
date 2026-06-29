import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { listFinanceTeamMembers } from "@/modules/team/finance-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function normalize(row: AnyRow, projectId = "") {
  const name = text(
    pick(row, [
      "name",
      "nome",
      "full_name",
      "fullName",
      "member_name",
      "person_name",
      "display_name",
    ]),
  );

  const role = text(
    pick(row, [
      "role",
      "funcao",
      "function",
      "position",
      "area",
      "area_atuacao",
      "category",
      "description",
    ]),
  );

  return {
    id:
      text(
        pick(row, [
          "id",
          "uuid",
          "team_roster_id",
          "teamRosterId",
          "member_id",
          "person_id",
        ]),
      ) || `${projectId || "viva"}-${name}`,
    name,
    role: role || "Equipe",
    area: text(pick(row, ["area", "area_atuacao"])) || role || "Artes cênicas",
    cpf: text(pick(row, ["cpf", "document", "document_number", "cpf_cnpj"])),
    cnpj: text(pick(row, ["cnpj"])),
    email: text(pick(row, ["email"])),
    phone: text(pick(row, ["phone", "telefone", "whatsapp", "mobile"])),
    city: text(pick(row, ["city", "cidade", "cityState", "city_state"])) || "Jaraguá do Sul/SC",
    address: text(pick(row, ["address", "endereco"])),
    fee: money(pick(row, ["fee", "expectedAmount", "expected_amount", "amount", "value"])),
    resumeShort: text(pick(row, ["resumeShort", "resume_short", "mini_curriculo", "notes"])),
    resume: text(pick(row, ["resume", "curriculum", "curriculo", "bio", "notes"])),
    portfolioText: text(pick(row, ["portfolioText", "portfolio", "portfolio_text"])),
    editalFunction: text(pick(row, ["editalFunction", "edital_function"])) || role || "Equipe",
    observations: text(pick(row, ["observations", "notes", "observacoes"])),
    source: "viva",
  };
}

function dedupe(team: ReturnType<typeof normalize>[]) {
  const map = new Map<string, ReturnType<typeof normalize>>();

  for (const member of team) {
    if (!member.name) continue;

    const key =
      member.cpf.toLowerCase() ||
      member.email.toLowerCase() ||
      `${member.name.toLowerCase()}|${member.role.toLowerCase()}`;

    const old = map.get(key);

    map.set(key, {
      ...(old ?? member),
      ...member,
      resume: member.resume || old?.resume || "",
      portfolioText: member.portfolioText || old?.portfolioText || "",
      observations: member.observations || old?.observations || "",
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

async function selectRows(table: string, projectId: string) {
  if (!hasSupabaseServerEnv()) return [] as AnyRow[];

  const supabase = await createClient();
  const client = supabase as any;

  if (!client) return [] as AnyRow[];

  const attempts = projectId
    ? [
        () => client.from(table).select("*").eq("project_id", projectId).limit(300),
        () => client.from(table).select("*").eq("projectId", projectId).limit(300),
        () => client.from(table).select("*").eq("project", projectId).limit(300),
        () => client.from(table).select("*").limit(300),
      ]
    : [() => client.from(table).select("*").limit(300)];

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt();

      if (!error && Array.isArray(data)) {
        return data as AnyRow[];
      }
    } catch {
      // tenta próxima tabela/formato
    }
  }

  return [];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = text(url.searchParams.get("projectId") || url.searchParams.get("project"));

  const team: ReturnType<typeof normalize>[] = [];

  if (projectId) {
    try {
      const financeTeam = await listFinanceTeamMembers(projectId);
      team.push(...financeTeam.map((member) => normalize(member as unknown as AnyRow, projectId)));
    } catch {
      // tenta tabelas abaixo
    }
  }

  const tables = [
    "team_roster",
    "team_roster_members",
    "team_members",
    "project_team_members",
    "project_members",
    "project_team",
    "team_roster_assignments",
    "team_assignments",
    "professionals",
    "people",
    "participants",
  ];

  const rowsByTable = await Promise.all(
    tables.map(async (table) => ({
      table,
      rows: await selectRows(table, projectId),
    })),
  );

  for (const { rows } of rowsByTable) {
    team.push(...rows.map((row) => normalize(row, projectId)));
  }

  return Response.json({
    ok: true,
    projectId,
    team: dedupe(team),
  });
}

export async function POST(request: Request) {
  if (!hasSupabaseServerEnv()) {
    return Response.json({
      ok: false,
      message: "Supabase não configurado no servidor.",
    });
  }

  const body = await request.json().catch(() => ({}));
  const member = (body.member || body) as AnyRow;

  const name = text(pick(member, ["name", "nome"]));
  const role = text(pick(member, ["role", "funcao", "area"])) || "Equipe";

  if (!name) {
    return Response.json({
      ok: false,
      message: "Nome do integrante não informado.",
    });
  }

  const supabase = await createClient();
  const client = supabase as any;

  if (!client) {
    return Response.json({
      ok: false,
      message: "Não foi possível conectar ao Supabase.",
    });
  }

  const payloads = [
    {
      table: "team_roster",
      data: {
        name,
        role,
        document: text(pick(member, ["cpf", "document"])),
        email: text(pick(member, ["email"])),
        phone: text(pick(member, ["phone", "telefone"])),
        notes: text(pick(member, ["resume", "resumeShort", "observations"])),
        status: "Ativo",
      },
    },
    {
      table: "team_members",
      data: {
        name,
        role,
        document: text(pick(member, ["cpf", "document"])),
        email: text(pick(member, ["email"])),
        phone: text(pick(member, ["phone", "telefone"])),
        notes: text(pick(member, ["resume", "resumeShort", "observations"])),
        status: "Ativo",
      },
    },
    {
      table: "professionals",
      data: {
        name,
        role,
        cpf: text(pick(member, ["cpf", "document"])),
        email: text(pick(member, ["email"])),
        phone: text(pick(member, ["phone", "telefone"])),
        notes: text(pick(member, ["resume", "resumeShort", "observations"])),
        status: "Ativo",
      },
    },
  ];

  for (const item of payloads) {
    try {
      const { data, error } = await client.from(item.table).insert(item.data).select("*").single();

      if (!error && data) {
        return Response.json({
          ok: true,
          message: "Integrante salvo na equipe do VIVA.",
          member: normalize(data),
        });
      }
    } catch {
      // tenta próxima tabela
    }
  }

  return Response.json({
    ok: false,
    message: "Não consegui salvar na equipe permanente. O cadastro local continua salvo.",
  });
}
