import { FinancialAccountabilityWorkspace } from "@/components/finance/financial-accountability-workspace";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listBudgetItems } from "@/modules/finance/queries";
import { listTeamMembers } from "@/modules/team/queries";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const [budgetItems, teamMembers] = await Promise.all([
    listBudgetItems(project.id),
    listTeamMembers(project.id),
  ]);

  return (
    <PageContainer
      title="Financeiro"
      description="Rubricas oficiais, despesas, favorecidos, anexos financeiros e conferência para prestação de contas."
    >
      <ProjectScopeBanner project={project} />

      <FinancialAccountabilityWorkspace
        project={{ id: project.id, name: project.name }}
        initialBudgetItems={budgetItems}
        teamMembers={teamMembers}
      />
    </PageContainer>
  );
}
