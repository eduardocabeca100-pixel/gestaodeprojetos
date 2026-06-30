import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { hashPassword, readCerebroSession } from "@/lib/cerebro/access-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function requireAdmin(request: Request) {
  const session = readCerebroSession(request);

  if (!session) {
    return {
      ok: false as const,
      response: Response.json(
        { ok: false, message: "Faça login no Cérebro IA." },
        { status: 401 },
      ),
    };
  }

  if (session.role !== "admin") {
    return {
      ok: false as const,
      response: Response.json(
        { ok: false, message: "Apenas administradores do Cérebro podem gerenciar usuários." },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, session };
}

async function getClient() {
  if (!hasSupabaseServerEnv()) return null;

  return (await createClient()) as any;
}

export async function GET(request: Request) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const client = await getClient();

  if (!client) {
    return Response.json({
      ok: false,
      message: "Supabase não configurado.",
      users: [],
    });
  }

  const { data, error } = await client
    .from("cerebro_access_users")
    .select("id,name,email,role,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({
      ok: false,
      message: "Não consegui listar usuários. Confira a tabela cerebro_access_users.",
      users: [],
    });
  }

  return Response.json({
    ok: true,
    users: data || [],
  });
}

export async function POST(request: Request) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));

  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const password = text(body.password);
  const role = text(body.role) || "editor";

  if (!email || !password) {
    return Response.json({
      ok: false,
      message: "Informe e-mail e senha.",
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
    name: name || email,
    email,
    role,
    password_hash: hashPassword(password),
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("cerebro_access_users")
    .upsert(payload, { onConflict: "email" })
    .select("id,name,email,role,is_active,created_at")
    .single();

  if (error) {
    return Response.json({
      ok: false,
      message: "Não consegui salvar o usuário. Confira a tabela cerebro_access_users.",
    });
  }

  return Response.json({
    ok: true,
    message: "Usuário autorizado no Cérebro IA.",
    user: data,
  });
}

export async function PATCH(request: Request) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));

  const id = text(body.id);

  if (!id) {
    return Response.json({
      ok: false,
      message: "ID do usuário não informado.",
    });
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) patch.name = text(body.name);
  if (body.role !== undefined) patch.role = text(body.role);
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);
  if (body.password) patch.password_hash = hashPassword(text(body.password));

  const client = await getClient();

  if (!client) {
    return Response.json({
      ok: false,
      message: "Supabase não configurado.",
    });
  }

  const { data, error } = await client
    .from("cerebro_access_users")
    .update(patch)
    .eq("id", id)
    .select("id,name,email,role,is_active,created_at")
    .single();

  if (error) {
    return Response.json({
      ok: false,
      message: "Não consegui atualizar usuário.",
    });
  }

  return Response.json({
    ok: true,
    message: "Usuário atualizado.",
    user: data,
  });
}
