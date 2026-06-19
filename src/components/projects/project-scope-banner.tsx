import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";

export async function ProjectScopeBanner({
  projectId,
}: {
  projectId?: string;
}) {
  const project = projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : await getFeaturedProject();

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FolderKanban className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">
            Projeto ativo
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{project.name}</h2>
            <StatusBadge value={project.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{project.edital}</p>
        </div>
      </div>
      <Button asChild variant="outline">
        <Link href="/projetos/selecionar">Trocar projeto</Link>
      </Button>
    </section>
  );
}
