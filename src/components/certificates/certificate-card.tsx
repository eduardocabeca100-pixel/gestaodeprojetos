import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function CertificateCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "blue" | "violet" | "emerald" | "amber";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-[1.55rem] font-semibold leading-none">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        </div>
        <div className={cn("rounded-xl border p-2.5", toneClasses)}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
