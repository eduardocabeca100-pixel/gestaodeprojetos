#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-pdf-editavel-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

mkdir -p src/lib/pdf
mkdir -p src/components/pdf
mkdir -p 'src/app/(protected)/configuracoes/pdf'

cat > src/lib/pdf/pdf-template.ts <<'EOF'
export type SystemPdfSettings = {
  logoDataUrl: string;
  systemTitle: string;
  companyName: string;
  subtitle: string;
  cnpj: string;
  cityUf: string;
  email: string;
  phone: string;
  site: string;
  footerText: string;
  footerSite: string;
  versionLabel: string;
  primaryColor: string;
};

export type SystemPdfOptions = {
  title: string;
  subtitle?: string;
  documentLabel?: string;
  preparedBy?: string;
  bodyHtml: string;
  fileName?: string;
};

export const PDF_SETTINGS_STORAGE_KEY = "viva:pdf-settings:v2";

export const defaultPdfSettings: SystemPdfSettings = {
  logoDataUrl: "",
  systemTitle: "SISTEMA DE GESTÃO DE PROJETOS",
  companyName: "Cia de Artes Viva",
  subtitle: "Gestão de Projetos Culturais, Artísticos e Administrativos",
  cnpj: "",
  cityUf: "Jaraguá do Sul | SC",
  email: "eduardo@ciaviva.com",
  phone: "(47) 992747545",
  site: "www.ciaviva.com",
  footerText: "SISTEMA DE GESTÃO DE PROJETOS • CIA DE ARTES VIVA • V2026",
  footerSite: "WWW.CIAVIVA.COM",
  versionLabel: "V2026",
  primaryColor: "#2f6b2f",
};

export function getPdfSettings(): SystemPdfSettings {
  if (typeof window === "undefined") return defaultPdfSettings;

  try {
    const saved = window.localStorage.getItem(PDF_SETTINGS_STORAGE_KEY);
    return saved
      ? { ...defaultPdfSettings, ...(JSON.parse(saved) as Partial<SystemPdfSettings>) }
      : defaultPdfSettings;
  } catch {
    return defaultPdfSettings;
  }
}

export function savePdfSettings(settings: SystemPdfSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PDF_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function resetPdfSettings() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PDF_SETTINGS_STORAGE_KEY);
}

function escapeHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getTodayBr() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

