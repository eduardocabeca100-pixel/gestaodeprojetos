import type { CertificateBatch, CertificateRecord, CertificateTemplate } from "./types";

export async function saveCertificateTemplate(template: CertificateTemplate) {
  return {
    ok: true,
    template,
  };
}

export async function emitCertificate(record: CertificateRecord) {
  return {
    ok: true,
    record,
  };
}

export async function emitCertificateBatch(batch: CertificateBatch) {
  return {
    ok: true,
    batch,
  };
}

export async function cancelCertificate(certificateId: string, reason: string) {
  return {
    ok: true,
    certificateId,
    reason,
  };
}
