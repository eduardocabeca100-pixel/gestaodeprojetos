#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-cores-pdf-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

python3 - <<'PY'
from pathlib import Path
import re

template = Path("src/lib/pdf/pdf-template.ts")

if not template.exists():
    raise SystemExit("ERRO: src/lib/pdf/pdf-template.ts não encontrado.")

text = template.read_text()

# 1) Adiciona campos novos no type, se ainda não existirem
if "titleColor: string;" not in text:
    text = text.replace(
        "primaryColor: string;\n};",
        "primaryColor: string;\n  titleColor: string;\n  bodyTextColor: string;\n};",
    )

# 2) Adiciona valores padrão
if 'titleColor: "#173819"' not in text:
    text = text.replace(
        'primaryColor: "#2f6b2f",',
        'primaryColor: "#2f6b2f",\n  titleColor: "#173819",\n  bodyTextColor: "#1f2933",',
    )

# 3) Garante constantes dentro do buildSystemPdfHtml
if "const titleColor = settings.titleColor" not in text:
    text = text.replace(
        "const primary = settings.primaryColor || defaultPdfSettings.primaryColor;\n",
        """const primary = settings.primaryColor || defaultPdfSettings.primaryColor;
  const titleColor = settings.titleColor || defaultPdfSettings.titleColor;
  const bodyTextColor = settings.bodyTextColor || defaultPdfSettings.bodyTextColor;
""",
    )

# 4) Troca usos onde o título/texto dependia da cor principal
replacements = {
    "color: #1f2933;": "color: ${bodyTextColor};",
    "color: #202820;": "color: ${bodyTextColor};",
    "color: ${primary};\n      font-size: 17.2pt;": "color: ${titleColor};\n      font-size: 17.2pt;",
    "color: ${primary};\n      font-size: 15.5pt;": "color: ${titleColor};\n      font-size: 15.5pt;",
    "color: ${primary};\n      line-height: 1.1;": "color: ${titleColor};\n      line-height: 1.1;",
}

for old, new in replacements.items():
    text = text.replace(old, new)

# 5) Se a substituição de h1/h2/h3 não pegou por variação, força no bloco document-content
text = re.sub(
    r"(\.document-content h1,\s*\.document-content h2,\s*\.document-content h3 \{\s*)color: \$\{primary\};",
    r"\1color: ${titleColor};",
    text,
    flags=re.DOTALL,
)

template.write_text(text)

settings_file = Path("src/components/pdf/pdf-branding-settings.tsx")

if not settings_file.exists():
    raise SystemExit("ERRO: src/components/pdf/pdf-branding-settings.tsx não encontrado.")

settings = settings_file.read_text()

# 6) Garante que os inputs de cor não quebrem se vier setting antigo do localStorage
settings = settings.replace(
    'value={settings.primaryColor}',
    'value={settings.primaryColor || defaultPdfSettings.primaryColor}',
)

# 7) Troca label da cor principal para ficar mais claro
settings = settings.replace(
    '<InputLine label="Cor principal">',
    '<InputLine label="Cor principal / detalhes">',
)

# 8) Adiciona campos novos de cor se ainda não existirem
if 'label="Cor dos títulos"' not in settings:
    old = '''            <InputLine label="Cor principal / detalhes">
              <input type="color" value={settings.primaryColor || defaultPdfSettings.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>
          </div>'''

    new = '''            <InputLine label="Cor principal / detalhes">
              <input type="color" value={settings.primaryColor || defaultPdfSettings.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputLine label="Cor dos títulos">
              <input type="color" value={settings.titleColor || defaultPdfSettings.titleColor} onChange={(event) => updateField("titleColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>

            <InputLine label="Cor do texto">
              <input type="color" value={settings.bodyTextColor || defaultPdfSettings.bodyTextColor} onChange={(event) => updateField("bodyTextColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>
          </div>'''

    if old in settings:
        settings = settings.replace(old, new)
    else:
        # fallback: insere antes dos botões Salvar / Restaurar
        marker = '<div className="flex flex-wrap gap-3 pt-2">'
        settings = settings.replace(
            marker,
            '''<div className="grid gap-4 sm:grid-cols-2">
            <InputLine label="Cor dos títulos">
              <input type="color" value={settings.titleColor || defaultPdfSettings.titleColor} onChange={(event) => updateField("titleColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>

            <InputLine label="Cor do texto">
              <input type="color" value={settings.bodyTextColor || defaultPdfSettings.bodyTextColor} onChange={(event) => updateField("bodyTextColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>
          </div>

          ''' + marker
        )

settings_file.write_text(settings)
PY

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

echo "Verificando erros conhecidos..."
if grep -R "firebase/auth" -n src 2>/dev/null; then
  echo "ERRO: ainda existe firebase/auth dentro de src."
  exit 1
fi

if grep -R "style jsx" -n src 2>/dev/null; then
  echo "ERRO: ainda existe style jsx dentro de src."
  exit 1
fi

echo "Rodando build..."
npm run build

echo "Conferindo campos novos..."
grep -R "titleColor" -n src/lib/pdf/pdf-template.ts src/components/pdf/pdf-branding-settings.tsx
grep -R "bodyTextColor" -n src/lib/pdf/pdf-template.ts src/components/pdf/pdf-branding-settings.tsx
grep -R "Cor dos títulos" -n src/components/pdf/pdf-branding-settings.tsx

echo "Status:"
git status --short

git add src/lib/pdf/pdf-template.ts src/components/pdf/pdf-branding-settings.tsx .gitignore package.json package-lock.json
git commit -m "Separa cores de titulo texto e detalhes no modelo PDF" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Abra /configuracoes/pdf e ajuste as cores separadamente."
