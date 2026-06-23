#!/usr/bin/env bash
set -euo pipefail

echo "=============================================="
echo " VIVA Gestão Cultural - Correção Supabase Auth "
echo "=============================================="

if [ ! -f package.json ]; then
  echo "ERRO: rode este script na raiz do projeto, onde está o package.json."
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".backup-supabase-auth-$TS"
mkdir -p "$BACKUP_DIR"

echo "Criando backup em $BACKUP_DIR..."

[ -f .env ] && cp .env "$BACKUP_DIR/.env.backup"
[ -f .env.local ] && cp .env.local "$BACKUP_DIR/.env.local.backup"
[ -f .gitignore ] && cp .gitignore "$BACKUP_DIR/.gitignore.backup"

mkdir -p src/lib supabase/functions/create-admin-user supabase/migrations

get_env_value() {
  local key="$1"
  for file in .env.local .env; do
    if [ -f "$file" ]; then
      local value
      value="$(grep -E "^${key}=" "$file" | tail -n 1 | cut -d '=' -f2- | sed 's/^["'\'']//;s/["'\'']$//' || true)"
      if [ -n "${value:-}" ]; then
        echo "$value"
        return 0
      fi
    fi
  done
  echo ""
}

SUPABASE_URL="$(get_env_value NEXT_PUBLIC_SUPABASE_URL)"
[ -z "$SUPABASE_URL" ] && SUPABASE_URL="$(get_env_value VITE_SUPABASE_URL)"
[ -z "$SUPABASE_URL" ] && SUPABASE_URL="$(get_env_value SUPABASE_URL)"

SUPABASE_ANON_KEY="$(get_env_value NEXT_PUBLIC_SUPABASE_ANON_KEY)"
[ -z "$SUPABASE_ANON_KEY" ] && SUPABASE_ANON_KEY="$(get_env_value VITE_SUPABASE_ANON_KEY)"
[ -z "$SUPABASE_ANON_KEY" ] && SUPABASE_ANON_KEY="$(get_env_value SUPABASE_ANON_KEY)"

if [ -z "$SUPABASE_URL" ]; then
  read -r -p "Cole a SUPABASE URL, exemplo https://xxxx.supabase.co: " SUPABASE_URL
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  read -r -p "Cole a SUPABASE ANON PUBLIC KEY: " SUPABASE_ANON_KEY
fi

PROJECT_REF="$(echo "$SUPABASE_URL" | sed -E 's#https?://([^.]+)\.supabase\.co.*#\1#')"

if [ -z "$PROJECT_REF" ] || [ "$PROJECT_REF" = "$SUPABASE_URL" ]; then
  read -r -p "Cole o PROJECT REF do Supabase: " PROJECT_REF
fi

remove_block() {
  local file="$1"
  if [ -f "$file" ]; then
    awk '
      /# >>> VIVA SUPABASE AUTH/ {skip=1; next}
      /# <<< VIVA SUPABASE AUTH/ {skip=0; next}
      skip != 1 {print}
    ' "$file" > "$file.tmp"
    mv "$file.tmp" "$file"
  fi
}

touch .env.local
remove_block .env.local

cat >> .env.local <<ENVEOF

# >>> VIVA SUPABASE AUTH
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

SUPABASE_PROJECT_REF=$PROJECT_REF
# <<< VIVA SUPABASE AUTH
ENVEOF

cat > .env.example <<'ENVEOF'
# Supabase público
# Use esses valores no .env.local localmente e nas variáveis do Vercel/Hostinger.
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA

# Compatibilidade se o projeto estiver em Vite.
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA

# Nunca coloque SERVICE_ROLE no frontend.
# A SUPABASE_SERVICE_ROLE_KEY vai somente nos Secrets da Edge Function.
ENVEOF

touch .gitignore

for item in ".env" ".env.local" ".env.*.local" "!.env.example"; do
  grep -qxF "$item" .gitignore || echo "$item" >> .gitignore
done

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "Removendo .env do rastreamento do Git, sem apagar o arquivo local..."
  git rm --cached .env
fi

if git ls-files --error-unmatch .env.local >/dev/null 2>&1; then
  echo "Removendo .env.local do rastreamento do Git, sem apagar o arquivo local..."
  git rm --cached .env.local
fi

echo "Instalando Supabase JS..."
npm install @supabase/supabase-js

if grep -q '"next"' package.json; then
  echo "Projeto Next.js detectado."

  cat > src/lib/supabase.ts <<'TSEOF'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase não configurado. Confira NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local."
    );
  }

  return supabase;
}
TSEOF

