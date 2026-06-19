import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { MediaItem } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildMediaItems(project: Project): MediaItem[] {
  return [
    {
      id: `${project.id}-media-1`,
      title: `Registro inicial - ${project.name}`,
      type: "Foto",
      projectId: project.id,
      activityId: `${project.id}-atividade-1`,
      registeredAt: project.id === "prazer-laodiceia" ? "2026-09-10" : "2026-08-05",
      location: "Cia de Artes Viva",
      description: "Registro inicial das atividades do projeto.",
      url: "/globe.svg",
      category: "Aulas",
      selectedForDossier: true,
    },
    {
      id: `${project.id}-media-2`,
      title: `Pasta externa - ${project.name}`,
      type: "Link de pasta externa",
      projectId: project.id,
      activityId: null,
      registeredAt: "2026-08-07",
      location: "Google Drive",
      description: "Pasta com vídeos não listados e registros completos.",
      url: "https://drive.google.com/",
      category: "Registro fotográfico",
      selectedForDossier: true,
    },
    {
      id: `${project.id}-media-3`,
      title: `Vídeo não listado - ${project.name}`,
      type: "Link de vídeo",
      projectId: project.id,
      activityId: `${project.id}-atividade-2`,
      registeredAt: "2026-08-11",
      location: "YouTube",
      description: "Link externo cadastrado sem upload direto de vídeo.",
      url: "https://youtube.com/",
      category: "Aulas",
      selectedForDossier: false,
    },
  ];
}

export async function listMediaItems(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildMediaItems(project);
}
