#!/usr/bin/env bash
set -e

echo "Corrigindo import do ícone Database no menu lateral..."

python3 - <<'PY'
from pathlib import Path
import re

path = Path("src/components/layout/app-sidebar.tsx")

if not path.exists():
    raise SystemExit("ERRO: src/components/layout/app-sidebar.tsx não encontrado.")

text = path.read_text()

# Encontra o import vindo de lucide-react e adiciona Database se ainda não estiver importado
pattern = r'import\s*\{([^}]+)\}\s*from\s*"lucide-react";'
match = re.search(pattern, text, flags=re.DOTALL)

if not match:
    raise SystemExit("ERRO: não encontrei o import de lucide-react no app-sidebar.tsx.")

imports = match.group(1)

items = [item.strip() for item in imports.split(",") if item.strip()]

if "Database" not in items:
    items.append("Database")

# Remove duplicados mantendo ordem
seen = []
for item in items:
    if item not in seen:
        seen.append(item)

new_import = 'import {\n  ' + ',\n  '.join(seen) + ',\n} from "lucide-react";'

text = text[:match.start()] + new_import + text[match.end():]

path.write_text(text)
print("Import Database corrigido com sucesso.")
PY

echo "Rodando build..."
npm run build

echo "Status:"
git status --short

git add src/components/layout/app-sidebar.tsx
git commit -m "Corrige import do icone Database no menu" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Reinicie o npm run dev se necessário."
