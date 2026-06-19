import type { OfficialDocument } from "./types";

export const officialDocuments: OfficialDocument[] = [
  {
    id: "ofc-001",
    projectId: "refens",
    template: "Ofício",
    title: "Solicitação de documentação complementar",
    code: "OFC-0001/2026",
    date: "2026-06-19",
    subject: "Habilitação documental do projeto Reféns",
    status: "Rascunho",
    recipient: "Comissão de Habilitação",
    recipientRole: "Setor responsável",
    institution: "Circuito Catarinense de Cultura PNAB SC 2026",
    signerOne: "Eduardo",
    signerOneRole: "Diretor Presidente",
    signerTwo: "Marcel",
    signerTwoRole: "Diretor Executivo",
    content:
      "Solicitamos a conferência dos documentos anexados para continuidade da habilitação documental do projeto Reféns.",
  },
  {
    id: "aut-001",
    projectId: "refens",
    template: "Autorização de Imagem",
    title: "Autorização de uso de imagem e voz",
    code: "AUT-0001/2026",
    date: "2026-06-19",
    subject: "Autorização para participantes",
    status: "Rascunho",
    recipient: "Participante do projeto",
    recipientRole: "Aluno/participante",
    institution: "Cia de Artes Viva",
    signerOne: "Participante",
    signerOneRole: "Autorizante",
    signerTwo: "Responsável legal",
    signerTwoRole: "Quando menor de idade",
    content:
      "Autorizo a utilização de imagem, voz e registro fotográfico para fins de divulgação, prestação de contas e memória institucional do projeto.",
  },
];

export async function listOfficialDocuments() {
  return officialDocuments;
}
