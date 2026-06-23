#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo " Corrigindo tsconfig e build do projeto "
echo "========================================"

if [ ! -f package.json ]; then
  echo "ERRO: rode na raiz do projeto, onde está o package.json."
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p ".backup-tsconfig-final-$TS"

[ -f tsconfig.json ] && cp tsconfig.json ".backup-tsconfig-final-$TS/tsconfig.json"

cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "dist",
    "supabase/functions",
    "supabase/functions/**"
  ]
}
JSON

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

cat > .vscode/settings.json <<'JSON'
{
  "deno.enablePaths": ["supabase/functions"],
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
JSON

echo "Garantindo que .env e .env.local não sobem para GitHub..."

touch .gitignore

grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF ".env.*.local" .gitignore || echo ".env.*.local" >> .gitignore
grep -qxF "!.env.example" .gitignore || echo "!.env.example" >> .gitignore

git rm --cached .env .env.local 2>/dev/null || true

echo "Rodando build..."

npm run build

echo ""
echo "Build finalizado."
echo "Se apareceu 'Compiled successfully', agora foi."
