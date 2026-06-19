import { CalendarClock } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/format-date";
import type { Activity } from "@/modules/schedule/types";

export function RecentActivities({ activities }: { activities: Activity[] }) {
  return (
    <SectionCard
      title="Aulas e cronograma"
      description="Próximos encontros e prazos do projeto Reféns."
    >
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-white p-3"
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
                {formatDate(activity.date)} · {activity.startTime} às {activity.endTime}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
