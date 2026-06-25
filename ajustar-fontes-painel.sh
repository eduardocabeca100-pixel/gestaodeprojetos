#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-fontes-painel-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

echo "Aplicando ajuste global de tipografia..."

python3 - <<'PY'
from pathlib import Path
import re

css_path = Path("src/app/globals.css")

if not css_path.exists():
    raise SystemExit("ERRO: src/app/globals.css não encontrado.")

css = css_path.read_text()

block = r"""
/* === VIVA PANEL TYPOGRAPHY START === */
:root {
  --viva-font-sans: "Inter", "SF Pro Text", "SF Pro Display", "Aptos", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  --viva-font-display: "SF Pro Display", "Inter", "Aptos Display", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
  --viva-font-mono: "SF Mono", "Cascadia Code", "Roboto Mono", ui-monospace, monospace;
}

/* Base geral: mais limpa e confortável */
html {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--viva-font-sans);
  letter-spacing: -0.012em;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

/* Painel interno */
main,
aside,
nav,
header,
section,
article,
form,
table,
dialog,
[role="dialog"],
[data-radix-popper-content-wrapper] {
  font-family: var(--viva-font-sans);
}

/* Títulos mais elegantes */
h1,
h2,
h3,
h4,
.page-title,
.card-title,
[class*="text-2xl"],
[class*="text-3xl"],
[class*="text-4xl"],
[class*="text-5xl"],
[class*="text-6xl"],
[class*="font-black"] {
  font-family: var(--viva-font-display);
  letter-spacing: -0.045em;
}

/* Textos comuns mais confortáveis */
p,
span,
label,
small,
li,
td,
th,
input,
textarea,
select,
button,
a {
  font-family: inherit;
}

/* Inputs, botões e menus mais profissionais */
input,
textarea,
select {
  letter-spacing: -0.01em;
  line-height: 1.45;
}

button,
[role="button"],
a {
  letter-spacing: -0.012em;
}

/* Tabelas e listas do painel */
table,
td,
th {
  font-size: 0.92rem;
  line-height: 1.45;
}

th {
  font-weight: 800;
  letter-spacing: 0.015em;
}

td {
  font-weight: 500;
}

/* Sidebar e menus */
aside a,
aside button,
nav a,
nav button {
  font-weight: 700;
}

/* Badges/status */
[class*="badge"],
[class*="Badge"],
.rounded-full {
  letter-spacing: -0.005em;
}

/* Números financeiros e indicadores */
[data-finance],
.finance-value,
.money,
code,
pre,
kbd {
  font-family: var(--viva-font-mono);
}

/* Evita textos muito apertados em cards */
.card,
[class*="rounded-2xl"],
[class*="rounded-3xl"] {
  line-height: 1.48;
}
/* === VIVA PANEL TYPOGRAPHY END === */
"""

css = re.sub(
    r"/\* === VIVA PANEL TYPOGRAPHY START === \*/.*?/\* === VIVA PANEL TYPOGRAPHY END === \*/",
    "",
    css,
    flags=re.DOTALL,
).rstrip()

css_path.write_text(css + "\n\n" + block.strip() + "\n")
PY

echo "Removendo styled-jsx caso tenha ficado algum resíduo no login..."
python3 - <<'PY'
from pathlib import Path
import re

page = Path("src/app/login/page.tsx")
if page.exists():
    text = page.read_text()
    text = re.sub(r'\n\s*<style jsx global>\{\`.*?\`\}</style>', '', text, flags=re.DOTALL)
    page.write_text(text)
PY

echo "Garantindo proteção de arquivos sensíveis..."
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

echo "Verificando possíveis erros antigos..."
if grep -R "firebase/auth" -n src 2>/dev/null; then
  echo "ERRO: ainda existe firebase/auth dentro de src."
  exit 1
fi

if grep -R "styled-jsx" -n src/app/login 2>/dev/null; then
  echo "ERRO: ainda existe styled-jsx no login."
  exit 1
fi

echo "Rodando lint se existir..."
if npm run | grep -q " lint"; then
  npm run lint || echo "Lint encontrou avisos, mas vou seguir para o build."
fi

echo "Rodando build..."
npm run build

echo "Conferindo alteração de fonte..."
grep -R "VIVA PANEL TYPOGRAPHY START" -n src/app/globals.css

echo "Status do Git:"
git status --short

git add src/app/globals.css src/app/login/page.tsx .gitignore package.json package-lock.json
git commit -m "Ajusta tipografia global do painel" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. O Vercel deve iniciar novo deploy."