else
  echo "Projeto Vite/React detectado."

  cat > src/lib/supabase.ts <<'TSEOF'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase não configurado. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local."
    );
  }

  return supabase;
}
TSEOF
fi

cat > src/lib/adminUsers.ts <<'TSEOF'
import { getSupabaseClient } from "./supabase";

export type AdminRole = "diretor_executivo" | "admin" | "super_admin";

export type CreateAdminUserInput = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  permissions?: string[];
};

export async function createAdminUser(input: CreateAdminUserInput) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke("create-admin-user", {
    body: input,
  });

  if (error) {
    throw new Error(error.message || "Erro ao criar usuário administrativo.");
  }

  return data;
}
TSEOF

cat > "supabase/migrations/${TS}_admin_auth.sql" <<'SQLEOF'
DO $$
BEGIN
  CREATE TYPE public.admin_role AS ENUM ('diretor_executivo', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role public.admin_role NOT NULL DEFAULT 'diretor_executivo',
  active boolean NOT NULL DEFAULT true,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_profiles_set_updated_at ON public.admin_profiles;

CREATE TRIGGER admin_profiles_set_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_profiles_select_self_or_super" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_insert_super" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_update_super" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_delete_super" ON public.admin_profiles;

CREATE POLICY "admin_profiles_select_self_or_super"
ON public.admin_profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.is_super_admin()
);

CREATE POLICY "admin_profiles_insert_super"
ON public.admin_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "admin_profiles_update_super"
ON public.admin_profiles
FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "admin_profiles_delete_super"
ON public.admin_profiles
FOR DELETE
TO authenticated
USING (public.is_super_admin());
SQLEOF

cat > supabase/functions/create-admin-user/index.ts <<'TSEOF'
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
TSEOF

cat > supabase/config.toml <<'TOMLEOF'
project_id = "viva-gestao-cultural"

[functions.create-admin-user]
verify_jwt = true
TOMLEOF

echo ""
echo "Arquivos criados com sucesso."
echo ""

read -r -p "Deseja aplicar o banco e fazer deploy da Edge Function agora? (s/N): " DEPLOY_NOW

if [[ "$DEPLOY_NOW" =~ ^[sS]$ ]]; then
  if ! command -v npx >/dev/null 2>&1; then
    echo "npx não encontrado. Instale Node.js/NPM."
    exit 1
  fi

  echo "Linkando projeto Supabase..."
  npx supabase link --project-ref "$PROJECT_REF"

  echo "Aplicando migrations no banco Supabase..."
  npx supabase db push

  read -s -r -p "Cole a SUPABASE SERVICE ROLE KEY, ela não será salva no projeto: " SERVICE_ROLE_KEY
  echo ""

  if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "SERVICE ROLE vazia. Deploy cancelado."
    exit 1
  fi

  BOOTSTRAP_SECRET="$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

  echo "Enviando secrets para a Edge Function..."
  npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" BOOTSTRAP_SUPER_ADMIN_SECRET="$BOOTSTRAP_SECRET"

  echo "Fazendo deploy da Edge Function..."
  npx supabase functions deploy create-admin-user

  read -r -p "Deseja criar o primeiro SUPER ADMIN agora pelo terminal? (s/N): " CREATE_FIRST

  if [[ "$CREATE_FIRST" =~ ^[sS]$ ]]; then
    read -r -p "Nome do super admin: " FIRST_NAME
    read -r -p "E-mail do super admin: " FIRST_EMAIL
    read -s -r -p "Senha temporária do super admin, mínimo 6 caracteres: " FIRST_PASSWORD
    echo ""

    BODY="$(node -e "
      const body = {
        name: process.argv[1],
        email: process.argv[2],
        password: process.argv[3],
        role: 'super_admin'
      };
      console.log(JSON.stringify(body));
    " "$FIRST_NAME" "$FIRST_EMAIL" "$FIRST_PASSWORD")"

    echo "Criando primeiro super admin..."
    curl -sS -X POST "$SUPABASE_URL/functions/v1/create-admin-user" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      -H "x-bootstrap-secret: $BOOTSTRAP_SECRET" \
      --data "$BODY"

    echo ""
    echo "Primeiro super admin criado."
  fi
fi

echo ""
echo "Rodando build..."
npm run build

echo ""
echo "Correção finalizada."
echo ""
echo "IMPORTANTE:"
echo "1. .env e .env.local NÃO devem subir para GitHub."
echo "2. No Vercel/Hostinger, cadastre as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
echo "3. A SERVICE_ROLE fica somente nos Secrets da Supabase Edge Function."
