import type { LucideIcon } from "lucide-react";

export function DocumentCategoryCard({
  title,
  count,
  icon: Icon,
  tone,
}: {
  title: string;
  count: number;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className={`mb-3 flex size-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{count}</p>
    </div>
  );
}
