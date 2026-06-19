import { DiaryWorkspace } from "@/components/schedule/diary-workspace";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listActivities } from "@/modules/schedule/queries";
import { listParticipants } from "@/modules/participants/queries";
import { listTeamMembers } from "@/modules/team/queries";

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const [activities, participants] = await Promise.all([
    listActivities(project.id),
    listParticipants(project.id),
  ]);
  const teamMembers = await listTeamMembers(project.id);

  return (
    <PageContainer
      title="Diário de classe"
      description="Chamada por aula, presença dos participantes e geração de certificados com conteúdo programático."
    >
      <ProjectScopeBanner projectId={project.id} />
      <DiaryWorkspace
        project={project}
        activities={activities}
        participants={participants}
        teamMembers={teamMembers}
      />
    </PageContainer>
  );
}
