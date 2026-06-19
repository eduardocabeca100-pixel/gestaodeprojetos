export const documentCategories = [
  "Habilitação",
  "Edital e anexos",
  "Proposta e anexos",
  "Certidões",
  "Termos e contratos",
  "Orçamento",
  "Comprovantes financeiros",
  "Relatórios",
  "Autorizações de imagem",
  "Lista de presença",
  "Documentos da equipe",
  "Documentos dos participantes",
  "Outros",
] as const;

export const documentStatuses = [
  "Válido",
  "Vencido",
  "Pendente",
  "Substituído",
  "Arquivado",
] as const;

export type DocumentCategory = (typeof documentCategories)[number];
export type DocumentStatus = (typeof documentStatuses)[number];

export type ProjectDocument = {
  id: string;
  fileName: string;
  category: DocumentCategory;
  projectId: string;
  linkedTo: string;
  uploadedAt: string;
  uploadedBy: string;
  expiresAt: string | null;
  notes: string;
  status: DocumentStatus;
};
