import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { ProjectPoster } from "@/components/projects/project-poster";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import type { Project } from "@/modules/projects/types";

const stages = [
  ["1", "Avaliação", "Concluída"],
  ["2", "Habilitação", "Em andamento"],
  ["3", "Assinatura", "Pendente"],
  ["4", "Repasse", "Pendente"],
  ["5", "Execução", "Pendente"],
  ["6", "Prest. Contas", "Pendente"],
];

export function ProjectDetailPanel({ project }: { project: Project }) {
  return (
    <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="mb-5 flex items-center gap-2 text-sm text-primary">
        <ArrowLeft className="size-4" />
        <Link href="/projetos">Projetos</Link>
        <ChevronRight className="size-4 text-muted-foreground" />
        <span className="text-foreground">{project.name}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-[100px_1fr_auto]">
        <ProjectPoster projectId={project.id} title={project.name} className="h-36" />
        <div>
          <h2 className="text-xl font-semibold">{project.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{project.fullTitle}</p>
          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
            <Info label="Edital" value={project.edital} />
            <Info label="Inscrição" value={project.registrationNumber} />
            <Info label="Valor aprovado" value={formatCurrency(project.approvedAmount)} />
            <Info label="Status" value={<StatusBadge value={project.status} />} />
          </div>
        </div>
        <Button asChild>
          <Link href={`/documentos?project=${project.id}`}>Abrir abas</Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-2 md:grid-cols-6">
        {stages.map(([number, title, status]) => (
          <div key={number} className="text-center text-xs">
            <div
              className={
                number === "1"
                  ? "mx-auto mb-2 flex size-7 items-center justify-center rounded-full bg-emerald-500 font-semibold text-white"
                  : number === "2"
                    ? "mx-auto mb-2 flex size-7 items-center justify-center rounded-full bg-primary font-semibold text-white"
                    : "mx-auto mb-2 flex size-7 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground"
              }
            >
              {number}
            </div>
            <p className="font-medium">{title}</p>
            <p className={number === "2" ? "text-primary" : "text-muted-foreground"}>
              {status}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        <InfoCard label="Início previsto" value={formatDate(project.startDate)} />
        <InfoCard label="Término previsto" value={formatDate(project.endDate)} />
        <InfoCard label="Duração" value="12 meses" />
        <InfoCard label="Modalidade" value={project.modality} />
        <InfoCard label="Classe" value={project.className} />
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
