import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import type { Project } from "@/modules/projects/types";

import { ProjectProgress } from "./project-progress";

export function ProjectCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  return (
    <article className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="mb-4 flex h-24 items-end overflow-hidden rounded-lg bg-[linear-gradient(135deg,#221d35,#7c3aed_55%,#0ea5a4)] p-4 text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">
            {project.registrationNumber}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-semibold">
            {project.name}
          </h3>
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{project.fullTitle}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {project.edital}
          </p>
        </div>
        <StatusBadge value={featured ? "Em habilitação" : project.status} />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4 text-primary" />
          {formatDate(project.startDate)} a {formatDate(project.endDate)}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-4 text-cyan-600" />
          {project.city}/{project.state}
        </div>
      </div>
      <div className="mt-4">
        <ProjectProgress
          approved={project.approvedAmount}
          executed={project.executedAmount}
        />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
        <span className="font-medium text-foreground">
          {formatCurrency(project.approvedAmount)}
        </span>
        <Link
          href={`/dashboard?project=${project.id}`}
          className="inline-flex items-center gap-1 font-medium text-primary"
        >
          Abrir
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
