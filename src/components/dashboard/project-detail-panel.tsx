import type { ReactNode } from "react";

import { ProjectPoster } from "@/components/projects/project-poster";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import type { Project } from "@/modules/projects/types";

export function ProjectDetailPanel({ project }: { project: Project }) {
  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(246,248,255,0.96))] p-5 soft-shadow">
      <div className="grid gap-5 xl:grid-cols-[152px_minmax(0,1fr)_220px]">
        <ProjectPoster
          projectId={project.id}
          title={project.name}
          imageUrl={project.coverUrl ?? project.bannerUrl}
          className="h-52 rounded-[1.4rem]"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge className="rounded-full px-3" value={project.status} />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Projeto ativo
            </p>
          </div>
          <h2 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.1] text-slate-950">
            {project.fullTitle}
          </h2>
          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
            <Info label="Edital" value={project.edital} />
            <Info label="Inscrição" value={project.registrationNumber} />
            <Info label="Início previsto" value={formatDate(project.startDate)} />
            <Info label="Término previsto" value={formatDate(project.endDate)} />
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,253,244,0.9))] p-4">
          <p className="text-sm font-medium text-muted-foreground">Valor aprovado</p>
          <p className="mt-2 text-[2rem] font-semibold leading-none text-emerald-600">
            {formatCurrency(project.approvedAmount)}
          </p>
          <div className="mt-3">
            <StatusBadge className="rounded-full px-3" value={project.status} />
          </div>
          <div className="mt-5 grid gap-3">
            <InfoCard label="Duração" value="12 meses" />
            <InfoCard label="Modalidade" value={project.modality} />
            <InfoCard label="Classe" value={project.className} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/80 bg-white/85 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
