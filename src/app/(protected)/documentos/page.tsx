import { ProjectDocumentsVault } from "@/components/management/project-documents-vault";
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
      title="Documentos do projeto"
      description="Cofre único para documentos, anexos, edital, certidões, comprovantes, proposta e arquivos de apoio."
    >
      <ProjectScopeBanner project={project} />
      <ProjectDocumentsVault
        project={{ id: project.id, name: project.name }}
        documents={documents}
      />
    </PageContainer>
  );
}
