#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-remover-style-jsx-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

echo "Procurando arquivos com style jsx..."
grep -RIn "style jsx" src || true

echo "Removendo blocos <style jsx> de arquivos TSX/JSX..."
python3 - <<'PY'
from pathlib import Path
import re

extensions = {".tsx", ".jsx"}

for path in Path("src").rglob("*"):
    if path.suffix not in extensions:
        continue

    text = path.read_text()

    original = text

    # Remove blocos:
    # <style jsx>{` ... `}</style>
    # <style jsx global>{` ... `}</style>
    # com espaços/quebras de linha diferentes
    text = re.sub(
        r"\n?\s*<style\s+jsx(?:\s+global)?\s*>\s*\{\s*`.*?`\s*\}\s*</style>\s*",
        "\n",
        text,
        flags=re.DOTALL,
    )

    if text != original:
        path.write_text(text)
        print(f"Removido style jsx de: {path}")
PY

echo "Conferindo se ainda existe style jsx..."
if grep -RIn "style jsx" src; then
  echo "ERRO: ainda existe style jsx. Copie as linhas acima e me mande."
  exit 1
else
  echo "OK: nenhum style jsx encontrado."
fi

echo "Verificando firebase/auth..."
if grep -RIn "firebase/auth" src 2>/dev/null; then
  echo "ERRO: ainda existe firebase/auth dentro de src."
  exit 1
else
  echo "OK: firebase/auth não encontrado."
fi

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

echo "Rodando build..."
npm run build

echo "Status:"
git status --short

git add src .gitignore
git commit -m "Remove blocos style jsx incompatíveis" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado."
