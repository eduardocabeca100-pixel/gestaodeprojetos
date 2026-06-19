import type { Report } from "./types";

export const reports: Report[] = [
  {
    id: "report-1",
    projectId: "refens",
    type: "Dossiê completo do projeto",
    title: "Dossiê inicial - Reféns",
    generatedAt: "2026-06-18",
    generatedBy: "Eduardo / Marcel",
    includes: ["Documentos", "Cronograma", "Financeiro", "Participantes"],
    status: "Rascunho",
  },
  {
    id: "report-2",
    projectId: "refens",
    type: "Relatório financeiro",
    title: "Execução financeira parcial",
    generatedAt: "2026-08-20",
    generatedBy: "Direção executiva",
    includes: ["Rubricas", "Despesas", "Comprovantes"],
    status: "Gerado",
  },
];

export async function listReports() {
  return reports;
}
