import { PageContainer } from "@/components/layout/page-container";
import { CulturalManagementSuite } from "@/components/management/cultural-management-suite";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";

export default async function CentralCulturalPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);

  return (
    <PageContainer
      title="Central Cultural"
      description="Gestão de execução, documentos, demonstrativos, prazos e acompanhamento do projeto ativo."
    >
      <div className="space-y-6">
        <ProjectScopeBanner project={project} />
        <CulturalManagementSuite key={project.id} />
      </div>
    </PageContainer>
  );
}
