#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-corrigir-fullname-refens-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

echo "Corrigindo tipos fullName no Reféns..."
python3 - <<'PY'
from pathlib import Path
import re

path = Path("src/components/refens/refens-official-data.ts")

if not path.exists():
    raise SystemExit("ERRO: src/components/refens/refens-official-data.ts não encontrado.")

text = path.read_text()

# Adiciona fullName opcional no tipo RefensTeamMember
text = re.sub(
    r"(export type RefensTeamMember = \{\s*\n\s*id: string;\s*\n\s*name: string;\s*)",
    r"\1\n  fullName?: string;",
    text,
    count=1,
)

# Adiciona fullName opcional no tipo RefensProjectAssignment
text = re.sub(
    r"(export type RefensProjectAssignment = \{\s*\n\s*id: string;\s*\n\s*memberId: string;\s*\n\s*name: string;\s*)",
    r"\1\n  fullName?: string;",
    text,
    count=1,
)

# Evita duplicar caso rode mais de uma vez
text = text.replace("fullName?: string;\n  fullName?: string;", "fullName?: string;")

path.write_text(text)
PY

echo "Verificando onde ainda aparece fullName..."
grep -RIn "fullName" src/components/refens/refens-official-data.ts || true

echo "Protegendo arquivos sensíveis..."
touch .gitignore
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF "node_modules" .gitignore || echo "node_modules" >> .gitignore
grep -qxF ".next" .gitignore || echo ".next" >> .gitignore
grep -qxF "dist" .gitignore || echo "dist" >> .gitignore

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  git rm --cached .env
fi

if git ls-files --error-unmatch .env.local >/dev/null 2>&1; then
  git rm --cached .env.local
fi

echo "Rodando build para garantir que o Vercel não quebre..."
npm run build

echo "Status:"
git status --short

git add src/components/refens/refens-official-data.ts .gitignore package.json package-lock.json
git commit -m "Corrige tipo fullName no Refens para build Vercel" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Pronto. O Vercel deve redeployar automaticamente."
