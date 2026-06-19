import { CheckCircle2, Circle } from "lucide-react";

import type { ProjectStage } from "@/modules/projects/types";

const stages: ProjectStage[] = [
  "Avaliação",
  "Habilitação",
  "Assinatura do termo",
  "Repasse",
  "Execução",
  "Prestação de contas",
];

export function ProjectStatusTimeline({ current }: { current: string }) {
  const currentIndex = stages.findIndex((stage) => current.includes(stage));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {stages.map((stage, index) => {
        const complete = currentIndex === -1 ? index <= 1 : index <= currentIndex;
        const Icon = complete ? CheckCircle2 : Circle;

        return (
          <div
            key={stage}
            className="rounded-lg border border-border bg-white p-3 text-sm"
          >
            <Icon
              className={complete ? "mb-2 size-4 text-emerald-600" : "mb-2 size-4 text-muted-foreground"}
            />
            <p className="font-medium">{stage}</p>
          </div>
        );
      })}
    </div>
  );
}
