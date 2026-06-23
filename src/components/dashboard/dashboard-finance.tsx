import { FinancePieChart } from "@/components/dashboard/finance-pie-chart";
import { SectionCard } from "@/components/layout/section-card";
import { formatCurrency } from "@/lib/utils/format-currency";

export function DashboardFinance({
  approved,
  executed,
  remaining,
}: {
  approved: number;
  executed: number;
  remaining: number;
}) {
  const data = [
    { name: "Executado", value: executed, color: "#7c3aed" },
    { name: "Saldo", value: remaining, color: "#14b8a6" },
  ];

  return (
    <SectionCard
      title="Financeiro"
      description="Execução das rubricas aprovadas."
    >
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="flex h-40 min-h-40 min-w-0 items-center justify-center">
          <FinancePieChart data={data} />
        </div>
        <div className="space-y-3 self-center">
          <Metric label="Aprovado" value={formatCurrency(approved)} />
          <Metric label="Executado" value={formatCurrency(executed)} />
          <Metric label="Saldo" value={formatCurrency(remaining)} />
        </div>
      </div>
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[1rem] border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-[0_18px_36px_-30px_rgba(16,185,129,0.35)]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}
