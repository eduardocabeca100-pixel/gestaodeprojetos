#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-pdf-global-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

mkdir -p src/components/pdf

cat > src/components/pdf/universal-pdf-template-interceptor.tsx <<'EOF'
"use client";

import { useEffect } from "react";

import {
  buildSystemPdfHtml,
  getPdfSettings,
} from "@/lib/pdf/pdf-template";

declare global {
  interface Window {
    __vivaPdfInterceptorApplied?: boolean;
    __vivaOriginalOpen?: typeof window.open;
  }
}

function shouldWrapAsSystemPdf(html: string) {
  const lower = html.toLowerCase();

  if (!html.includes("<html") && !html.includes("<body")) return false;

  if (
    lower.includes("data-viva-pdf-template") ||
    lower.includes("pdf-header") ||
    lower.includes("sistema de gestão de projetos • cia de artes viva")
  ) {
    return false;
  }

  return [
    "dossiê",
    "dossie",
    "relatório",
    "relatorio",
    "orçamento",
    "orcamento",
    "documento oficial",
    "docs oficiais",
    "viva gestão cultural",
    "viva gestao cultural",
    "prestação de contas",
    "prestacao de contas",
    "cronograma",
    "reféns",
    "refens",
  ].some((token) => lower.includes(token));
}

function cleanLegacyHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc
    .querySelectorAll("script, style, link, meta, title, button, .print-actions, #__next")
    .forEach((node) => node.remove());

  const headings = Array.from(doc.querySelectorAll("h1, h2, h3"));
  const preferredHeading =
    headings.find((heading) =>
      /dossi|relat|orçamento|orcamento|documento|prestação|prestacao/i.test(
        heading.textContent ?? "",
      ),
    ) ?? headings[1] ?? headings[0];

  const title =
    preferredHeading?.textContent?.trim() ||
    doc.title?.trim() ||
    "Documento gerado pelo sistema";

  headings.forEach((heading) => {
    const text = heading.textContent?.trim().toLowerCase() ?? "";

    if (
      text === "viva gestão cultural" ||
      text === "viva gestao cultural" ||
      text === "viva"
    ) {
      heading.remove();
    }
  });

  doc.querySelectorAll("*").forEach((element) => {
    element.removeAttribute("class");
    element.removeAttribute("style");
    element.removeAttribute("id");
  });

  const bodyHtml =
    doc.body.innerHTML.trim() ||
    "<p>Documento gerado automaticamente pelo sistema.</p>";

  return {
    title,
    bodyHtml,
  };
}

function wrapLegacyPdfHtml(html: string) {
  const { title, bodyHtml } = cleanLegacyHtml(html);

  return buildSystemPdfHtml(
    {
      title,
      subtitle: "Documento exportado pelo Sistema de Gestão de Projetos.",
      documentLabel: title,
      preparedBy: "Sistema",
      fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.pdf`,
      bodyHtml,
    },
    getPdfSettings(),
    true,
  );
}

export function UniversalPdfTemplateInterceptor() {
  useEffect(() => {
    if (window.__vivaPdfInterceptorApplied) return;

    window.__vivaPdfInterceptorApplied = true;
    window.__vivaOriginalOpen = window.open;

    const originalOpen = window.open.bind(window);

    window.open = ((...args: Parameters<typeof window.open>) => {
      const childWindow = originalOpen(...args);

      try {
        const targetUrl = args[0];

        if (
          !childWindow ||
          (targetUrl && targetUrl !== "" && targetUrl !== "about:blank")
        ) {
          return childWindow;
        }

        const childDocument = childWindow.document as Document & {
          write: (...text: string[]) => void;
        };

        const originalWrite = childDocument.write.bind(childDocument);

        childDocument.write = (...contents: string[]) => {
          const html = contents.join("");

          if (shouldWrapAsSystemPdf(html)) {
            originalWrite(wrapLegacyPdfHtml(html));
            return;
          }

          originalWrite(...contents);
        };
      } catch {
        return childWindow;
      }

      return childWindow;
    }) as typeof window.open;

    return () => {
      if (window.__vivaOriginalOpen) {
        window.open = window.__vivaOriginalOpen;
      }

      window.__vivaPdfInterceptorApplied = false;
    };
  }, []);

  return null;
}
EOF

echo "Marcando o modelo oficial para não ser embrulhado de novo..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/lib/pdf/pdf-template.ts")

if path.exists():
    text = path.read_text()

    if 'data-viva-pdf-template="system"' not in text:
        text = text.replace(
            '<section class="sheet">',
            '<section class="sheet" data-viva-pdf-template="system">',
        )

    path.write_text(text)
PY

echo "Montando interceptador global no layout protegido..."
python3 - <<'PY'
from pathlib import Path

candidates = [
    Path("src/components/layout/protected-layout.tsx"),
    Path("src/app/(protected)/layout.tsx"),
]

target = next((path for path in candidates if path.exists()), None)

if not target:
    raise SystemExit("ERRO: não encontrei layout protegido para montar o interceptador.")

text = target.read_text()

if 'UniversalPdfTemplateInterceptor' not in text:
    text = (
        'import { UniversalPdfTemplateInterceptor } from "@/components/pdf/universal-pdf-template-interceptor";\n'
        + text
    )

    if "<FinancialLocalStorageSynchronizer />" in text:
        text = text.replace(
            "<FinancialLocalStorageSynchronizer />",
            "<FinancialLocalStorageSynchronizer />\n      <UniversalPdfTemplateInterceptor />",
            1,
        )
    elif "{children}" in text:
        text = text.replace(
            "{children}",
            "<UniversalPdfTemplateInterceptor />\n      {children}",
            1,
        )
    else:
        raise SystemExit("ERRO: não consegui encontrar ponto para inserir o interceptador no layout.")

target.write_text(text)
print(f"Interceptador montado em: {target}")
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

echo "Conferindo interceptador..."
grep -R "UniversalPdfTemplateInterceptor" -n src
grep -R "data-viva-pdf-template" -n src/lib/pdf/pdf-template.ts

echo "Status:"
git status --short

git add src/components/pdf/universal-pdf-template-interceptor.tsx src/lib/pdf/pdf-template.ts src/components/layout/protected-layout.tsx 'src/app/(protected)/layout.tsx' .gitignore package.json package-lock.json 2>/dev/null || true

git commit -m "Forca modelo oficial em todos os PDFs do sistema" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Reinicie o npm run dev e gere o dossiê novamente."
