import type { CertificateRecord, CertificateTemplate } from "./types";

export function buildCertificateFrontHtml(
  record: CertificateRecord,
  template: CertificateTemplate,
) {
  return `
    <article class="certificate-preview-front">
      <div class="certificate-preview-header">
        <div>
          <p class="certificate-preview-kicker">CIA DE ARTES VIVA</p>
          <h2>${template.name}</h2>
        </div>
        <div class="certificate-preview-number">${record.certificateNumber}</div>
      </div>
      <div class="certificate-preview-body">
        <p class="certificate-preview-title">CERTIFICADO</p>
        <p class="certificate-preview-text">${template.frontText}</p>
        <p class="certificate-preview-name">${record.studentName}</p>
        <p class="certificate-preview-meta">${record.courseName}</p>
        <p class="certificate-preview-meta">${record.modality} • ${record.workload}</p>
      </div>
    </article>
  `;
}

export function buildCertificateBackHtml(
  record: CertificateRecord,
  template: CertificateTemplate,
) {
  return `
    <article class="certificate-preview-back">
      <div class="certificate-preview-back-title">${template.backTitle}</div>
      <div class="certificate-preview-grid">
        <div>
          <h3>Conteúdo programático</h3>
          <p>${template.programContent}</p>
        </div>
        <div>
          <h3>Dados do certificado</h3>
          <p>Carga horária: ${record.workload}</p>
          <p>Registro: ${record.certificateNumber}</p>
          <p>Cidade: ${record.city}</p>
        </div>
      </div>
    </article>
  `;
}
