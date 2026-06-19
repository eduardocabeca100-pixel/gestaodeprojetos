import { AlertTriangle, ReceiptText, Wallet } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { formatCurrency } from "@/lib/utils/format-currency";

export function FinancialSummary({
  approved,
  executed,
  remaining,
  expenseCount,
}: {
  approved: number;
  executed: number;
  remaining: number;
  expenseCount: number;
}) {
  const cards = [
    { label: "Aprovado", value: formatCurrency(approved), icon: Wallet, tone: "text-primary bg-primary/10" },
    { label: "Executado", value: formatCurrency(executed), icon: ReceiptText, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Saldo", value: formatCurrency(remaining), icon: AlertTriangle, tone: "text-amber-700 bg-amber-50" },
    { label: "Despesas", value: String(expenseCount), icon: ReceiptText, tone: "text-cyan-700 bg-cyan-50" },
  ];

  return (
    <SectionCard>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border border-border bg-white p-4">
              <div className={`mb-3 flex size-9 items-center justify-center rounded-lg ${card.tone}`}>
                <Icon className="size-4" />
              </div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-semibold">{card.value}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
