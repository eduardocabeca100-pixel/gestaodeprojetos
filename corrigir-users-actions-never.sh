#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo " Corrigindo erro TypeScript users/actions "
echo "========================================"

if [ ! -f package.json ]; then
  echo "ERRO: rode na raiz do projeto, onde está o package.json."
  exit 1
fi

FILE="src/modules/users/actions.ts"

if [ ! -f "$FILE" ]; then
  echo "ERRO: não encontrei $FILE"
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p ".backup-users-actions-$TS"
cp "$FILE" ".backup-users-actions-$TS/actions.ts"

python3 - <<'PY'
from pathlib import Path
import re

file = Path("src/modules/users/actions.ts")
text = file.read_text()

# Corrige o caso em que o TypeScript interpreta users como never[]
text = text.replace(
    "usersResult.data.users.find((user) =>",
    "((usersResult.data?.users ?? []) as Array<{ email?: string | null; id?: string; user_metadata?: Record<string, unknown> }>).find((user) =>"
)

# Caso o arquivo use outro espaçamento/formato
text = re.sub(
    r"usersResult\.data\.users\.find\(\(user\)\s*=>",
    r"((usersResult.data?.users ?? []) as Array<{ email?: string | null; id?: string; user_metadata?: Record<string, unknown> }>).find((user) =>",
    text
)

file.write_text(text)
PY

echo "Arquivo corrigido:"
echo "$FILE"

echo ""
echo "Rodando build..."
npm run build

echo ""
echo "Se apareceu Compiled successfully, agora passou."
