import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function safeArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

async function getClient() {
  if (!hasSupabaseServerEnv()) return null;
  return (await createClient()) as any;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = text(url.searchParams.get("projectId") || url.searchParams.get("project"));
  const personKey = text(url.searchParams.get("personKey"));

  if (!personKey) {
    return Response.json({
      ok: false,
      message: "Pessoa não informada.",
      profile: null,
    });
  }

  const client = await getClient();

  if (!client) {
    return Response.json({
      ok: false,
      message: "Supabase não configurado.",
      profile: null,
    });
  }

  const { data, error } = await client
    .from("cerebro_team_profiles")
    .select("*")
    .eq("project_id", projectId)
    .eq("person_key", personKey)
    .maybeSingle();

  if (error) {
    return Response.json({
      ok: false,
      message: "Tabela cerebro_team_profiles não encontrada ou sem permissão.",
      profile: null,
    });
  }

  return Response.json({
    ok: true,
    profile: data || null,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const projectId = text(body.projectId || body.project);
  const personKey = text(body.personKey);
  const personName = text(body.personName);
  const role = text(body.role);

  if (!personKey) {
    return Response.json({
      ok: false,
      message: "Pessoa não informada.",
    });
  }

  const client = await getClient();

  if (!client) {
    return Response.json({
      ok: false,
      message: "Supabase não configurado.",
    });
  }

  const payload = {
    project_id: projectId,
    person_key: personKey,
    person_name: personName,
    role,
    areas: safeArray(body.areas),
    links: body.links && typeof body.links === "object" ? body.links : {},
    resume: text(body.resume),
    portfolio: text(body.portfolio),
    notes: text(body.notes),
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("cerebro_team_profiles")
    .upsert(payload, { onConflict: "project_id,person_key" })
    .select("*")
    .single();

  if (error) {
    return Response.json({
      ok: false,
      message: "Não consegui salvar perfil avançado. Confira cerebro_team_profiles.",
    });
  }

  return Response.json({
    ok: true,
    message: "Perfil avançado salvo.",
    profile: data,
  });
}
