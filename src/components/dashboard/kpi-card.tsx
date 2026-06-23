import type { LucideIcon } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { cn } from "@/lib/utils";

const toneMap = {
  purple: {
    icon: "bg-violet-100 text-violet-700",
    accent: "from-violet-500 via-indigo-500 to-sky-400",
  },
  green: {
    icon: "bg-emerald-100 text-emerald-700",
    accent: "from-emerald-500 via-teal-500 to-cyan-400",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700",
    accent: "from-amber-400 via-orange-400 to-rose-400",
  },
  cyan: {
    icon: "bg-cyan-100 text-cyan-700",
    accent: "from-sky-500 via-cyan-500 to-emerald-400",
  },
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
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-[1.9rem] font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_20px_40px_-28px_rgba(37,99,235,0.48)]",
            toneMap[tone].icon,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full bg-gradient-to-r", toneMap[tone].accent)} />
      </div>
    </SectionCard>
  );
}
