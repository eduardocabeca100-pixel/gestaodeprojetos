import { CalendarClock } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/format-date";
import type { Activity } from "@/modules/schedule/types";

export function RecentActivities({ activities }: { activities: Activity[] }) {
  return (
    <SectionCard
      title="Aulas e cronograma"
      description="Próximos encontros e prazos reais cadastrados no projeto."
    >
      {activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-muted-foreground">
          Nenhum prazo ou aula cadastrada para este projeto ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-[1.1rem] border border-white/80 bg-white/86 p-3 shadow-[0_18px_36px_-32px_rgba(14,165,233,0.32)]"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <CalendarClock className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{activity.title}</p>
                  <StatusBadge value={activity.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activity.date ? formatDate(activity.date) : "Sem data"}
                  {activity.startTime || activity.endTime
                    ? ` · ${activity.startTime} às ${activity.endTime}`
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
