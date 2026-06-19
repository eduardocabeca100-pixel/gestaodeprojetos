import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";

import { ProjectPoster } from "@/components/projects/project-poster";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { Project } from "@/modules/projects/types";

const workspaceTabs = [
  "Visão Geral",
  "Documentos",
  "Documentos Oficiais",
  "Cronograma",
  "Financeiro",
  "Equipe",
  "Participantes",
  "Mídia",
  "Relatórios",
];

export function ProjectWorkspaceSelector({
  projects,
}: {
  projects: Project[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {projects.map((project) => (
        <article
          key={project.id}
          className="rounded-lg border border-border bg-white p-4 soft-shadow"
        >
          <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
            <ProjectPoster projectId={project.id} title={project.name} className="h-32" />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2">
                <StatusBadge value={project.status} />
              </div>
              <h3 className="font-semibold">{project.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {project.fullTitle}
              </p>
              <p className="mt-2 text-sm font-semibold">
                {formatCurrency(project.approvedAmount)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {workspaceTabs.slice(0, 5).map((tab) => (
              <span
                key={tab}
                className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                {tab}
              </span>
            ))}
          </div>
          <Button asChild className="mt-4 w-full">
            <Link href={`/projetos/${project.id}`}>
              <FolderKanban className="size-4" />
              Trabalhar neste projeto
              <ArrowRight className="ml-auto size-4" />
            </Link>
          </Button>
        </article>
      ))}
    </div>
  );
}
