import { Camera, ClipboardList, MapPin } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/format-date";
import type { Activity } from "@/modules/schedule/types";

export function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
            {activity.type}
          </p>
          <h3 className="mt-1 font-semibold">{activity.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(activity.date)} · {activity.startTime} às {activity.endTime}
          </p>
        </div>
        <StatusBadge value={activity.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {activity.description}
      </p>
      <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5 text-cyan-600" />
          {activity.location}
        </span>
        <span className="flex items-center gap-1">
          <ClipboardList className="size-3.5 text-emerald-600" />
          {activity.attendanceCount} presenças
        </span>
        <span className="flex items-center gap-1">
          <Camera className="size-3.5 text-primary" />
          {activity.photoCount} fotos
        </span>
      </div>
    </article>
  );
}
