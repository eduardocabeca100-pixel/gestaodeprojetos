#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-template-pdf-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

mkdir -p src/lib/pdf
mkdir -p src/components/pdf
mkdir -p 'src/app/(protected)/configuracoes/pdf'

cat > src/lib/pdf/pdf-template.ts <<'EOF'
export type SystemPdfOptions = {
  title: string;
  subtitle?: string;
  documentLabel?: string;
  preparedBy?: string;
  bodyHtml: string;
  fileName?: string;
};

const PDF_LOGO_STORAGE_KEY = "viva:pdf-logo:data-url";

export function savePdfLogoDataUrl(dataUrl: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PDF_LOGO_STORAGE_KEY, dataUrl);
}

export function getPdfLogoDataUrl() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PDF_LOGO_STORAGE_KEY) ?? "";
}

export function removePdfLogoDataUrl() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PDF_LOGO_STORAGE_KEY);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getTodayBr() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

export function openSystemPdf(options: SystemPdfOptions) {
  if (typeof window === "undefined") return;

  const logo = getPdfLogoDataUrl();
  const title = escapeHtml(options.title);
  const subtitle = escapeHtml(options.subtitle ?? "");
  const documentLabel = escapeHtml(options.documentLabel ?? "Documento gerado pelo sistema");
  const preparedBy = escapeHtml(options.preparedBy ?? "Sistema");
  const fileName = escapeHtml(options.fileName ?? "documento-cia-viva.pdf");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html,
    body {
      margin: 0;
      min-height: 100%;
      background: #e9ece7;
      color: #142313;
      font-family: Inter, "SF Pro Text", "Segoe UI", Arial, sans-serif;
    }

    .print-actions {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 20;
      display: flex;
      gap: 10px;
    }

    .print-actions button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      color: white;
      background: #244d23;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
    }

    .sheet {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 24px auto;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
    }

    .sheet::before,
    .sheet::after {
      content: "";
      position: absolute;
      width: 138mm;
      height: 78mm;
      pointer-events: none;
      opacity: 0.98;
      background:
        linear-gradient(135deg, transparent 0 34%, rgba(71, 154, 54, 0.92) 34% 52%, transparent 52%),
        linear-gradient(35deg, transparent 0 45%, rgba(125, 182, 62, 0.72) 45% 65%, transparent 65%),
        linear-gradient(155deg, transparent 0 50%, rgba(31, 104, 36, 0.82) 50% 70%, transparent 70%);
    }

    .sheet::before {
      right: -22mm;
      top: -31mm;
      transform: rotate(4deg);
    }

    .sheet::after {
      left: -26mm;
      bottom: -30mm;
      transform: rotate(180deg);
    }

    .pdf-header {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 34mm 1fr 63mm;
      gap: 10mm;
      padding: 23mm 18mm 10mm;
      align-items: start;
    }

    .logo-box {
      width: 25mm;
      height: 25mm;
      border: 1px solid #79966f;
      border-radius: 3mm;
      display: grid;
      place-items: center;
      overflow: hidden;
      color: #426b35;
      text-align: center;
      font-size: 8pt;
      font-weight: 800;
      line-height: 1.2;
    }

    .logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      padding: 2mm;
    }

    .brand-title {
      margin: 0;
      color: #173819;
      font-size: 18pt;
      line-height: 1.05;
      letter-spacing: -0.04em;
      text-transform: uppercase;
      font-weight: 950;
    }

    .brand-name {
      margin: 3mm 0 0;
      color: #245b27;
      font-size: 16pt;
      line-height: 1.1;
      font-weight: 500;
    }

    .brand-subtitle {
      margin: 3mm 0 0;
      padding-top: 3mm;
      border-top: 1px solid rgba(36, 91, 39, 0.24);
      color: #46514a;
      font-size: 8.7pt;
      line-height: 1.45;
    }

    .contact-list {
      display: grid;
      gap: 2.5mm;
      color: #26312b;
      font-size: 8.2pt;
      line-height: 1.25;
    }

    .contact-list div {
      display: grid;
      grid-template-columns: 15mm 1fr;
      gap: 2mm;
    }

    .contact-list strong {
      color: #173819;
    }

    .content-frame {
      position: relative;
      z-index: 2;
      margin: 8mm 18mm 0;
      min-height: 197mm;
      padding: 0;
    }

    .document-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
      margin-bottom: 7mm;
      padding: 4mm 0 5mm;
      border-top: 1.5px solid #254425;
      border-bottom: 1px solid #d7ddd5;
      color: #2b332d;
      font-size: 8.4pt;
    }

    .document-meta span {
      display: block;
      color: #667064;
      font-size: 7.3pt;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-weight: 900;
    }

    .document-content {
      position: relative;
      z-index: 2;
      color: #202820;
      font-size: 10pt;
      line-height: 1.65;
    }

    .document-content h1,
    .document-content h2,
    .document-content h3 {
      color: #173819;
      line-height: 1.1;
      margin: 0 0 4mm;
      letter-spacing: -0.03em;
    }

    .document-content h1 {
      font-size: 18pt;
    }

    .document-content h2 {
      font-size: 14pt;
      margin-top: 8mm;
    }

    .document-content p {
      margin: 0 0 4mm;
    }

    .document-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 5mm 0;
      font-size: 8.3pt;
    }

    .document-content th {
      background: #244d23;
      color: white;
      text-align: left;
      padding: 2.6mm;
    }

    .document-content td {
      border: 1px solid #d9dfd6;
      padding: 2.5mm;
    }

    .document-content .muted {
      color: #657064;
    }

    .pdf-footer {
      position: absolute;
      left: 18mm;
      right: 18mm;
      bottom: 14mm;
      z-index: 3;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10mm;
      align-items: end;
      color: #26312b;
      font-size: 7.6pt;
    }

    .footer-line {
      grid-column: 1 / -1;
      height: 1px;
      background: #244d23;
      opacity: 0.72;
    }

    .footer-system {
      display: flex;
      gap: 2mm;
      align-items: center;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .footer-site {
      color: #244d23;
      font-weight: 950;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .footer-page {
      grid-column: 1 / -1;
      text-align: center;
      color: #4f5b52;
      font-size: 8pt;
    }

    @media print {
      body {
        background: white;
      }

      .print-actions {
        display: none;
      }

      .sheet {
        margin: 0;
        width: 210mm;
        min-height: 297mm;
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button onclick="window.print()">Salvar como PDF</button>
  </div>

  <section class="sheet">
    <header class="pdf-header">
      <div class="logo-box">
        ${
          logo
            ? `<img src="${logo}" alt="Logo" />`
            : `<span>ÁREA<br/>PARA<br/>LOGO</span>`
        }
      </div>

      <div>
        <h1 class="brand-title">Sistema de Gestão de Projetos</h1>
        <p class="brand-name">Cia de Artes Viva</p>
        <p class="brand-subtitle">Gestão de Projetos Culturais, Artísticos e Administrativos</p>
      </div>

      <div class="contact-list">
        <div><strong>CNPJ:</strong><span>____________________</span></div>
        <div><strong>Cidade/UF:</strong><span>Jaraguá do Sul | SC</span></div>
        <div><strong>E-mail:</strong><span>eduardo@ciaviva.com</span></div>
        <div><strong>Telefone:</strong><span>(47) 992747545</span></div>
        <div><strong>Site:</strong><span>www.ciaviva.com</span></div>
      </div>
    </header>

    <main class="content-frame">
      <div class="document-meta">
        <div>
          <span>Documento</span>
          ${documentLabel}
        </div>
        <div>
          <span>Emissão / elaborado por</span>
          ${getTodayBr()} • ${preparedBy}
        </div>
      </div>

      <article class="document-content">
        <h1>${title}</h1>
        ${subtitle ? `<p class="muted">${subtitle}</p>` : ""}
        ${options.bodyHtml}
      </article>
    </main>

    <footer class="pdf-footer">
      <div class="footer-line"></div>
      <div class="footer-system">
        <span>Sistema de Gestão de Projetos</span>
        <span>•</span>
        <span>Cia de Artes Viva</span>
        <span>•</span>
        <span>V2026</span>
      </div>
      <div class="footer-site">WWW.CIAVIVA.COM</div>
      <div class="footer-page">Página 1</div>
    </footer>
  </section>

  <script>
    document.title = "${fileName}";
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=980,height=1200");

  if (!printWindow) {
    alert("O navegador bloqueou a janela do PDF. Libere pop-ups para este site.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 600);
}
EOF

cat > src/components/pdf/pdf-branding-settings.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPdfLogoDataUrl,
  removePdfLogoDataUrl,
  savePdfLogoDataUrl,
} from "@/lib/pdf/pdf-template";

export function PdfBrandingSettings() {
  const [logo, setLogo] = useState("");

  useEffect(() => {
    setLogo(getPdfLogoDataUrl());
  }, []);

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      savePdfLogoDataUrl(dataUrl);
      setLogo(dataUrl);
    };

    reader.readAsDataURL(file);
  }

  function clearLogo() {
    removePdfLogoDataUrl();
    setLogo("");
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
          Modelo de PDF
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          Cabeçalho e rodapé padrão
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Envie a logo que aparecerá no cabeçalho de todos os PDFs gerados pelo sistema.
          O restante do modelo já usa as informações da Cia de Artes Viva.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
        <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
          {logo ? (
            <img src={logo} alt="Logo do PDF" className="max-h-32 max-w-full object-contain" />
          ) : (
            <span className="text-center text-sm font-bold uppercase tracking-wide text-slate-400">
              Área da logo
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center gap-3">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600">
            <ImagePlus className="size-4" />
            Subir logo
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>

          {logo ? (
            <Button type="button" variant="outline" className="w-fit" onClick={clearLogo}>
              <Trash2 className="mr-2 size-4" />
              Remover logo
            </Button>
          ) : null}

          <p className="text-sm leading-6 text-slate-500">
            Recomendo PNG com fundo transparente. A logo será salva localmente no navegador.
          </p>
        </div>
      </div>
    </section>
  );
}
EOF

cat > 'src/app/(protected)/configuracoes/pdf/page.tsx' <<'EOF'
import { PageContainer } from "@/components/layout/page-container";
import { PdfBrandingSettings } from "@/components/pdf/pdf-branding-settings";

export default function PdfSettingsPage() {
  return (
    <PageContainer
      title="Modelo de PDF"
      description="Configure a logo e o padrão visual usado em documentos exportados pelo sistema."
    >
      <PdfBrandingSettings />
    </PageContainer>
  );
}
EOF

echo "Atualizando o relatório automático da Gestão para PDF..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/advanced-management/advanced-management-panel.tsx")

if not path.exists():
    print("AVISO: painel de gestão avançada não encontrado. O gerador PDF foi criado, mas a tela Gestão não foi alterada.")
    raise SystemExit(0)

text = path.read_text()

if 'from "@/lib/pdf/pdf-template"' not in text:
    text = text.replace(
        'import {',
        'import { openSystemPdf } from "@/lib/pdf/pdf-template";\nimport {',
        1,
    )

text = text.replace("Baixar TXT", "Baixar PDF")
text = text.replace("downloadReport", "downloadPdfReport")

old_function = '''  function downloadPdfReport() {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");

    element.href = url;
    element.download = `relatorio-${project.name.toLowerCase().replace(/\\s+/g, "-")}.txt`;
    element.click();

    URL.revokeObjectURL(url);
  }'''

new_function = '''  function downloadPdfReport() {
    const bodyHtml = `
      <h2>Resumo financeiro</h2>
      <table>
        <thead>
          <tr>
            <th>Indicador</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Previsto</td><td>${formatBRL(totals.planned)}</td></tr>
          <tr><td>Pago</td><td>${formatBRL(totals.paid)}</td></tr>
          <tr><td>Em aberto</td><td>${formatBRL(totals.open)}</td></tr>
        </tbody>
      </table>

      <h2>Pendências</h2>
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Tipo</th>
            <th>Prioridade</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.pending.length
              ? data.pending.map((item) => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.type || "Não informado"}</td>
                  <td>${item.priority}</td>
                  <td>${item.status}</td>
                </tr>
              `).join("")
              : `<tr><td colspan="4">Nenhuma pendência cadastrada.</td></tr>`
          }
        </tbody>
      </table>

      <h2>Tarefas</h2>
      <table>
        <thead>
          <tr>
            <th>Tarefa</th>
            <th>Etapa</th>
            <th>Responsável</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.tasks.length
              ? data.tasks.map((item) => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.stage || "Não informada"}</td>
                  <td>${item.assignee || "Não informado"}</td>
                  <td>${item.status}</td>
                </tr>
              `).join("")
              : `<tr><td colspan="4">Nenhuma tarefa cadastrada.</td></tr>`
          }
        </tbody>
      </table>

      <h2>Rubricas</h2>
      <table>
        <thead>
          <tr>
            <th>Rubrica</th>
            <th>Previsto</th>
            <th>Pago</th>
            <th>Em aberto</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.rubrics.length
              ? data.rubrics.map((item) => {
                const planned = parseCurrency(item.planned);
                const paid = parseCurrency(item.paid);
                const open = Math.max(planned - paid, 0);

                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.planned || "R$ 0,00"}</td>
                    <td>${item.paid || "R$ 0,00"}</td>
                    <td>${formatBRL(open)}</td>
                  </tr>
                `;
              }).join("")
              : `<tr><td colspan="4">Nenhuma rubrica cadastrada.</td></tr>`
          }
        </tbody>
      </table>
    `;

    openSystemPdf({
      title: `Relatório do projeto ${project.name}`,
      subtitle: "Relatório automático gerado pela Central de Gestão.",
      documentLabel: "Relatório de gestão do projeto",
      preparedBy: "Sistema",
      fileName: `relatorio-${project.name.toLowerCase().replace(/\\s+/g, "-")}.pdf`,
      bodyHtml,
    });
  }'''

if old_function in text:
    text = text.replace(old_function, new_function)
else:
    print("AVISO: não encontrei a função antiga de TXT. Verifique se a tela Gestão já foi alterada anteriormente.")

path.write_text(text)
PY

echo "Adicionando link de configuração de PDF no menu, se possível..."
python3 - <<'PY'
from pathlib import Path

sidebar = Path("src/components/layout/app-sidebar.tsx")

if not sidebar.exists():
    print("AVISO: menu lateral não encontrado.")
    raise SystemExit(0)

text = sidebar.read_text()

if 'href: "/configuracoes/pdf"' not in text:
    target = '{ label: "Configurações", href: "/configuracoes/geral", icon: Settings },'
    insert = '{ label: "Modelo de PDF", href: "/configuracoes/pdf", icon: FileText }, '

    if target in text:
        text = text.replace(target, insert + target)
    else:
        print("AVISO: não encontrei o ponto exato no menu. A rota /configuracoes/pdf foi criada.")

sidebar.write_text(text)
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

echo "Conferindo arquivos criados..."
grep -R "openSystemPdf" -n src/lib/pdf/pdf-template.ts src/components/advanced-management/advanced-management-panel.tsx || true
grep -R "Modelo de PDF" -n 'src/app/(protected)/configuracoes/pdf/page.tsx' src/components/pdf/pdf-branding-settings.tsx
grep -R 'href: "/configuracoes/pdf"' -n src/components/layout/app-sidebar.tsx || true

echo "Status:"
git status --short

git add src/lib/pdf src/components/pdf 'src/app/(protected)/configuracoes/pdf' src/components/advanced-management/advanced-management-panel.tsx src/components/layout/app-sidebar.tsx .gitignore package.json package-lock.json
git commit -m "Adiciona modelo padrao para PDFs da Cia Viva" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Use /configuracoes/pdf para subir a logo e /gestao para gerar PDF."
