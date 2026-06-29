import { listFinanceTeamMembers } from "@/modules/team/finance-queries";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObject = Record<string, any>;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeForCerebro(member: AnyObject) {
  const name = text(member.name || member.fullName || member.nome);
  const role = text(member.role || member.function || member.funcao || member.area);

  return {
    id: text(member.id || member.teamRosterId || member.team_roster_id || name),
    vivaId: text(member.id || member.teamRosterId || member.team_roster_id),
    name,
    artisticName: text(member.artisticName || member.art || name),
    art: text(member.art || member.artisticName || name),
    role: role || "Equipe",
    area: text(member.area || role || "Artes cênicas"),
    cpf: text(member.cpf || member.document || member.document_number),
    cnpj: text(member.cnpj),
    city: text(member.city || member.cityState || "Jaraguá do Sul/SC"),
    address: text(member.address),
    phone: text(member.phone),
    email: text(member.email),
    fee: numberValue(member.fee || member.expectedAmount || member.expected_amount),
    pix: text(member.pix),
    resumeShort: text(member.resumeShort || member.resume || member.notes),
    resume: text(member.resume || member.resumeShort || member.notes),
    portfolio: text(member.portfolio || member.portfolioText),
    portfolioText: text(member.portfolioText || member.portfolio),
    links: text(member.links || member.linksText),
    linksText: text(member.linksText || member.links),
    docs: text(member.docs || member.docsText),
    docsText: text(member.docsText || member.docs),
    editalFunction: text(member.editalFunction || member.functionDescription || role),
    projectHistory: text(member.projectHistory),
    observations: text(member.observations || member.notes),
    source: "viva",
  };
}

