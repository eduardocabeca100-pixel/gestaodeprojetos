export const teamRoles = [
  "Diretor geral",
  "Diretor executivo",
  "Produtor executivo",
  "Professor/formador",
  "Ator",
  "Técnico de som",
  "Técnico de iluminação",
  "Fotógrafo",
  "Figurinista",
  "Cenógrafo",
  "Intérprete de Libras",
  "Preparador vocal",
  "Prestador de serviço",
  "Administrativo",
  "Financeiro",
] as const;

export const paymentStatuses = ["Previsto", "Parcial", "Pago", "Pendente"] as const;

export type TeamRole = (typeof teamRoles)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

export type TeamMember = {
  id: string;
  projectId: string;
  name: string;
  role: TeamRole;
  phone: string;
  email: string;
  document: string;
  expectedAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  documents: string[];
  notes: string;
};
