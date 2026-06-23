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
  titleColor: "#173819",
  bodyTextColor: "#1f2933",
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
  const titleColor = settings.titleColor || defaultPdfSettings.titleColor;
  const bodyTextColor = settings.bodyTextColor || defaultPdfSettings.bodyTextColor;
  const primarySoft = softenHex(primary, 0.18);
  const primaryMid = softenHex(primary, 0.55);
  const primaryStrong = softenHex(primary, 0.88);
  const issuedAt = getTodayBr();

  const title = escapePdfHtml(options.title);
  const subtitle = escapePdfHtml(options.subtitle ?? "");
  const documentLabel = escapePdfHtml(options.documentLabel ?? "Documento gerado pelo sistema");
  const preparedBy = escapePdfHtml(options.preparedBy ?? "Sistema");
  const fileName = escapePdfHtml(options.fileName ?? "documento-cia-viva.pdf");

  const systemTitle = escapePdfHtml(settings.systemTitle);
  const companyName = escapePdfHtml(settings.companyName);
  const systemSubtitle = escapePdfHtml(settings.subtitle);
  const cnpj = escapePdfHtml(settings.cnpj || "____________________");
  const cityUf = escapePdfHtml(settings.cityUf);
  const email = escapePdfHtml(settings.email);
  const phone = escapePdfHtml(settings.phone);
  const site = escapePdfHtml(settings.site);
  const footerText = escapePdfHtml(settings.footerText);
  const footerSite = escapePdfHtml(settings.footerSite);

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
      color: ${bodyTextColor};
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
      color: ${titleColor};
      font-size: 17.2pt;
      line-height: 1.08;
      letter-spacing: -0.035em;
      text-transform: uppercase;
      font-weight: 950;
    }

    .brand-name {
      margin: 3mm 0 0;
      color: ${titleColor};
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
      color: ${bodyTextColor};
      font-size: 10pt;
      line-height: 1.65;
    }

    .document-content h1,
    .document-content h2,
    .document-content h3 {
      color: ${titleColor};
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

    .document-content .eyebrow {
      margin: 0 0 3mm;
      color: ${primary};
      font-size: 7.6pt;
      font-weight: 950;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .document-content .document-section {
      margin-top: 8mm;
    }

    .document-content .pre-line {
      white-space: pre-line;
    }

    .document-content .info-grid {
      display: grid;
      gap: 4mm;
      margin: 5mm 0 8mm;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .document-content .info-card {
      border: 1px solid #d7ddd5;
      border-radius: 4mm;
      padding: 4mm;
      background: linear-gradient(180deg, ${primarySoft} 0%, rgba(255,255,255,0.98) 100%);
    }

    .document-content .info-card strong,
    .document-content .detail-list strong {
      display: block;
      margin-bottom: 1.5mm;
      color: ${primary};
      font-size: 7.4pt;
      font-weight: 950;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .document-content .detail-list {
      display: grid;
      gap: 4mm;
      margin: 6mm 0;
    }

    .document-content .inline-note {
      margin: 6mm 0;
      border-left: 3px solid ${primary};
      padding: 3mm 0 3mm 4mm;
      color: #4d5b52;
      background: linear-gradient(90deg, ${primarySoft} 0%, rgba(255,255,255,0) 100%);
    }

    .document-content .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10mm;
      margin-top: 10mm;
    }

    .document-content .signature-card {
      padding-top: 10mm;
      text-align: center;
    }

    .document-content .signature-line {
      margin-bottom: 2mm;
      border-top: 1px solid #718172;
      height: 1px;
    }

    .document-content .signature-name {
      font-weight: 700;
    }

    .document-content .signature-role {
      color: #5d685f;
      font-size: 8.2pt;
    }

    .document-content .supporting-image {
      margin: 6mm 0 0;
      text-align: center;
    }

    .document-content .supporting-image img {
      max-width: 100%;
      max-height: 34mm;
      object-fit: contain;
      border: 1px solid #d7ddd5;
      border-radius: 4mm;
      padding: 3mm;
      background: white;
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

    @media (max-width: 980px) {
      .pdf-header,
      .document-meta,
      .document-content .info-grid,
      .document-content .signature-grid {
        grid-template-columns: 1fr;
      }
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
        min-height: auto;
        box-shadow: none;
        overflow: visible;
      }

      .sheet::before,
      .sheet::after {
        display: none;
      }

      .pdf-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 5;
        padding: 12mm 18mm 6mm;
        background: white;
      }

      .header-line {
        position: fixed;
        top: 42mm;
        left: 18mm;
        right: 18mm;
        z-index: 5;
        margin: 0;
      }

      .content-frame {
        margin: 49mm 18mm 28mm;
        min-height: auto;
        padding-bottom: 0;
      }

      .pdf-footer {
        position: fixed;
        left: 18mm;
        right: 18mm;
        bottom: 8mm;
        z-index: 5;
        background: white;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button onclick="window.print()">Salvar como PDF</button>
  </div>

  <section class="sheet" data-viva-pdf-template="system">
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
          ${issuedAt} • ${preparedBy}
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
      <div class="footer-page">Emitido em ${issuedAt}</div>
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
