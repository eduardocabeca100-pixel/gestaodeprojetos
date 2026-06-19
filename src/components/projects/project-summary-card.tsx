import { CalendarDays, Landmark, Timer, Wallet } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import type { Project } from "@/modules/projects/types";

export function ProjectSummaryCard({ project }: { project: Project }) {
  const items = [
    { label: "Início previsto", value: formatDate(project.startDate), icon: CalendarDays },
    { label: "Término previsto", value: formatDate(project.endDate), icon: CalendarDays },
    { label: "Duração", value: "12 meses", icon: Timer },
    { label: "Modalidade", value: project.modality, icon: Landmark },
    { label: "Classe", value: project.className, icon: Landmark },
    { label: "Executado", value: formatCurrency(project.executedAmount), icon: Wallet },
  ];

  return (
    <SectionCard title="Resumo do projeto" description={project.currentStage}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg border border-border bg-white p-3">
              <Icon className="mb-2 size-4 text-primary" />
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-semibold">{item.value}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
