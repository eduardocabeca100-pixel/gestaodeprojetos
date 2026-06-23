import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bootstrap-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AdminRole = "diretor_executivo" | "admin" | "super_admin";

const rolePermissions: Record<AdminRole, string[]> = {
  diretor_executivo: [
    "dashboard",
    "paginas",
    "midia",
    "voluntariado",
    "formularios",
    "projetos",
    "rodape",
  ],
  admin: [
    "dashboard",
    "paginas",
    "midia",
    "voluntariado",
    "formularios",
    "projetos",
    "rodape",
  ],
  super_admin: [
    "dashboard",
    "paginas",
    "midia",
    "voluntariado",
    "formularios",
    "projetos",
    "rodape",
    "configuracoes",
    "usuarios",
    "seguranca",
  ],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeRole(role: unknown): AdminRole {
  if (role === "admin" || role === "super_admin" || role === "diretor_executivo") {
    return role;
  }

  return "diretor_executivo";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bootstrapSecret = Deno.env.get("BOOTSTRAP_SUPER_ADMIN_SECRET") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Secrets da função não configurados." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const body = await req.json().catch(() => null);

  if (!body) {
    return json({ error: "Corpo inválido." }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const role = normalizeRole(body.role);
  const permissions = Array.isArray(body.permissions) && body.permissions.length
    ? body.permissions.map(String)
    : rolePermissions[role];

  if (!name) {
    return json({ error: "Informe o nome do usuário." }, 400);
  }

  if (!email || !email.includes("@")) {
    return json({ error: "Informe um e-mail válido." }, 400);
  }

  if (!password || password.length < 6) {
    return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);
  }

  const { count: superAdminCount, error: countError } = await admin
    .from("admin_profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("active", true);

  if (countError) {
    return json({ error: countError.message }, 500);
  }

  const hasSuperAdmin = Number(superAdminCount ?? 0) > 0;
  const receivedBootstrapSecret = req.headers.get("x-bootstrap-secret") ?? "";

  if (!hasSuperAdmin) {
    if (!bootstrapSecret || receivedBootstrapSecret !== bootstrapSecret) {
      return json({
        error: "Primeiro super admin ainda não existe. Use o bootstrap secret no terminal.",
      }, 403);
    }
  } else {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return json({ error: "Sessão não enviada." }, 401);
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);

    if (userError || !userData.user) {
      return json({ error: "Sessão inválida." }, 401);
    }

    const { data: callerProfile, error: callerError } = await admin
      .from("admin_profiles")
      .select("id,role,active")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (callerError) {
      return json({ error: callerError.message }, 500);
    }

    if (!callerProfile || callerProfile.role !== "super_admin" || callerProfile.active !== true) {
      return json({ error: "Somente super admin pode criar usuários." }, 403);
    }
  }

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role,
    },
  });

  if (createError || !createdUser.user) {
    return json({
      error: createError?.message ?? "Não foi possível criar o usuário.",
    }, 400);
  }

  const { error: profileError } = await admin
    .from("admin_profiles")
    .upsert({
      id: createdUser.user.id,
      name,
      email,
      role,
      active: true,
      permissions,
    }, {
      onConflict: "id",
    });

  if (profileError) {
    await admin.auth.admin.deleteUser(createdUser.user.id).catch(() => null);

    return json({
      error: profileError.message,
    }, 400);
  }

  return json({
    ok: true,
    user: {
      id: createdUser.user.id,
      name,
      email,
      role,
      permissions,
    },
  });
});
