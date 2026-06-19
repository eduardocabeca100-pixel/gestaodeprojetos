import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { Report } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildReports(project: Project): Report[] {
  return [
    {
      id: `${project.id}-report-1`,
      projectId: project.id,
      type: "Dossiê completo do projeto",
      title: `Dossiê inicial - ${project.name}`,
      generatedAt: "2026-06-18",
      generatedBy: "Eduardo / Marcel",
      includes: ["Documentos", "Cronograma", "Financeiro", "Participantes"],
      status: "Rascunho",
    },
    {
      id: `${project.id}-report-2`,
      projectId: project.id,
      type: "Relatório financeiro",
      title: `Execução financeira parcial - ${project.name}`,
      generatedAt: "2026-08-20",
      generatedBy: "Direção executiva",
      includes: ["Rubricas", "Despesas", "Comprovantes"],
      status: project.executedAmount > 0 ? "Gerado" : "Rascunho",
    },
  ];
}

export async function listReports(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildReports(project);
}