function softenHex(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);

  if (Number.isNaN(bigint) || normalized.length !== 6) {
    return `rgba(47, 107, 47, ${opacity})`;
  }

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function buildSystemPdfHtml(
  options: SystemPdfOptions,
  settings: SystemPdfSettings = defaultPdfSettings,
  showPrintButton = true,
) {
  const primary = settings.primaryColor || defaultPdfSettings.primaryColor;
  const primarySoft = softenHex(primary, 0.18);
  const primaryMid = softenHex(primary, 0.55);
  const primaryStrong = softenHex(primary, 0.88);

  const title = escapeHtml(options.title);
  const subtitle = escapeHtml(options.subtitle ?? "");
  const documentLabel = escapeHtml(options.documentLabel ?? "Documento gerado pelo sistema");
  const preparedBy = escapeHtml(options.preparedBy ?? "Sistema");
  const fileName = escapeHtml(options.fileName ?? "documento-cia-viva.pdf");

  const systemTitle = escapeHtml(settings.systemTitle);
  const companyName = escapeHtml(settings.companyName);
  const systemSubtitle = escapeHtml(settings.subtitle);
  const cnpj = escapeHtml(settings.cnpj || "____________________");
  const cityUf = escapeHtml(settings.cityUf);
  const email = escapeHtml(settings.email);
  const phone = escapeHtml(settings.phone);
  const site = escapeHtml(settings.site);
  const footerText = escapeHtml(settings.footerText);
  const footerSite = escapeHtml(settings.footerSite);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${fileName}</title>
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
      background: #eef0eb;
      color: #1f2933;
      font-family: Inter, "SF Pro Text", "Segoe UI", Arial, sans-serif;
    }

    .print-actions {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 50;
      display: ${showPrintButton ? "flex" : "none"};
      gap: 10px;
    }

    .print-actions button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      color: white;
      background: ${primary};
      font-weight: 900;
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
      pointer-events: none;
      z-index: 1;
    }

    .sheet::before {
      right: -21mm;
      top: -24mm;
      width: 96mm;
      height: 62mm;
      background:
        linear-gradient(135deg, transparent 0 35%, ${primaryStrong} 35% 57%, transparent 57%),
        linear-gradient(32deg, transparent 0 42%, ${primaryMid} 42% 65%, transparent 65%),
        linear-gradient(155deg, transparent 0 50%, ${primarySoft} 50% 72%, transparent 72%);
      transform: rotate(2deg);
    }

    .sheet::after {
      left: -24mm;
      bottom: -27mm;
      width: 114mm;
      height: 64mm;
      background:
        linear-gradient(135deg, transparent 0 35%, ${primaryStrong} 35% 56%, transparent 56%),
        linear-gradient(35deg, transparent 0 44%, ${primaryMid} 44% 66%, transparent 66%),
        linear-gradient(158deg, transparent 0 50%, ${primarySoft} 50% 72%, transparent 72%);
      transform: rotate(180deg);
    }

    .pdf-header {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 30mm 1fr 65mm;
      gap: 9mm;
      align-items: start;
      padding: 23mm 18mm 8mm;
    }

    .logo-box {
      width: 25mm;
      height: 25mm;
      border: 1px solid ${primaryMid};
      border-radius: 3mm;
      display: grid;
      place-items: center;
      overflow: hidden;
      color: ${primary};
      text-align: center;
      font-size: 7.3pt;
      font-weight: 900;
      line-height: 1.25;
    }

    .logo-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 2.5mm;
    }

    .brand-title {
      margin: 0;
      color: ${primary};
      font-size: 17.2pt;
      line-height: 1.08;
      letter-spacing: -0.035em;
      text-transform: uppercase;
      font-weight: 950;
    }

    .brand-name {
      margin: 3mm 0 0;
      color: ${primary};
      font-size: 15.5pt;
      line-height: 1.1;
      font-weight: 500;
    }

    .brand-subtitle {
      margin: 3mm 0 0;
      padding-top: 3mm;
      border-top: 1px solid ${primarySoft};
      color: #56615a;
      font-size: 8.5pt;
      line-height: 1.45;
    }

    .contact-list {
      display: grid;
      gap: 2.6mm;
      color: #26312b;
      font-size: 8.2pt;
      line-height: 1.25;
    }

    .contact-list div {
      display: grid;
      grid-template-columns: 16mm 1fr;
      gap: 2mm;
    }

    .contact-list strong {
      color: ${primary};
      font-weight: 950;
    }

    .header-line {
      position: relative;
      z-index: 2;
      margin: 0 18mm;
      height: 1px;
      background: ${primary};
      opacity: 0.72;
    }

    .content-frame {
      position: relative;
      z-index: 2;
      margin: 8mm 18mm 0;
      min-height: 195mm;
      padding-bottom: 26mm;
    }

    .document-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
      margin-bottom: 7mm;
      padding: 4mm 0 5mm;
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
      color: #202820;
      font-size: 10pt;
      line-height: 1.65;
    }

    .document-content h1,
    .document-content h2,
    .document-content h3 {
      color: ${primary};
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
      background: ${primary};
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
      bottom: 12mm;
      z-index: 3;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8mm;
      align-items: end;
      color: #26312b;
      font-size: 7.4pt;
    }

    .footer-line {
      grid-column: 1 / -1;
      height: 1px;
      background: ${primary};
      opacity: 0.72;
    }

    .footer-system {
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .footer-site {
      color: ${primary};
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
          settings.logoDataUrl
            ? `<img src="${settings.logoDataUrl}" alt="Logo" />`
            : `<span>ÁREA<br/>PARA<br/>LOGO</span>`
        }
      </div>

      <div>
        <h1 class="brand-title">${systemTitle}</h1>
        <p class="brand-name">${companyName}</p>
        <p class="brand-subtitle">${systemSubtitle}</p>
      </div>

      <div class="contact-list">
        <div><strong>CNPJ:</strong><span>${cnpj}</span></div>
        <div><strong>Cidade/UF:</strong><span>${cityUf}</span></div>
        <div><strong>E-mail:</strong><span>${email}</span></div>
        <div><strong>Telefone:</strong><span>${phone}</span></div>
        <div><strong>Site:</strong><span>${site}</span></div>
      </div>
    </header>

    <div class="header-line"></div>

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
      <div class="footer-system">${footerText}</div>
      <div class="footer-site">${footerSite}</div>
      <div class="footer-page">Página 1</div>
    </footer>
  </section>
</body>
</html>`;
}

export function openSystemPdf(options: SystemPdfOptions) {
  if (typeof window === "undefined") return;

  const settings = getPdfSettings();
  const html = buildSystemPdfHtml(options, settings, true);
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

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Eye, ImagePlus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildSystemPdfHtml,
  defaultPdfSettings,
  getPdfSettings,
  savePdfSettings,
  resetPdfSettings,
  type SystemPdfSettings,
} from "@/lib/pdf/pdf-template";

const sampleBodyHtml = `
  <h2>Área de conteúdo do documento</h2>
  <p>
    Este espaço representa o conteúdo que será gerado por cada módulo do sistema:
    relatórios, dossiês, orçamentos, documentos financeiros, equipe, rubricas e demais exportações.
  </p>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Descrição</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>01</td>
        <td>Exemplo de conteúdo dentro do modelo padrão</td>
        <td>Ativo</td>
      </tr>
      <tr>
        <td>02</td>
        <td>Todos os PDFs devem usar este cabeçalho e rodapé</td>
        <td>Padronizado</td>
      </tr>
    </tbody>
  </table>
`;

export function PdfBrandingSettings() {
  const [settings, setSettings] = useState<SystemPdfSettings>(defaultPdfSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(getPdfSettings());
  }, []);

  const previewHtml = useMemo(() => {
    return buildSystemPdfHtml(
      {
        title: "Pré-visualização do modelo",
        subtitle: "Modelo padrão em folha A4 para exportações do sistema.",
        documentLabel: "Modelo institucional de PDF",
        preparedBy: "Eduardo",
        bodyHtml: sampleBodyHtml,
        fileName: "modelo-pdf-cia-viva.pdf",
      },
      settings,
      false,
    );
  }, [settings]);

  function updateField<K extends keyof SystemPdfSettings>(field: K, value: SystemPdfSettings[K]) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      updateField("logoDataUrl", String(reader.result ?? ""));
    };

    reader.readAsDataURL(file);
  }

  function saveSettings() {
    savePdfSettings(settings);
    setMessage("Modelo de PDF salvo neste navegador.");
  }

  function restoreDefault() {
    resetPdfSettings();
    setSettings(defaultPdfSettings);
    setMessage("Modelo restaurado para o padrão inicial.");
  }

  function clearLogo() {
    updateField("logoDataUrl", "");
    setMessage("Logo removida da pré-visualização. Clique em salvar para confirmar.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
            Modelo de PDF
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Cabeçalho, rodapé e identidade
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Edite as informações que aparecerão em todos os PDFs do sistema.
          </p>
        </div>

        {message ? (
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
            <div className="flex min-h-32 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-3">
              {settings.logoDataUrl ? (
                <img src={settings.logoDataUrl} alt="Logo do PDF" className="max-h-28 max-w-full object-contain" />
              ) : (
                <span className="text-center text-xs font-black uppercase tracking-wide text-slate-400">
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

              {settings.logoDataUrl ? (
                <Button type="button" variant="outline" className="w-fit" onClick={clearLogo}>
                  <Trash2 className="mr-2 size-4" />
                  Remover logo
                </Button>
              ) : null}
            </div>
          </div>

          <InputLine label="Título principal">
            <input value={settings.systemTitle} onChange={(event) => updateField("systemTitle", event.target.value)} className="pdf-input" />
          </InputLine>

          <InputLine label="Nome da companhia">
            <input value={settings.companyName} onChange={(event) => updateField("companyName", event.target.value)} className="pdf-input" />
          </InputLine>

          <InputLine label="Subtítulo">
            <input value={settings.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} className="pdf-input" />
          </InputLine>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputLine label="CNPJ">
              <input value={settings.cnpj} onChange={(event) => updateField("cnpj", event.target.value)} className="pdf-input" placeholder="Opcional" />
            </InputLine>

            <InputLine label="Cidade/UF">
              <input value={settings.cityUf} onChange={(event) => updateField("cityUf", event.target.value)} className="pdf-input" />
            </InputLine>
          </div>

          <InputLine label="E-mail">
            <input value={settings.email} onChange={(event) => updateField("email", event.target.value)} className="pdf-input" />
          </InputLine>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputLine label="Telefone">
              <input value={settings.phone} onChange={(event) => updateField("phone", event.target.value)} className="pdf-input" />
            </InputLine>

            <InputLine label="Site">
              <input value={settings.site} onChange={(event) => updateField("site", event.target.value)} className="pdf-input" />
            </InputLine>
          </div>

          <InputLine label="Texto do rodapé">
            <input value={settings.footerText} onChange={(event) => updateField("footerText", event.target.value)} className="pdf-input" />
          </InputLine>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputLine label="Site no rodapé">
              <input value={settings.footerSite} onChange={(event) => updateField("footerSite", event.target.value)} className="pdf-input" />
            </InputLine>

            <InputLine label="Cor principal">
              <input type="color" value={settings.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" onClick={saveSettings}>
              <Save className="mr-2 size-4" />
              Salvar modelo
            </Button>

            <Button type="button" variant="outline" onClick={restoreDefault}>
              <RotateCcw className="mr-2 size-4" />
              Restaurar padrão
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
              Pré-visualização A4
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Como o PDF será gerado
            </h2>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 sm:flex">
            <Eye className="size-4" />
            Preview
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
          <iframe
            title="Pré-visualização do modelo de PDF"
            srcDoc={previewHtml}
            className="h-[780px] w-full border-0 bg-slate-100"
          />
        </div>
      </section>

      <style jsx global>{`
        .pdf-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .pdf-input:focus {
          border-color: rgb(4 120 87);
          box-shadow: 0 0 0 4px rgba(4, 120, 87, 0.08);
        }
      `}</style>
    </div>
  );
}

function InputLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
EOF

python3 - <<'PY'
from pathlib import Path
import re

path = Path("src/components/pdf/pdf-branding-settings.tsx")
text = path.read_text()
style_match = re.search(r'\n\s*<style jsx global>\{`.*?`\}</style>', text, flags=re.DOTALL)

if style_match:
    text = text[:style_match.start()] + text[style_match.end():]
    text = text.replace('className="pdf-input"', 'className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"')
    path.write_text(text)
PY

cat > 'src/app/(protected)/configuracoes/pdf/page.tsx' <<'EOF'
import { PageContainer } from "@/components/layout/page-container";
import { PdfBrandingSettings } from "@/components/pdf/pdf-branding-settings";

export default function PdfSettingsPage() {
  return (
    <PageContainer
      title="Modelo de PDF"
      description="Edite o cabeçalho, rodapé, logo, dados institucionais e visualize o modelo A4 usado nas exportações."
    >
      <PdfBrandingSettings />
    </PageContainer>
  );
}
EOF

echo "Atualizando relatório da Gestão para usar modelo PDF editável, se o arquivo existir..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/advanced-management/advanced-management-panel.tsx")
if not path.exists():
    raise SystemExit(0)

text = path.read_text()

if 'from "@/lib/pdf/pdf-template"' not in text:
    text = text.replace(
        'import {',
        'import { openSystemPdf } from "@/lib/pdf/pdf-template";\nimport {',
        1,
    )

text = text.replace("Baixar TXT", "Baixar PDF")

if "function downloadReport()" in text and "openSystemPdf({" not in text:
    text = text.replace("function downloadReport()", "function downloadPdfReport()")
    text = text.replace("onClick={downloadReport}", "onClick={downloadPdfReport}")

path.write_text(text)
PY

echo "Adicionando menu Modelo de PDF, se possível..."
python3 - <<'PY'
from pathlib import Path

sidebar = Path("src/components/layout/app-sidebar.tsx")
if not sidebar.exists():
    raise SystemExit(0)

text = sidebar.read_text()

if 'href: "/configuracoes/pdf"' not in text:
    target = '{ label: "Configurações", href: "/configuracoes/geral", icon: Settings },'
    insert = '{ label: "Modelo de PDF", href: "/configuracoes/pdf", icon: FileText }, '

    if target in text:
        text = text.replace(target, insert + target)

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

echo "Buscando geradores antigos de PDF/dossiê que ainda precisam ser conectados ao modelo novo:"
grep -RInE "dossi|dossier|Baixar PDF|baixar.*pdf|jsPDF|html2pdf|Blob\\(|window\\.print|relatorio" src/app src/components src/modules 2>/dev/null | head -80 || true

echo "Status:"
git status --short

git add src/lib/pdf src/components/pdf 'src/app/(protected)/configuracoes/pdf' src/components/layout/app-sidebar.tsx src/components/advanced-management/advanced-management-panel.tsx .gitignore package.json package-lock.json
git commit -m "Cria modelo de PDF editavel com preview A4" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Abra /configuracoes/pdf para editar e visualizar o modelo."
