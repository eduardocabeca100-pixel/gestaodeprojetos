import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { OfficialDocument } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildOfficialDocuments(project: Project): OfficialDocument[] {
  return [
    {
      id: `${project.id}-ofc-001`,
      projectId: project.id,
      template: "Ofício",
      title: `Solicitação de documentação - ${project.name}`,
      code: `OFC-${project.registrationNumber}/2026`,
      date: "2026-06-19",
      subject: `Documentação do projeto ${project.name}`,
      status: "Rascunho",
      recipient: "Setor responsável",
      recipientRole: "Comissão de análise",
      institution: project.edital,
      signerOne: "Marcel Eduardo Cabeça Domingues",
      signerOneRole: "Diretor geral",
      signerTwo: "Kaique",
      signerTwoRole: "Diretor executivo",
      content: `Solicitamos a conferência dos documentos anexados para continuidade do projeto ${project.name}.`,
    },
    {
      id: `${project.id}-aut-001`,
      projectId: project.id,
      template: "Autorização de Imagem",
      title: `Autorização de uso de imagem - ${project.name}`,
      code: `AUT-${project.registrationNumber}/2026`,
      date: "2026-06-19",
      subject: "Autorização para participantes",
      status: "Rascunho",
      recipient: "Participante do projeto",
      recipientRole: "Aluno/participante",
      institution: "Cia de Artes Viva",
      signerOne: "Participante",
      signerOneRole: "Autorizante",
      signerTwo: "Responsável legal",
      signerTwoRole: "Quando menor de idade",
      content:
        "Autorizo a utilização de imagem, voz e registro fotográfico para fins de divulgação, prestação de contas e memória institucional do projeto.",
    },
  ];
}

export async function listOfficialDocuments(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildOfficialDocuments(project);
}
