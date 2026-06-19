import type { LucideIcon } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { cn } from "@/lib/utils";

const toneMap = {
  purple: "bg-primary/10 text-primary",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

export function KpiCard({
  label,
  value,
  helper,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  tone: keyof typeof toneMap;
  icon: LucideIcon;
}) {
  return (
    <SectionCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            toneMap[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </SectionCard>
  );
}
