import type { TeamMember } from "./types";

export const teamMembers: TeamMember[] = [
  {
    id: "team-1",
    projectId: "refens",
    name: "Direção Viva",
    role: "Diretor geral",
    phone: "(48) 99999-0001",
    email: "direcao@viva.local",
    document: "000.000.000-00",
    expectedAmount: 7000,
    paidAmount: 0,
    paymentStatus: "Previsto",
    documents: ["contrato-direcao.pdf"],
    notes: "Responsável artístico pela montagem.",
  },
  {
    id: "team-2",
    projectId: "refens",
    name: "Formador principal",
    role: "Professor/formador",
    phone: "(48) 99999-0002",
    email: "formacao@viva.local",
    document: "000.000.000-00",
    expectedAmount: 18000,
    paidAmount: 4500,
    paymentStatus: "Parcial",
    documents: ["contrato-formador.pdf", "recibo-formador-parcela-1.pdf"],
    notes: "Conduz aulas e observações pedagógicas.",
  },
  {
    id: "team-3",
    projectId: "refens",
    name: "Produção executiva",
    role: "Produtor executivo",
    phone: "(48) 99999-0003",
    email: "producao@viva.local",
    document: "00.000.000/0001-00",
    expectedAmount: 12000,
    paidAmount: 1000,
    paymentStatus: "Parcial",
    documents: ["contrato-producao.pdf"],
    notes: "Documentos, cronograma e prestação de contas.",
  },
];

export async function listTeamMembers() {
  return teamMembers;
}
