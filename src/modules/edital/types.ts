export const editalAttachmentKinds = [
  "Edital principal",
  "Anexo do edital",
  "Habilitação",
  "Complementar",
  "Autorização",
  "Ofício",
  "Resposta",
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
