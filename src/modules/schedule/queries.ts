import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { Activity } from "./types";

const projectLessons: Record<string, string[]> = {
  refens: [
    "Acolhimento e integração",
    "História do teatro e linguagens cênicas",
    "Leitura do roteiro Reféns",
    "Corpo, expressão e presença",
    "Voz, respiração e projeção",
    "Improvisação e jogo teatral",
    "Montagem das primeiras cenas",
    "Cenas centrais e ritmo",
    "Final, coro e cenas coletivas",
    "Ensaio corrido e ajustes de direção",
    "Ensaio geral pedagógico e fechamento",
  ],
  "noiva-amor-tempo": [
    "Reunião de produção e agenda",
    "Revisão dramatúrgica",
    "Ensaio de marcação",
    "Ensaio técnico de luz e som",
    "Ação de mediação cultural",
    "Apresentação 1",
    "Apresentação 2",
    "Registro fotográfico e depoimentos",
  ],
  "prazer-laodiceia": [
    "Pesquisa de referências",
    "Leitura de mesa",
    "Laboratório corporal",
    "Criação de cenas",
    "Reunião de orçamento",
    "Planejamento de produção",
  ],
};

const projectStartDates: Record<string, string[]> = {
  refens: [
    "2026-08-05",
    "2026-08-08",
    "2026-08-11",
    "2026-08-14",
    "2026-08-17",
    "2026-08-20",
    "2026-08-23",
    "2026-08-26",
    "2026-08-29",
    "2026-09-01",
    "2026-09-04",
  ],
  "noiva-amor-tempo": [
    "2026-06-24",
    "2026-07-01",
    "2026-07-08",
    "2026-07-15",
    "2026-07-22",
    "2026-08-03",
    "2026-08-10",
    "2026-08-18",
  ],
  "prazer-laodiceia": [
    "2026-09-10",
    "2026-09-17",
    "2026-09-24",
    "2026-10-01",
    "2026-10-08",
    "2026-10-15",
  ],
};

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildActivities(project: Project): Activity[] {
  const titles = projectLessons[project.id] ?? projectLessons.refens;
  const dates = projectStartDates[project.id] ?? projectStartDates.refens;

  return titles.map((title, index) => ({
    id: `${project.id}-atividade-${index + 1}`,
    projectId: project.id,
    title,
    type:
      title.includes("Apresentação") || title.includes("Ensaio")
        ? title.includes("Apresentação")
          ? "Apresentação"
          : "Ensaio"
        : "Aula",
    date: dates[index] ?? project.startDate,
    startTime: "19:00",
    endTime: "22:00",
    location: "Cia de Artes Viva",
    responsible: "Direção executiva",
    description: `Atividade ${index + 1} vinculada ao projeto ${project.name}.`,
    status: index < 2 && project.executedAmount > 0 ? "Realizada" : "Agendada",
    attendanceCount: index < 2 && project.executedAmount > 0 ? 18 : 0,
    photoCount: index < 2 && project.executedAmount > 0 ? 12 : 0,
    documentCount: index < 2 && project.executedAmount > 0 ? 1 : 0,
    notes: "Editar data, horário, local, conteúdo e presença quando a atividade for confirmada.",
    lesson: {
      number: index + 1,
      theme: title,
      objective: "Desenvolver repertório técnico e criativo vinculado ao projeto.",
      content: "Conteúdo programático a ser ajustado pela direção executiva.",
      practice: "Prática artística, ensaio, mediação ou registro conforme a atividade.",
      expectedResult: "Registro completo para relatório e prestação de contas.",
      teacher: "Profissional responsável",
      pedagogicalNotes: "Campo livre para observações pedagógicas.",
    },
  }));
}

export async function listActivities(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildActivities(project);
}

export async function listUpcomingActivities(projectId?: string) {
  const activities = await listActivities(projectId);

  return activities.filter((activity) => activity.status === "Agendada").slice(0, 4);
}
