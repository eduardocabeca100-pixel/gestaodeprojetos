import { cn } from "@/lib/utils";

const posterStyles: Record<string, string> = {
  refens: "from-black via-red-950 to-orange-900",
  "noiva-amor-tempo": "from-stone-900 via-stone-700 to-zinc-300",
  "prazer-laodiceia": "from-black via-red-950 to-slate-900",
};

export function ProjectPoster({
  projectId,
  title,
  className,
}: {
  projectId: string;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-gradient-to-b text-white shadow-sm",
        posterStyles[projectId] ?? "from-slate-900 via-primary to-cyan-800",
        className,
      )}
    >
      <div className="absolute inset-x-3 bottom-3 z-10">
        <p className="text-lg font-black uppercase leading-none tracking-normal">
          {title}
        </p>
      </div>
      <div className="absolute bottom-0 left-1/2 h-16 w-9 -translate-x-1/2 rounded-t-full bg-black/70" />
      <div className="absolute bottom-0 left-1/2 h-20 w-px -translate-x-1/2 bg-amber-200/60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_76%,rgba(251,191,36,0.42),transparent_30%)]" />
    </div>
  );
}
