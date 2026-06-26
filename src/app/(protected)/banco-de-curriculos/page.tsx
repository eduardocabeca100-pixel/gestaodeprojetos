import { PageContainer } from "@/components/layout/page-container";
import { ResumeBankWorkspace } from "@/components/resumes/resume-bank-workspace";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listFinanceTeamMembers } from "@/modules/team/finance-queries";

export default async function ResumeBankPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const teamMembers = await listFinanceTeamMembers(project.id);

  return (
    <PageContainer
      title="Banco de Currículos"
      description="Profissionais do projeto, modelos por edital e geração de currículos em PDF ou Word."
    >
      <ResumeBankWorkspace
        project={{ id: project.id, name: project.name }}
        initialTeamMembers={teamMembers}
      />
    </PageContainer>
  );
}
