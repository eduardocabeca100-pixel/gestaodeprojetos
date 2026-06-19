import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { Project } from "@/modules/projects/types";

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white soft-shadow">
      <div
        className="h-40 bg-cover bg-center"
        style={
          project.coverUrl
            ? { backgroundImage: `url(${project.coverUrl})` }
            : { backgroundImage: "linear-gradient(135deg,#1d1930,#7c3aed 52%,#16a34a)" }
        }
      />
      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge value={project.status} />
              <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                Inscrição {project.registrationNumber}
              </span>
            </div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              {project.fullTitle}
            </p>
            <p className="mt-2 text-sm font-medium text-primary">{project.edital}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-border px-3 py-2 text-right">
              <p className="text-xs text-muted-foreground">Valor aprovado</p>
              <p className="text-sm font-semibold">
                {formatCurrency(project.approvedAmount)}
              </p>
            </div>
            <Button variant="outline" size="icon" aria-label="Ações do projeto">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
