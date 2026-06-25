#!/usr/bin/env bash
set -e

echo "Verificando projeto..."

if [ ! -f "package.json" ] || [ ! -d "src" ]; then
  echo "ERRO: você precisa rodar dentro da pasta raiz do projeto, onde fica package.json."
  exit 1
fi

if [ ! -f ".tmp-ajuste-painel/changed-files.tgz.b64" ]; then
  echo "ERRO: o arquivo .tmp-ajuste-painel/changed-files.tgz.b64 não existe."
  echo "Isso significa que o script anterior não foi colado completo."
  exit 1
fi

echo "Decodificando pacote de ajustes com Python, sem usar base64 do Mac..."

python3 - <<'PY'
from pathlib import Path
import base64
import sys

src = Path(".tmp-ajuste-painel/changed-files.tgz.b64")
dst = Path(".tmp-ajuste-painel/changed-files.tgz")

text = src.read_text()
clean = "".join(text.split())

try:
    data = base64.b64decode(clean)
except Exception as exc:
    print("ERRO ao decodificar o pacote:", exc)
    sys.exit(1)

dst.write_bytes(data)
print("Pacote decodificado com sucesso:", dst)
PY

echo "Conferindo arquivos que serão aplicados..."
tar -tzf .tmp-ajuste-painel/changed-files.tgz

echo "Aplicando arquivos no projeto..."
tar -xzf .tmp-ajuste-painel/changed-files.tgz -C .

echo "Garantindo proteção do .env..."
touch .gitignore
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF "node_modules" .gitignore || echo "node_modules" >> .gitignore
grep -qxF "dist" .gitignore || echo "dist" >> .gitignore

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "Removendo .env do controle do Git, sem apagar seu arquivo local..."
  git rm --cached .env
fi

echo "Testando build..."
npm run build

echo "Status dos arquivos:"
git status --short

echo "Salvando no Git..."
git add src .gitignore
git commit -m "Ajusta layout do painel, login, projetos e equipe" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

echo "Enviando para GitHub na branch $BRANCH..."
git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Pronto. Agora o Vercel deve redeployar automaticamente."
