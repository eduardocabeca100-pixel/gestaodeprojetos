import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { ProjectDocument } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildDocuments(project: Project): ProjectDocument[] {
  const slug = project.slug;

  return [
    {
      id: `${project.id}-doc-certidao`,
      fileName: `certidao-negativa-${slug}.pdf`,
      category: "Certidões",
      projectId: project.id,
      linkedTo: "Habilitação documental",
      uploadedAt: "2026-06-12",
      uploadedBy: "Eduardo / Marcel",
      expiresAt: "2026-08-25",
      notes: `Monitorar vencimento antes da assinatura do termo de ${project.name}.`,
      status: "Válido",
    },
    {
      id: `${project.id}-doc-proposta`,
      fileName: `proposta-${slug}.pdf`,
      category: "Proposta e anexos",
      projectId: project.id,
      linkedTo: "Projeto",
      uploadedAt: "2026-06-10",
      uploadedBy: "Direção executiva",
      expiresAt: null,
      notes: `Versão enviada na inscrição ${project.registrationNumber}.`,
      status: "Válido",
    },
    {
      id: `${project.id}-doc-presenca`,
      fileName: `modelo-lista-presenca-${slug}.docx`,
      category: "Lista de presença",
      projectId: project.id,
      linkedTo: "Aulas e atividades",
      uploadedAt: "2026-06-16",
      uploadedBy: "Eduardo / Marcel",
      expiresAt: null,
      notes: "Modelo editável para aulas, ensaios e apresentações.",
      status: project.id === "prazer-laodiceia" ? "Pendente" : "Válido",
    },
  ];
}

export async function listDocuments(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildDocuments(project);
}

export async function listExpiringDocuments(projectId?: string) {
  const documents = await listDocuments(projectId);

  return documents.filter((document) => document.expiresAt);
}
