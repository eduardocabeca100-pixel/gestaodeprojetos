import { OfficialDocumentsWorkspace } from "@/components/official-documents/official-documents-workspace";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listOfficialDocuments } from "@/modules/official-documents/queries";

export default async function OfficialDocumentsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const documents = await listOfficialDocuments(project.id);

  return (
    <PageContainer
      title="Documentos Oficiais"
      description="Central para criar ofícios, autorizações, termos, atas, declarações, recibos e documentos institucionais."
    >
      <ProjectScopeBanner projectId={project.id} />
      <OfficialDocumentsWorkspace project={project} savedDocuments={documents} />
    </PageContainer>
  );
}
