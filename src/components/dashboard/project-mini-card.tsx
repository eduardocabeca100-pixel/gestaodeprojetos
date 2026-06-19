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
          ? "grid gap-4 rounded-lg border border-primary bg-white p-4 soft-shadow sm:grid-cols-[92px_1fr]"
          : "grid gap-4 rounded-lg border border-border bg-white p-4 soft-shadow sm:grid-cols-[82px_1fr]"
      }
    >
      <ProjectPoster
        projectId={project.id}
        title={project.name}
        className={highlighted ? "h-36" : "h-28"}
      />
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge value={project.status} />
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
