import { AdvancedManagementPanel } from "@/components/advanced-management/advanced-management-panel";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";

export default async function AdvancedManagementPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);

  return (
    <PageContainer
      title="Gestão"
      description="Central de pendências, tarefas, rubricas e relatório automático do projeto."
    >
      <div className="space-y-6">
        <ProjectScopeBanner project={project} />
        <AdvancedManagementPanel project={{ id: project.id, name: project.name }} />
      </div>
    </PageContainer>
  );
}
