export const projectStatuses = [
  "Planejamento",
  "Inscrito",
  "Em avaliação",
  "Classificado",
  "Em habilitação",
  "Aguardando termo",
  "Aguardando repasse",
  "Em execução",
  "Prestação de contas",
  "Finalizado",
  "Arquivado",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export type ProjectStage =
  | "Avaliação"
  | "Habilitação"
  | "Assinatura do termo"
  | "Repasse"
  | "Execução"
  | "Prestação de contas";

export type Project = {
  id: string;
  name: string;
  fullTitle: string;
  slug: string;
  shortDescription: string;
  summary: string;
  edital: string;
  registrationNumber: string;
  approvedAmount: number;
  executedAmount: number;
  status: ProjectStatus;
  currentStage: string;
  modality: string;
  className: string;
  proponent: string;
  proponentDocument: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  coverUrl: string | null;
  bannerUrl: string | null;
  notes: string;
  archived: boolean;
};

export type ProjectKpi = {
  label: string;
  value: string;
  helper: string;
  tone: "purple" | "green" | "amber" | "cyan";
};
