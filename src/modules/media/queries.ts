import type { MediaItem } from "./types";

export const mediaItems: MediaItem[] = [
  {
    id: "media-1",
    title: "Acolhimento da turma",
    type: "Foto",
    projectId: "refens",
    activityId: "aula-1",
    registeredAt: "2026-08-05",
    location: "Cia de Artes Viva",
    description: "Registro inicial dos participantes.",
    url: "/globe.svg",
    category: "Aulas",
    selectedForDossier: true,
  },
  {
    id: "media-2",
    title: "Pasta externa de vídeos",
    type: "Link de pasta externa",
    projectId: "refens",
    activityId: null,
    registeredAt: "2026-08-07",
    location: "Google Drive",
    description: "Pasta com vídeos não listados e registros completos.",
    url: "https://drive.google.com/",
    category: "Registro fotográfico",
    selectedForDossier: true,
  },
  {
    id: "media-3",
    title: "Vídeo não listado - leitura do roteiro",
    type: "Link de vídeo",
    projectId: "refens",
    activityId: "aula-3",
    registeredAt: "2026-08-11",
    location: "YouTube",
    description: "Link externo cadastrado sem upload direto de vídeo.",
    url: "https://youtube.com/",
    category: "Aulas",
    selectedForDossier: false,
  },
];

export async function listMediaItems() {
  return mediaItems;
}
