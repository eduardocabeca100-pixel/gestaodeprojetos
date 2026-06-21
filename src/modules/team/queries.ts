import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { TeamMember } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildTeamMembers(project: Project): TeamMember[] {
  const directionPaid = Math.round(project.executedAmount * 0.35);
  const accessibilityPaid = Math.round(project.executedAmount * 0.12);
  const vocalPaid = Math.round(project.executedAmount * 0.18);

  return [
    {
      id: `${project.id}-team-direcao`,
      projectId: project.id,
      name: "Marcel Eduardo Cabeça Domingues",
      role: "Diretor geral",
      phone: "",
      email: "",
      document: "59.053.899/0001-53",
      expectedAmount: 6000,
      paidAmount: directionPaid,
      paymentStatus: directionPaid > 0 ? "Parcial" : "Previsto",
      documents: [`contrato-direcao-${project.slug}.pdf`],
      notes: `Responsável pelo projeto ${project.name}.`,
    },
    {
      id: `${project.id}-team-libras`,
      projectId: project.id,
      name: "Suzi Daiane",
      role: "Intérprete de Libras",
      phone: "",
      email: "",
      document: "",
      expectedAmount: 1200,
      paidAmount: accessibilityPaid,
      paymentStatus: accessibilityPaid > 0 ? "Parcial" : "Previsto",
      documents: [`acessibilidade-${project.slug}.pdf`],
      notes: "Responsável pela acessibilidade comunicacional do projeto.",
    },
    {
      id: `${project.id}-team-vocal`,
      projectId: project.id,
      name: "Katiana de Souza Coelho",
      role: "Preparador vocal",
      phone: "",
      email: "",
      document: "",
      expectedAmount: 1300,
      paidAmount: vocalPaid,
      paymentStatus: vocalPaid > 0 ? "Parcial" : "Previsto",
      documents: [`vocal-${project.slug}.pdf`],
      notes: "Preparação vocal e apoio musical do ciclo formativo.",
    },
  ];
}

export async function listTeamMembers(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildTeamMembers(project);
}
