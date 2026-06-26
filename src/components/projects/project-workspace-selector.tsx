"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban, ShieldCheck } from "lucide-react";

import { ProjectPoster } from "@/components/projects/project-poster";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { setActiveProjectScope } from "@/lib/project-scope";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { Project } from "@/modules/projects/types";

export function ProjectWorkspaceSelector({
  projects,
}: {
  projects: Project[];
}) {
  if (projects.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h3 className="text-xl font-black text-slate-950">Nenhum projeto disponível</h3>
        <p className="mt-2 text-sm text-slate-500">
          Seu usuário ainda não está vinculado a nenhum projeto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white bg-[linear-gradient(135deg,#070b1d,#101a3f)] p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
          Área de trabalho
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
          Qual projeto você vai trabalhar agora?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Ao escolher um projeto, todas as abas do sistema ficam presas nele:
          Dashboard, Documentos, Central Cultural, Financeiro, Equipe, Mídia e Cronograma.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {projects.map((project) => (
          <article
            key={project.id}
            className="group overflow-hidden rounded-[2rem] border border-white bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
              <ProjectPoster projectId={project.id} title={project.name} className="h-36" />

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  <StatusBadge value={project.status} />
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="size-3.5" />
                    Acesso liberado
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-950">{project.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {project.fullTitle}
                </p>
                <p className="mt-3 text-sm font-black text-primary">
                  {formatCurrency(project.approvedAmount)}
                </p>
              </div>
            </div>

            <Button asChild className="mt-5 h-12 w-full rounded-2xl">
              <Link
                href={`/dashboard?project=${project.id}`}
                onClick={() =>
                  setActiveProjectScope({
                    id: project.id,
                    name: project.name,
                    slug: project.slug,
                  })
                }
              >
                <FolderKanban className="size-4" />
                Trabalhar neste projeto
                <ArrowRight className="ml-auto size-4" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
