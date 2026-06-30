export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function allowedEmails() {
  return text(process.env.CEREBRO_ALLOWED_EMAILS)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function authEnabled() {
  return text(process.env.CEREBRO_AUTH_ENABLED).toLowerCase() !== "false";
}

export async function GET() {
  return Response.json({
    ok: true,
    enabled: authEnabled(),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const email = text(body.email).toLowerCase();
  const password = text(body.password);

  if (!authEnabled()) {
    return Response.json({
      ok: true,
      message: "Login interno do Cérebro desativado.",
    });
  }

  const passwordFromEnv = text(process.env.CEREBRO_ACCESS_PASSWORD);
  const emails = allowedEmails();

  if (!passwordFromEnv) {
    return Response.json({
      ok: false,
      message: "CEREBRO_ACCESS_PASSWORD não configurado na Vercel.",
    });
  }

  if (emails.length > 0 && !emails.includes(email)) {
    return Response.json({
      ok: false,
      message: "E-mail não autorizado para acessar o Cérebro IA.",
    });
  }

  if (password !== passwordFromEnv) {
    return Response.json({
      ok: false,
      message: "Senha incorreta.",
    });
  }

  return Response.json({
    ok: true,
    message: "Acesso liberado ao Cérebro IA.",
  });
}
