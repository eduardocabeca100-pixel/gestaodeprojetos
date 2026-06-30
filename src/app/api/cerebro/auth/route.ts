import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import {
  alwaysRequireLogin,
  cerebroCookie,
  clearCerebroCookie,
  envAdminEmails,
  isCerebroAuthEnabled,
  readCerebroSession,
  signCerebroSession,
  verifyPassword,
} from "@/lib/cerebro/access-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(request: Request) {
  const session = readCerebroSession(request);
  const forceLogin = alwaysRequireLogin();

  return Response.json({
    ok: true,
    enabled: isCerebroAuthEnabled(),
    alwaysRequireLogin: forceLogin,
    authenticated: forceLogin ? false : Boolean(session),
    user:
      session && !forceLogin
        ? {
            email: session.email,
            name: session.name,
            role: session.role,
          }
        : null,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const email = text(body.email).toLowerCase();
  const password = text(body.password);

  if (!isCerebroAuthEnabled()) {
    const token = signCerebroSession({
      email: email || "cerebro@local",
      role: "admin",
      name: "Cérebro IA",
    });

    return Response.json(
      { ok: true, message: "Login interno desativado." },
      { headers: { "Set-Cookie": cerebroCookie(token) } },
    );
  }

  if (!email || !password) {
    return Response.json({
      ok: false,
      message: "Informe e-mail e senha do Cérebro.",
    });
  }

  const adminPassword = text(process.env.CEREBRO_ACCESS_PASSWORD);
  const adminEmails = envAdminEmails();

  if (adminPassword && adminEmails.includes(email) && password === adminPassword) {
    const token = signCerebroSession({
      email,
      role: "admin",
      name: "Administrador do Cérebro",
    });

    return Response.json(
      { ok: true, message: "Acesso administrativo liberado." },
      { headers: { "Set-Cookie": cerebroCookie(token) } },
    );
  }

  if (!hasSupabaseServerEnv()) {
    return Response.json({
      ok: false,
      message: "Usuário não encontrado no Cérebro IA.",
    });
  }

  const supabase = await createClient();
  const client = supabase as any;

  const { data, error } = await client
    .from("cerebro_access_users")
    .select("id,name,email,role,password_hash,is_active")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    return Response.json({
      ok: false,
      message:
        "Não consegui consultar usuários do Cérebro. Confira a tabela cerebro_access_users no Supabase.",
    });
  }

  if (!data || data.is_active === false) {
    return Response.json({
      ok: false,
      message: "Este e-mail não está autorizado no Cérebro IA.",
    });
  }

  if (!verifyPassword(password, data.password_hash)) {
    return Response.json({
      ok: false,
      message: "Senha do Cérebro incorreta.",
    });
  }

  const token = signCerebroSession({
    email: data.email,
    name: data.name,
    role: data.role || "editor",
  });

  return Response.json(
    {
      ok: true,
      message: "Acesso liberado ao Cérebro IA.",
      user: {
        email: data.email,
        name: data.name,
        role: data.role,
      },
    },
    { headers: { "Set-Cookie": cerebroCookie(token) } },
  );
}

export async function DELETE() {
  return Response.json(
    { ok: true, message: "Sessão encerrada." },
    { headers: { "Set-Cookie": clearCerebroCookie() } },
  );
}
