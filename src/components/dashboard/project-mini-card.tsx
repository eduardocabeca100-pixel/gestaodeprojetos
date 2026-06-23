import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { ProjectPoster } from "@/components/projects/project-poster";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import type { Project } from "@/modules/projects/types";

import { ProjectProgress } from "./project-progress";

export function ProjectMiniCard({
  project,
  highlighted,
}: {
  project: Project;
  highlighted?: boolean;
}) {
  return (
    <Link
      href={`/dashboard?project=${project.id}`}
      className={
        highlighted
          ? "grid gap-4 rounded-[1.5rem] border border-primary/30 bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(243,247,255,0.98))] p-4 soft-shadow ring-1 ring-primary/12 sm:grid-cols-[96px_1fr]"
          : "grid gap-4 rounded-[1.5rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,255,0.96))] p-4 soft-shadow sm:grid-cols-[82px_1fr]"
      }
    >
      <ProjectPoster
        projectId={project.id}
        title={project.name}
        imageUrl={project.coverUrl ?? project.bannerUrl}
        className={highlighted ? "h-36" : "h-28"}
      />
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge className="rounded-full px-3" value={project.status} />
        </div>
        <h3 className="line-clamp-2 font-semibold">{project.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {project.fullTitle}
        </p>
        <p className="mt-3 text-sm font-medium">
          Valor: {formatCurrency(project.approvedAmount)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Etapa atual: {project.currentStage}
        </p>
        <div className="mt-3">
          <ProjectProgress
            approved={project.approvedAmount}
            executed={project.executedAmount}
          />
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Prazo final: {formatDate(project.endDate)}
        </p>
      </div>
    </Link>
  );
}
