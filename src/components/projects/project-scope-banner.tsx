import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

export async function ProjectScopeBanner({
  project,
  projectId,
}: {
  project?: Project;
  projectId?: string;
}) {
  const resolvedProject =
    project ??
    (projectId
      ? await getProjectById(projectId)
      : await getFeaturedProject());

  if (!resolvedProject) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 rounded-[1.6rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,255,0.96))] p-4 soft-shadow sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-primary-foreground shadow-[0_18px_32px_-24px_rgba(79,70,229,0.7)]">
          <FolderKanban className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
            Projeto ativo
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{resolvedProject.name}</h2>
            <StatusBadge value={resolvedProject.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{resolvedProject.edital}</p>
        </div>
      </div>
      <Button asChild className="rounded-2xl" variant="outline">
        <Link href="/projetos/selecionar">Trocar projeto</Link>
      </Button>
    </section>
  );
}
