import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { Participant } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildParticipants(project: Project): Participant[] {
  const prefix = project.name.split(" ")[0] ?? "Participante";

  return [
    {
      id: `${project.id}-part-1`,
      projectId: project.id,
      fullName: `${prefix} Participante 01`,
      document: "000.000.000-00",
      birthDate: "2001-04-12",
      phone: "(48) 98888-1001",
      email: "participante01@email.com",
      neighborhood: "Centro",
      address: "Rua das Artes, 100",
      guardianName: null,
      guardianPhone: null,
      imageAuthorization: true,
      participationAuthorization: true,
      pedagogicalNotes: `Boa presença corporal nas atividades de ${project.name}.`,
      status: "Ativo",
      attendanceRate: project.executedAmount > 0 ? 100 : 0,
    },
    {
      id: `${project.id}-part-2`,
      projectId: project.id,
      fullName: `${prefix} Participante 02`,
      document: "000.000.000-00",
      birthDate: "2007-09-20",
      phone: "(48) 98888-1002",
      email: "participante02@email.com",
      neighborhood: "Serraria",
      address: "Rua da Cultura, 230",
      guardianName: "Responsável legal",
      guardianPhone: "(48) 98888-2002",
      imageAuthorization: true,
      participationAuthorization: true,
      pedagogicalNotes: "Menor de idade; manter autorização do responsável anexada.",
      status: "Ativo",
      attendanceRate: project.executedAmount > 0 ? 90 : 0,
    },
    {
      id: `${project.id}-part-3`,
      projectId: project.id,
      fullName: `${prefix} Participante 03`,
      document: "",
      birthDate: "1998-02-03",
      phone: "(48) 98888-1003",
      email: "",
      neighborhood: "Campinas",
      address: "Avenida Viva, 45",
      guardianName: null,
      guardianPhone: null,
      imageAuthorization: false,
      participationAuthorization: true,
      pedagogicalNotes: "Pendente autorização de imagem.",
      status: project.executedAmount > 0 ? "Selecionado" : "Inscrito",
      attendanceRate: 0,
    },
  ];
}

export async function listParticipants(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildParticipants(project);
}
