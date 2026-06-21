import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { EditalAttachment } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildEditalAttachments(project: Project): EditalAttachment[] {
  const isRefens = project.id === "refens";

  return [
    {
      id: `${project.id}-edital-1`,
      projectId: project.id,
      kind: "Edital principal",
      title: `Edital base - ${project.name}`,
      fileName: isRefens
        ? "Circuito_Catarinense_de_Cultura_PNAB_SC_2026.pdf"
        : `edital-${project.slug}.pdf`,
      uploadedAt: "2026-06-19",
      uploadedBy: "Marcel Eduardo Cabeça Domingues",
      status: "Publicado",
      notes: `Documento principal do projeto ${project.name}.`,
    },
    {
      id: `${project.id}-edital-2`,
      projectId: project.id,
      kind: "Habilitação",
      title: `Pasta de habilitação - ${project.name}`,
      fileName: isRefens
        ? `refens-habilitacao-documental.pdf`
        : `habilitacao-${project.slug}.pdf`,
      uploadedAt: "2026-06-19",
      uploadedBy: "Marcel Eduardo Cabeça Domingues",
      status: "Recebido",
      notes: "Documentos usados para conferência documental e tramitação interna.",
    },
    {
      id: `${project.id}-edital-3`,
      projectId: project.id,
      kind: "Anexo do edital",
      title: `Anexos complementares - ${project.name}`,
      fileName: isRefens
        ? `refens-anexos-complementares.pdf`
        : `anexos-${project.slug}.pdf`,
      uploadedAt: "2026-06-19",
      uploadedBy: "Kaique",
      status: "Arquivado",
      notes: "Espaço para anexos, retificações, respostas e documentos de apoio.",
    },
  ];
}

export async function listEditalAttachments(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildEditalAttachments(project);
}
