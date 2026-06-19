import { BudgetItemForm } from "@/components/finance/budget-item-form";
import { BudgetTable } from "@/components/finance/budget-table";
import { ExpenseForm } from "@/components/finance/expense-form";
import { FinancialSummary } from "@/components/finance/financial-summary";
import { ReceiptUpload } from "@/components/finance/receipt-upload";
import { ReceiptGenerator } from "@/components/finance/receipt-generator";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getProjectId, type PageSearchParams } from "@/lib/utils/search-params";
import { getFinancialSummary, listBudgetItems } from "@/modules/finance/queries";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const projectId = await getProjectId(searchParams);
  const [summary, items] = await Promise.all([
    getFinancialSummary(),
    listBudgetItems(),
  ]);

  return (
    <PageContainer
      title="Financeiro"
      description="Rubricas, despesas, comprovantes e exportação financeira para prestação de contas."
    >
      <ProjectScopeBanner projectId={projectId} />
      <FinancialSummary {...summary} />
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <SectionCard title="Rubricas" description="Saldo por categoria e valores executados.">
          <BudgetTable items={items} />
        </SectionCard>
        <div className="space-y-4">
          <SectionCard title="Nova despesa">
            <ExpenseForm />
          </SectionCard>
          <SectionCard title="Nova rubrica">
            <BudgetItemForm />
          </SectionCard>
          <ReceiptGenerator />
          <ReceiptUpload />
        </div>
      </div>
    </PageContainer>
  );
}
