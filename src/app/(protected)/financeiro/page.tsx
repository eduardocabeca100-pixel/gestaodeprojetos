import { FinancialAccountabilityWorkspace } from "@/components/finance/financial-accountability-workspace";
import { FinancialDocumentGenerator } from "@/components/finance/financial-document-generator";
import { PageContainer } from "@/components/layout/page-container";
import { AdministrativeDemonstratives } from "@/components/management/administrative-demonstratives";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listBudgetItems } from "@/modules/finance/queries";
import { listFinanceTeamMembers } from "@/modules/team/finance-queries";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const [budgetItems, teamMembers] = await Promise.all([
    listBudgetItems(project.id),
    listFinanceTeamMembers(project.id),
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

      <FinancialDocumentGenerator
        project={{ id: project.id, name: project.name }}
        teamMembers={teamMembers}
      />

      <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
            Demonstrativos
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Demonstrativos administrativos de pagamento
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Os demonstrativos foram movidos para o Financeiro para ficarem junto das rubricas, despesas e comprovantes.
          </p>
        </div>

        <AdministrativeDemonstratives />
      </section>
    </PageContainer>
  );
}
