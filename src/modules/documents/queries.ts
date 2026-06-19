import type { ProjectDocument } from "./types";

export const documents: ProjectDocument[] = [
  {
    id: "doc-1",
    fileName: "certidao-negativa-estadual.pdf",
    category: "Certidões",
    projectId: "refens",
    linkedTo: "Habilitação documental",
    uploadedAt: "2026-06-12",
    uploadedBy: "Eduardo / Marcel",
    expiresAt: "2026-08-25",
    notes: "Monitorar vencimento antes da assinatura do termo.",
    status: "Válido",
  },
  {
    id: "doc-2",
    fileName: "proposta-refens.pdf",
    category: "Proposta e anexos",
    projectId: "refens",
    linkedTo: "Projeto",
    uploadedAt: "2026-06-10",
    uploadedBy: "Direção executiva",
    expiresAt: null,
    notes: "Versão enviada na inscrição 000937.",
    status: "Válido",
  },
  {
    id: "doc-3",
    fileName: "modelo-lista-presenca.docx",
    category: "Lista de presença",
    projectId: "refens",
    linkedTo: "Aulas",
    uploadedAt: "2026-06-16",
    uploadedBy: "Eduardo / Marcel",
    expiresAt: null,
    notes: "Modelo base para as 11 aulas.",
    status: "Pendente",
  },
];

export async function listDocuments() {
  return documents;
}

export async function listExpiringDocuments() {
  return documents.filter((document) => document.expiresAt);
}
