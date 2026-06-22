import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { RefensTeamWorkspace } from "@/components/refens/refens-team-bootstrap";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";

export default async function ProjectTeamPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);

  return (
    <PageContainer
      title="Equipe do projeto"
      description="Selecione a equipe permanente e ajuste rubrica, valor e status por projeto."
    >
      <div className="space-y-6">
        <ProjectScopeBanner project={project} />
        <RefensTeamWorkspace
          initialTab="project"
          activeProject={{ id: project.id, name: project.name }}
        />
      </div>
    </PageContainer>
  );
}