function normalizeFromCerebro(member: AnyObject) {
  const name = text(member.name || member.nome);

  return {
    name,
    role: text(member.role || member.area || member.editalFunction || "Equipe"),
    document: text(member.document || member.cpf),
    cpf: text(member.cpf || member.document),
    cnpj: text(member.cnpj),
    email: text(member.email),
    phone: text(member.phone),
    city: text(member.city || member.cityState || "Jaraguá do Sul/SC"),
    address: text(member.address),
    expectedAmount: numberValue(member.fee || member.expectedAmount),
    notes: [
      text(member.resumeShort) ? `Mini currículo: ${text(member.resumeShort)}` : "",
      text(member.resume) ? `Currículo: ${text(member.resume)}` : "",
      text(member.portfolioText || member.portfolio)
        ? `Portfólio: ${text(member.portfolioText || member.portfolio)}`
        : "",
      text(member.editalFunction) ? `Função no edital: ${text(member.editalFunction)}` : "",
      text(member.linksText || member.links) ? `Links: ${text(member.linksText || member.links)}` : "",
      text(member.observations) ? `Observações: ${text(member.observations)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

async function findOne(client: any, table: string, column: string, value: string) {
  if (!value) return null;

  try {
    const { data, error } = await client.from(table).select("*").eq(column, value).limit(1);

    if (!error && Array.isArray(data) && data[0]) {
      return data[0];
    }
  } catch {
    // tenta próximo campo/tabela
  }

  return null;
}

async function findExistingRoster(client: any, table: string, member: ReturnType<typeof normalizeFromCerebro>) {
  return (
    (await findOne(client, table, "document", member.document)) ||
    (await findOne(client, table, "cpf", member.cpf)) ||
    (await findOne(client, table, "email", member.email)) ||
    (await findOne(client, table, "name", member.name)) ||
    null
  );
}

async function tryInsertRoster(client: any, table: string, member: ReturnType<typeof normalizeFromCerebro>) {
  const payloads = [
    {
      name: member.name,
      role: member.role,
      document: member.document || member.cpf,
      email: member.email,
      phone: member.phone,
      notes: member.notes,
      status: "Ativo",
    },
    {
      name: member.name,
      role: member.role,
      cpf: member.cpf || member.document,
      email: member.email,
      phone: member.phone,
      notes: member.notes,
      status: "Ativo",
    },
    {
      nome: member.name,
      funcao: member.role,
      cpf: member.cpf || member.document,
      email: member.email,
      telefone: member.phone,
      observacoes: member.notes,
      status: "Ativo",
    },
  ];

  for (const payload of payloads) {
    try {
      const { data, error } = await client.from(table).insert(payload).select("*").single();

      if (!error && data) return data;
    } catch {
      // tenta próximo formato
    }
  }

  return null;
}

async function findOrCreateRoster(client: any, member: ReturnType<typeof normalizeFromCerebro>) {
  const rosterTables = ["team_roster", "team_roster_members", "team_members", "professionals", "people"];

  for (const table of rosterTables) {
    const existing = await findExistingRoster(client, table, member);

    if (existing) {
      return { table, row: existing, created: false };
    }

    const inserted = await tryInsertRoster(client, table, member);

    if (inserted) {
      return { table, row: inserted, created: true };
    }
  }

  return null;
}

async function assignToProject(client: any, projectId: string, rosterId: string, member: ReturnType<typeof normalizeFromCerebro>) {
  if (!projectId || !rosterId) return false;

  const assignmentPayloads = [
    {
      table: "team_roster_assignments",
      payload: {
        project_id: projectId,
        team_roster_id: rosterId,
        role: member.role,
        expected_amount: member.expectedAmount,
        paid_amount: 0,
        payment_status: "Pendente",
        documents: [],
        status: "Ativo",
      },
    },
    {
      table: "team_assignments",
      payload: {
        project_id: projectId,
        team_roster_id: rosterId,
        role: member.role,
        expected_amount: member.expectedAmount,
        paid_amount: 0,
        payment_status: "Pendente",
        documents: [],
        status: "Ativo",
      },
    },
    {
      table: "project_team_members",
      payload: {
        project_id: projectId,
        team_roster_id: rosterId,
        name: member.name,
        role: member.role,
        expected_amount: member.expectedAmount,
      },
    },
  ];

  for (const item of assignmentPayloads) {
    try {
      const already = await client
        .from(item.table)
        .select("id")
        .eq("project_id", projectId)
        .eq("team_roster_id", rosterId)
        .limit(1);

      if (Array.isArray(already?.data) && already.data[0]) {
        return true;
      }

      const { error } = await client.from(item.table).insert(item.payload);

      if (!error) return true;
    } catch {
      // tenta próxima tabela
    }
  }

  return false;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = text(url.searchParams.get("projectId") || url.searchParams.get("project"));

  if (!projectId) {
    return Response.json({
      ok: true,
      team: [],
      message: "Nenhum projeto ativo informado.",
    });
  }

  try {
    const team = await listFinanceTeamMembers(projectId);

    return Response.json({
      ok: true,
      projectId,
      team: team.map((member) => normalizeForCerebro(member as AnyObject)),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        team: [],
        message: error instanceof Error ? error.message : "Erro ao carregar equipe do VIVA.",
      },
      { status: 200 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseServerEnv()) {
      return Response.json({
        ok: false,
        message: "Supabase não configurado no servidor.",
      });
    }

    const body = await request.json().catch(() => ({}));
    const projectId = text(body.projectId || body.project || body.project_id);
    const member = normalizeFromCerebro((body.member || body) as AnyObject);

    if (!member.name) {
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

    const roster = await findOrCreateRoster(client, member);

    if (!roster?.row) {
      return Response.json({
        ok: false,
        message:
          "Não consegui salvar na equipe permanente. O cadastro local no Cérebro continua salvo.",
      });
    }

    const rosterId = text(roster.row.id || roster.row.team_roster_id || roster.row.uuid);
    const assigned = await assignToProject(client, projectId, rosterId, member);

    return Response.json({
      ok: true,
      created: roster.created,
      assigned,
      rosterTable: roster.table,
      member: normalizeForCerebro({
        ...member,
        id: rosterId,
        teamRosterId: rosterId,
      }),
      message: roster.created
        ? "Integrante criado na equipe permanente do VIVA."
        : "Integrante já existia na equipe permanente do VIVA.",
    });
  } catch (error) {
    return Response.json({
      ok: false,
      message: error instanceof Error ? error.message : "Erro ao sincronizar equipe.",
    });
  }
}
