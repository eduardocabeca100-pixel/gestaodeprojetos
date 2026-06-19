import { EditalWorkspace } from "@/components/edital/edital-workspace";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listEditalAttachments } from "@/modules/edital/queries";

export default async function EditalPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const attachments = await listEditalAttachments(project.id);

  return (
    <PageContainer
      title="Edital e anexos"
      description="Repositório próprio para o edital principal, anexos, retificações, ofícios, respostas e documentos de apoio do projeto."
    >
      <ProjectScopeBanner projectId={project.id} />
      <EditalWorkspace project={project} attachments={attachments} />
    </PageContainer>
  );
}
