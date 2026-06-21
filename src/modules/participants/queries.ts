import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";

import type { Participant } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

export async function listParticipants(projectId?: string) {
  await getScopedProject(projectId);

  return [] as Participant[];
}
