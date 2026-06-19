import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { ScheduleWorkspace } from "@/components/schedule/schedule-workspace";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listActivities } from "@/modules/schedule/queries";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const activities = await listActivities(project.id);

  return (
    <PageContainer
      title="Cronograma e aulas"
      description="Atividades, calendário, aulas, listas de presença, fotos e documentos vinculados."
    >
      <ProjectScopeBanner projectId={project.id} />
      <ScheduleWorkspace activities={activities} project={project} />
    </PageContainer>
  );
}
