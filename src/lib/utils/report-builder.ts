import type { Project } from "@/modules/projects/types";
import type { Activity } from "@/modules/schedule/types";

export type DossierOptions = {
  includePhotos: boolean;
  includeDocuments: boolean;
  includeFinance: boolean;
  includeParticipants: boolean;
  includeExternalLinks: boolean;
};

export function buildDossierSummary(project: Project, activities: Activity[]) {
  return {
    title: `Dossiê completo - ${project.name}`,
    generatedAt: new Date().toISOString(),
    project,
    completedActivities: activities.filter(
      (activity) => activity.status === "Realizada",
    ).length,
    scheduledActivities: activities.length,
  };
}
