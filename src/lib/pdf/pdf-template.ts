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
  titleColor: string;
  bodyTextColor: string;
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
  systemTitle: "VIVA Gestão Cultural",
  companyName: "Cia de Artes Viva",
  subtitle: "Gestão de Projetos Culturais, Artísticos e Administrativos",
  cnpj: "",
  cityUf: "Jaraguá do Sul | SC",
  email: "eduardo@ciaviva.com",
  phone: "(47) 992747545",
  site: "www.ciaviva.com",
  footerText: "Cia de Artes Viva - Gestão Cultural",
  footerSite: "WWW.CIAVIVA.COM",
  versionLabel: "V2026",
  primaryColor: "#173819",
  titleColor: "#173819",
  bodyTextColor: "#111827",
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

export function escapePdfHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getTodayBr() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

export function buildSystemPdfHtml(
  options: SystemPdfOptions,
  settings: SystemPdfSettings = defaultPdfSettings,
  showPrintButton = true,
) {
  const primary = settings.primaryColor || defaultPdfSettings.primaryColor;
  const titleColor = settings.titleColor || defaultPdfSettings.titleColor;
  const bodyTextColor = settings.bodyTextColor || defaultPdfSettings.bodyTextColor;
  const issuedAt = getTodayBr();
  const fileName = escapePdfHtml(options.fileName ?? "documento-cia-viva.pdf");
  const documentLabel = escapePdfHtml(options.documentLabel ?? "Documento");
  const preparedBy = escapePdfHtml(options.preparedBy ?? "Sistema");
  const subtitle = escapePdfHtml(options.subtitle ?? "");
  const logo = settings.logoDataUrl
    ? `<img src="${settings.logoDataUrl}" alt="Logo" />`
    : `<span>LOGO</span>`;

  return `<!doctype html>
<html lang="pt-BR" data-viva-pdf-template="white-a4">
<head>
  <meta charset="utf-8" />
  <title>${fileName}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; min-height: 100%; background: #f3f4f6; color: ${bodyTextColor}; font-family: Arial, Helvetica, sans-serif; }
    .print-actions { position: fixed; top: 18px; right: 18px; z-index: 20; display: ${showPrintButton ? "flex" : "none"}; }
    .print-actions button { border: 0; border-radius: 999px; padding: 12px 18px; color: #fff; background: ${primary}; font-weight: 900; cursor: pointer; box-shadow: 0 12px 30px rgba(0,0,0,.18); }
    .sheet { width: 210mm; min-height: 297mm; margin: 18px auto; background: #fff; padding: 17mm 18mm 15mm; box-shadow: 0 20px 60px rgba(0,0,0,.14); }
    .pdf-header { display: grid; grid-template-columns: 27mm 1fr 55mm; gap: 8mm; align-items: start; padding-bottom: 8mm; border-bottom: 1px solid #111827; }
    .logo-box { width: 23mm; height: 23mm; display: grid; place-items: center; overflow: hidden; border: 1px solid #d1d5db; color: ${primary}; font-size: 7pt; font-weight: 900; text-align: center; }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; padding: 2mm; }
    .brand-title { margin: 0; color: ${titleColor}; font-size: 17pt; line-height: 1.08; text-transform: uppercase; }
    .brand-name { margin: 2.5mm 0 0; color: ${titleColor}; font-size: 14pt; font-weight: 700; }
    .brand-subtitle { margin: 2mm 0 0; color: #4b5563; font-size: 8.5pt; line-height: 1.4; }
    .contact-list { display: grid; gap: 2mm; font-size: 8.2pt; line-height: 1.25; }
    .contact-list div { display: grid; grid-template-columns: 15mm 1fr; gap: 2mm; }
    .contact-list strong { color: ${titleColor}; }
    .document-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin: 8mm 0; padding-bottom: 5mm; border-bottom: 1px solid #e5e7eb; font-size: 8.5pt; }
    .document-meta span { display: block; color: #6b7280; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .12em; font-weight: 900; }
    .document-content { font-size: 10pt; line-height: 1.55; }
    .document-content h1 { margin: 0 0 4mm; color: ${titleColor}; font-size: 18pt; line-height: 1.15; }
    .document-content h2 { margin: 7mm 0 2.5mm; color: ${titleColor}; font-size: 13pt; }
    .document-content h3 { margin: 5mm 0 2mm; color: ${titleColor}; font-size: 11.5pt; }
    .document-content table { width: 100%; border-collapse: collapse; margin: 4mm 0; font-size: 9pt; }
    .document-content th, .document-content td { border: 1px solid #d1d5db; padding: 2.2mm; text-align: left; vertical-align: top; }
    .document-content th { background: #f9fafb; color: ${titleColor}; font-weight: 900; }
    .pdf-footer { margin-top: 10mm; padding-top: 4mm; border-top: 1px solid #111827; color: #6b7280; font-size: 8pt; display: flex; justify-content: space-between; gap: 8mm; }
    @media print { html, body { background: #fff; } .print-actions { display: none; } .sheet { margin: 0; width: auto; min-height: auto; box-shadow: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="print-actions"><button onclick="window.print()">Salvar como PDF</button></div>
  <main class="sheet">
    <header class="pdf-header">
      <div class="logo-box">${logo}</div>
      <div>
        <h1 class="brand-title">${escapePdfHtml(settings.systemTitle)}</h1>
        <p class="brand-name">${escapePdfHtml(settings.companyName)}</p>
        <p class="brand-subtitle">${escapePdfHtml(settings.subtitle)}</p>
      </div>
      <div class="contact-list">
        <div><strong>CNPJ:</strong><span>${escapePdfHtml(settings.cnpj || "")}</span></div>
        <div><strong>Cidade/UF:</strong><span>${escapePdfHtml(settings.cityUf)}</span></div>
        <div><strong>E-mail:</strong><span>${escapePdfHtml(settings.email)}</span></div>
        <div><strong>Telefone:</strong><span>${escapePdfHtml(settings.phone)}</span></div>
        <div><strong>Site:</strong><span>${escapePdfHtml(settings.site)}</span></div>
      </div>
    </header>
    <section class="document-meta">
      <div><span>Documento</span>${documentLabel}</div>
      <div><span>Emissão / elaborado por</span>${issuedAt} • ${preparedBy}</div>
    </section>
    <section class="document-content">
      <h1>${escapePdfHtml(options.title)}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ""}
      ${options.bodyHtml}
    </section>
    <footer class="pdf-footer">
      <span>${escapePdfHtml(settings.footerText)}</span>
      <span>${escapePdfHtml(settings.footerSite)}</span>
    </footer>
  </main>
</body>
</html>`;
}

export function openSystemPdf(options: SystemPdfOptions) {
  if (typeof window === "undefined") return;
  const settings = getPdfSettings();
  const html = buildSystemPdfHtml(options, settings, true);
  const child = window.open("", "_blank", "noopener,noreferrer,width=980,height=760");

  if (!child) {
    window.alert("O navegador bloqueou a janela do PDF. Libere pop-ups para este site.");
    return;
  }

  child.document.open();
  child.document.write(html);
  child.document.close();
  child.focus();
}
