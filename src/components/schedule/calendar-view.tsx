import type { Activity } from "@/modules/schedule/types";

export function CalendarView({ activities }: { activities: Activity[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {activities.slice(0, 8).map((activity) => (
        <div
          key={activity.id}
          className="rounded-lg border border-border bg-white p-3 text-sm"
        >
          <p className="font-semibold">{activity.date.slice(8, 10)}</p>
          <p className="mt-1 line-clamp-2 text-muted-foreground">{activity.title}</p>
        </div>
      ))}
    </div>
  );
}
