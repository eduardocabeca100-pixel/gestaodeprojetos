export const officialDocumentTemplates = [
  "Ofício",
  "Pauta de Reunião",
  "Ata de Reunião",
  "Deliberação do Conselho",
  "Documento para Assinatura",
  "Autorização de Compra",
  "Memorando Interno",
  "Declaração",
  "Relatório",
  "Termo / Contrato",
  "Projeto Cultural",
  "Autorização de Imagem",
  "Autorização de Responsável",
  "Recibo de Prestador PF",
  "Recibo de Ator/Artista",
] as const;

export type OfficialDocumentTemplate =
  (typeof officialDocumentTemplates)[number];

export type OfficialDocument = {
  id: string;
  projectId: string;
  template: OfficialDocumentTemplate;
  title: string;
  code: string;
  date: string;
  subject: string;
  status: "Rascunho" | "Finalizado" | "Assinado" | "Arquivado";
  recipient: string;
  recipientRole: string;
  institution: string;
  signerOne: string;
  signerOneRole: string;
  signerTwo: string;
  signerTwoRole: string;
  content: string;
};
