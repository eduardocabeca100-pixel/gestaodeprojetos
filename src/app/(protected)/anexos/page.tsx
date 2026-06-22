import { DocumentVault } from "@/components/documents/document-vault";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";

export default async function AttachmentsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);

  return (
    <PageContainer
      title="Anexos"
      description="Envie, categorize, consulte e baixe arquivos vinculados ao projeto."
    >
      <div className="space-y-6">
        <ProjectScopeBanner project={project} />
        <DocumentVault project={{ id: project.id, name: project.name }} />
      </div>
    </PageContainer>
  );
}
