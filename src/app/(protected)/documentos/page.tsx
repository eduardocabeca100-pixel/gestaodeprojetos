import { DocumentsWorkspace } from "@/components/documents/documents-workspace";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listDocuments } from "@/modules/documents/queries";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const documents = await listDocuments(project.id);

  return (
    <PageContainer
      title="Documentos"
      description="Upload, visualização, validade, substituição e arquivamento de documentos vinculados a projetos."
    >
      <ProjectScopeBanner projectId={project.id} />
      <DocumentsWorkspace project={project} documents={documents} />
    </PageContainer>
  );
}
