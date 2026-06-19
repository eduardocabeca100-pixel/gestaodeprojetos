export const reportTypes = [
  "Relatório de execução do projeto",
  "Relatório fotográfico",
  "Relatório financeiro",
  "Relatório de participantes",
  "Relatório de aulas",
  "Relatório de presença",
  "Relatório de apresentações",
  "Relatório final de prestação de contas",
  "Dossiê completo do projeto",
] as const;

export type ReportType = (typeof reportTypes)[number];

export type Report = {
  id: string;
  projectId: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  generatedBy: string;
  includes: string[];
  status: "Rascunho" | "Gerado" | "Arquivado";
};
