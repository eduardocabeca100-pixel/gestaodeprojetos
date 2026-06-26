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
  subtitle: "",
  cnpj: "59.053.899/0001-53",
  cityUf: "Jaraguá do Sul | SC",
  email: "eduardo@ciaviva.com",
  phone: "(47) 992747545",
  site: "www.ciaviva.com",
  footerText: "Cia de Artes Viva",
  footerSite: "WWW.CIAVIVA.COM",
  versionLabel: "V2026",
  primaryColor: "#111827",
  titleColor: "#111827",
  bodyTextColor: "#111827",
};

export function getPdfSettings(): SystemPdfSettings {
  if (typeof window === "undefined") return defaultPdfSettings;

  try {
    const saved = window.localStorage.getItem(PDF_SETTINGS_STORAGE_KEY);

    if (!saved) {
      return defaultPdfSettings;
    }

    return {
      ...defaultPdfSettings,
      ...(JSON.parse(saved) as Partial<SystemPdfSettings>),
    };
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

function getTodayLongBr() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function normalizePreparedBy(preparedBy: string | undefined) {
  const value = String(preparedBy ?? "").trim();

  if (!value || value.toLowerCase() === "sistema") {
    return "Marcel Eduardo Cabeça Domingues";
  }

  return value;
}

function cleanOfficialBodyHtml(bodyHtml: string) {
  let html = String(bodyHtml ?? "");

  const phrasesToRemove = [
    "",
    "",
    "",
  ];

  for (const phrase of phrasesToRemove) {
    html = html.replaceAll(phrase, "");
  }

  html = html.replace(/<p[^>]*>\s*<\/p>/gi, "");
  html = html.replace(/<p[^>]*>\s*Atenciosamente,?\s*<\/p>/gi, "");
  html = html.replace(/Atenciosamente,?/gi, "");

  const labelsToRemove = ["Status do arquivo", "Cidade e data", "Responsável"];

  for (const label of labelsToRemove) {
    html = html.replace(
      new RegExp(`<tr[^>]*>[\\s\\S]*?${label}[\\s\\S]*?<\\/tr>`, "gi"),
      "",
    );

    html = html.replace(
      new RegExp(`<p[^>]*>\\s*<strong>\\s*${label}\\s*<\\/strong>\\s*<br\\s*\\/?>[\\s\\S]*?<\\/p>`, "gi"),
      "",
    );

    html = html.replace(
      new RegExp(`<div[^>]*>\\s*<strong>\\s*${label}\\s*<\\/strong>[\\s\\S]*?<\\/div>`, "gi"),
      "",
    );

    html = html.replace(
      new RegExp(`<strong>\\s*${label}\\s*<\\/strong>\\s*<br\\s*\\/?>\\s*[^<]*(?=<strong>|<h1|<h2|<h3|<p|<\\/p>|$)`, "gi"),
      "",
    );
  }

  return html;
}

export function buildSystemPdfHtml(
  options: SystemPdfOptions,
  settings: SystemPdfSettings = defaultPdfSettings,
  showPrintButton = true,
) {
  const primary = settings.primaryColor || defaultPdfSettings.primaryColor;
  const titleColor = settings.titleColor || defaultPdfSettings.titleColor;
  const bodyTextColor = settings.bodyTextColor || defaultPdfSettings.bodyTextColor;
  const fileName = escapePdfHtml(options.fileName ?? "documento-cia-viva.pdf");
  const preparedByName = normalizePreparedBy(options.preparedBy);
  const preparedBy = escapePdfHtml(preparedByName);
  const bodyHtml = cleanOfficialBodyHtml(options.bodyHtml);
  const cityName = settings.cityUf.split("|")[0]?.trim() || "Jaraguá do Sul";
  const closingDate = `${cityName}, ${getTodayLongBr()}.`;
  const cnpjLine = settings.cnpj ? `CNPJ: ${escapePdfHtml(settings.cnpj)}` : "";
  const companyName = escapePdfHtml(settings.companyName || "Cia de Artes Viva");

  const logo = settings.logoDataUrl
    ? `<img src="${settings.logoDataUrl}" alt="Logo" />`
    : `<span>LOGO</span>`;

  return `<!doctype html>
<html lang="pt-BR" data-viva-pdf-template="clean-office-a4">
<head>
  <meta charset="utf-8" />
  <title>${fileName}</title>
  <style>
    @page {
      size: A4;
      margin: 22mm 20mm 18mm;
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
      background: #f3f4f6;
      color: ${bodyTextColor};
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
    }

    .print-actions {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 20;
      display: ${showPrintButton ? "flex" : "none"};
    }

    .print-actions button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      color: #fff;
      background: ${primary};
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(0, 0, 0, .18);
    }

    .sheet {
      width: 210mm;
      margin: 18px auto;
      background: #fff;
      padding: 20mm 21mm 16mm;
      box-shadow: 0 20px 60px rgba(0, 0, 0, .14);
    }

    .letterhead {
      display: grid;
      grid-template-columns: 25mm minmax(0, 1fr);
      gap: 10mm;
      align-items: center;
      padding-bottom: 8mm;
      border-bottom: 1.1px solid #111827;
    }

    .logo-box {
      width: 23mm;
      height: 23mm;
      display: grid;
      place-items: center;
      overflow: hidden;
      border: 1px solid #9ca3af;
      color: #111827;
      font-size: 7pt;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
    }

    .logo-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 2mm;
    }

    .letterhead-main {
      text-align: center;
    }

    .company-title {
      margin: 0;
      color: ${titleColor};
      font-size: 14pt;
      line-height: 1.15;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .02em;
    }

    .company-contact {
      margin: 2.5mm 0 0;
      color: #374151;
      font-size: 8.5pt;
      line-height: 1.45;
    }

    .document-title {
      margin: 10mm 0 8mm;
      color: ${titleColor};
      font-size: 15pt;
      line-height: 1.2;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .document-content {
      color: ${bodyTextColor};
      font-size: 11pt;
      line-height: 1.58;
      text-align: left;
    }

    .document-content p {
      margin: 0 0 4.8mm;
      text-align: justify;
    }

    .document-content h1,
    .document-content h2,
    .document-content h3 {
      color: ${titleColor};
      line-height: 1.25;
    }

    .document-content h1 {
      margin: 0 0 5mm;
      font-size: 14pt;
      text-align: center;
      text-transform: uppercase;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .document-content h2 {
      margin: 8mm 0 3mm;
      font-size: 12pt;
      text-transform: uppercase;
    }

    .document-content h3 {
      margin: 6mm 0 2mm;
      font-size: 11pt;
    }

    .document-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 5mm 0;
      font-size: 9.2pt;
    }

    .document-content th,
    .document-content td {
      border: 1px solid #9ca3af;
      padding: 2.4mm;
      text-align: left;
      vertical-align: top;
    }

    .document-content th {
      background: #f9fafb;
      color: ${titleColor};
      font-weight: 900;
    }

    .closing-section {
      margin-top: 12mm;
      page-break-inside: avoid;
    }

    .closing-text {
      margin: 0 0 3mm;
      text-align: left;
    }

    .closing-date {
      margin: 0 0 22mm;
      text-align: left;
    }

    .signature-section {
      display: flex;
      justify-content: center;
      page-break-inside: avoid;
    }

    .signature-block {
      width: 92mm;
      text-align: center;
      color: #111827;
      font-size: 10pt;
      line-height: 1.35;
    }

    .signature-line {
      border-top: 1px solid #111827;
      margin-bottom: 2.5mm;
    }

    .signature-name {
      font-weight: 900;
      text-transform: uppercase;
    }

    .signature-document {
      margin-top: .8mm;
      color: #374151;
      font-size: 9.2pt;
    }

    .pdf-footer {
      margin-top: 15mm;
      padding-top: 4mm;
      border-top: 1px solid #d1d5db;
      color: #6b7280;
      font-size: 8pt;
      display: flex;
      justify-content: space-between;
      gap: 8mm;
    }

    @media print {
      html,
      body {
        background: #fff;
      }

      .print-actions {
        display: none;
      }

      .sheet {
        margin: 0;
        width: auto;
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button onclick="window.print()">Salvar como PDF</button>
  </div>

  <main class="sheet">
    <header class="letterhead">
      <div class="logo-box">${logo}</div>

      <div class="letterhead-main">
        <h1 class="company-title">${companyName}</h1>
        <p class="company-contact">
          ${escapePdfHtml(settings.cityUf)}
          ${settings.email ? ` • ${escapePdfHtml(settings.email)}` : ""}
          ${settings.phone ? ` • ${escapePdfHtml(settings.phone)}` : ""}
          ${settings.site ? ` • ${escapePdfHtml(settings.site)}` : ""}
          ${settings.cnpj ? `<br />CNPJ: ${escapePdfHtml(settings.cnpj)}` : ""}
        </p>
      </div>
    </header>

    <h1 class="document-title">${escapePdfHtml(options.title)}</h1>

    <section class="document-content">
      ${bodyHtml}
    </section>

    <section class="closing-section">
      <p class="closing-text">Atenciosamente,</p>
      <p class="closing-date">${escapePdfHtml(closingDate)}</p>

      <div class="signature-section">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-name">${preparedBy}</div>
          ${cnpjLine ? `<div class="signature-document">${cnpjLine}</div>` : ""}
        </div>
      </div>
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
  const frameId = "viva-pdf-print-frame";

  const oldFrame = window.document.getElementById(frameId);
  oldFrame?.remove();

  const iframe = window.document.createElement("iframe");
  iframe.id = frameId;
  iframe.title = "VIVA PDF";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  window.document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    window.alert("Não foi possível preparar o PDF neste navegador.");
    iframe.remove();
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  window.setTimeout(() => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } catch {
      window.alert("Não foi possível abrir a impressão do PDF neste navegador.");
    }

    window.setTimeout(() => iframe.remove(), 1500);
  }, 450);
}
