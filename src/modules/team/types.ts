export const teamRoles = [
  "Diretor geral",
  "Diretor executivo",
  "Produtor executivo",
  "Professor / formador",
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

// Team member specific to a project
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

// Global team roster member (reusable across projects)
export type TeamRosterMember = {
  id: string;
  name: string;
  role: TeamRole;
  phone: string;
  email: string;
  document: string;
  bio: string;
  avatarUrl: string | null;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Assignment of roster member to a project
export type TeamRosterAssignment = {
  id: string;
  teamRosterId: string;
  projectId: string;
  expectedAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes: string;
  assignedAt: string;
  rosterMember?: TeamRosterMember; // Optional nested member data
};
