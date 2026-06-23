#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo " Corrigindo build Next + Supabase Function "
echo "=========================================="

if [ ! -f package.json ]; then
  echo "ERRO: rode na raiz do projeto, onde está o package.json."
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p ".backup-tsconfig-$TS"

[ -f tsconfig.json ] && cp tsconfig.json ".backup-tsconfig-$TS/tsconfig.json"
[ -f .env.local ] && cp .env.local ".backup-tsconfig-$TS/.env.local"
[ -f .env ] && cp .env ".backup-tsconfig-$TS/.env"

echo "Removendo SERVICE_ROLE do .env local, se existir..."

python3 - <<'PY'
from pathlib import Path

danger_keys = {
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
    "VITE_SUPABASE_SERVICE_ROLE_KEY",
}

for filename in [".env", ".env.local"]:
    path = Path(filename)
    if not path.exists():
        continue

    lines = path.read_text().splitlines()
    new_lines = []

    for line in lines:
        stripped = line.strip()
        if any(stripped.startswith(key + "=") for key in danger_keys):
            continue
        new_lines.append(line)

    path.write_text("\n".join(new_lines).rstrip() + "\n")
PY

echo "Garantindo que .env e .env.local não sobem para o GitHub..."

touch .gitignore

grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF ".env.*.local" .gitignore || echo ".env.*.local" >> .gitignore
grep -qxF "!.env.example" .gitignore || echo "!.env.example" >> .gitignore

git rm --cached .env .env.local 2>/dev/null || true

echo "Ajustando tsconfig.json para ignorar Supabase Edge Functions no build..."

node <<'NODE'
const fs = require("fs");

const file = "tsconfig.json";

if (!fs.existsSync(file)) {
  throw new Error("tsconfig.json não encontrado.");
}

const raw = fs.readFileSync(file, "utf8");

const clean = raw
  .replace(/^\uFEFF/, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");

const tsconfig = JSON.parse(clean);

const exclude = new Set(Array.isArray(tsconfig.exclude) ? tsconfig.exclude : []);

[
  "node_modules",
  ".next",
  "out",
  "dist",
  "supabase/functions",
  "supabase/functions/**"
].forEach((item) => exclude.add(item));

tsconfig.exclude = Array.from(exclude);

fs.writeFileSync(file, JSON.stringify(tsconfig, null, 2) + "\n");
NODE

echo "Criando configuração Deno isolada para a Edge Function..."

mkdir -p supabase/functions/create-admin-user

cat > supabase/functions/create-admin-user/deno.json <<'JSON'
{
  "compilerOptions": {
    "lib": ["deno.ns", "dom", "dom.iterable", "esnext"],
    "strict": true
  }
}
JSON

mkdir -p .vscode

if [ ! -f .vscode/settings.json ]; then
  cat > .vscode/settings.json <<'JSON'
{
  "deno.enablePaths": ["supabase/functions"]
}
JSON
else
  echo "Arquivo .vscode/settings.json já existe. Não sobrescrevi para evitar apagar suas configurações."
fi

echo "Rodando build novamente..."

npm run build

echo ""
echo "Correção concluída."
echo ""
echo "Agora pode subir para o GitHub com segurança."
