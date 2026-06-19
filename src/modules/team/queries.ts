import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { TeamMember } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildTeamMembers(project: Project): TeamMember[] {
  const productionPaid = Math.round(project.executedAmount * 0.15);
  const artistPaid = Math.round(project.executedAmount * 0.5);

  return [
    {
      id: `${project.id}-team-direcao`,
      projectId: project.id,
      name: "Direção Viva",
      role: "Diretor geral",
      phone: "(48) 99999-0001",
      email: "direcao@viva.local",
      document: "000.000.000-00",
      expectedAmount: Math.round(project.approvedAmount * 0.16),
      paidAmount: 0,
      paymentStatus: "Previsto",
      documents: [`contrato-direcao-${project.slug}.pdf`],
      notes: `Responsável artístico por ${project.name}.`,
    },
    {
      id: `${project.id}-team-artistico`,
      projectId: project.id,
      name: "Equipe artística",
      role: "Ator",
      phone: "(48) 99999-0002",
      email: "artistico@viva.local",
      document: "000.000.000-00",
      expectedAmount: Math.round(project.approvedAmount * 0.26),
      paidAmount: artistPaid,
      paymentStatus: artistPaid > 0 ? "Parcial" : "Previsto",
      documents: [`recibo-artistico-${project.slug}.pdf`],
      notes: "Integrantes podem receber por recibo quando forem pessoa física.",
    },
    {
      id: `${project.id}-team-producao`,
      projectId: project.id,
      name: "Produção executiva",
      role: "Produtor executivo",
      phone: "(48) 99999-0003",
      email: "producao@viva.local",
      document: "00.000.000/0001-00",
      expectedAmount: Math.round(project.approvedAmount * 0.2),
      paidAmount: productionPaid,
      paymentStatus: productionPaid > 0 ? "Parcial" : "Previsto",
      documents: [`contrato-producao-${project.slug}.pdf`],
      notes: "Documentos, cronograma, financeiro e prestação de contas.",
    },
  ];
}

export async function listTeamMembers(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildTeamMembers(project);
}
