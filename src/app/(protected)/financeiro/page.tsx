import { BudgetItemForm } from "@/components/finance/budget-item-form";
import { BudgetTable } from "@/components/finance/budget-table";
import { ExpenseForm } from "@/components/finance/expense-form";
import { FinancialSummary } from "@/components/finance/financial-summary";
import { ReceiptUpload } from "@/components/finance/receipt-upload";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { getFinancialSummary, listBudgetItems } from "@/modules/finance/queries";

export default async function FinancePage() {
  const [summary, items] = await Promise.all([
    getFinancialSummary(),
    listBudgetItems(),
  ]);

  return (
    <PageContainer
      title="Financeiro"
      description="Rubricas, despesas, comprovantes e exportação financeira para prestação de contas."
    >
      <FinancialSummary {...summary} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
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
          <ReceiptUpload />
        </div>
      </div>
    </PageContainer>
  );
}
