export const editalAttachmentKinds = [
  "Edital principal",
  "Anexo do edital",
  "Habilitação",
  "Complementar",
  "Autorização",
  "Ofício",
  "Resposta",
  "Retificação",
  "Outros",
] as const;

export const editalAttachmentStatuses = [
  "Pendente",
  "Recebido",
  "Arquivado",
  "Publicado",
] as const;

export type EditalAttachmentKind = (typeof editalAttachmentKinds)[number];
export type EditalAttachmentStatus = (typeof editalAttachmentStatuses)[number];

export type EditalAttachment = {
  id: string;
  projectId: string;
  kind: EditalAttachmentKind;
  title: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  status: EditalAttachmentStatus;
  notes: string;
};

export function normalizeEditalAttachmentKind(kind: string): EditalAttachmentKind {
  if (kind === "Edital e anexos") {
    return "Edital principal";
  }

  return editalAttachmentKinds.includes(kind as EditalAttachmentKind)
    ? (kind as EditalAttachmentKind)
    : "Outros";
}

export function normalizeEditalAttachmentStatus(status: string): EditalAttachmentStatus {
  if (editalAttachmentStatuses.includes(status as EditalAttachmentStatus)) {
    return status as EditalAttachmentStatus;
  }

  if (status === "Válido" || status === "Substituído") {
    return "Recebido";
  }

  if (status === "Vencido") {
    return "Arquivado";
  }

  return "Pendente";
}
