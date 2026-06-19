import { FileArchive } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { ReportGenerator } from "@/components/reports/report-generator";
import { ReportOptionsForm } from "@/components/reports/report-options-form";
import type { Project } from "@/modules/projects/types";
import type { Activity } from "@/modules/schedule/types";

export function DossierGenerator({
  project,
  activities,
}: {
  project: Project;
  activities: Activity[];
}) {
  return (
    <SectionCard
      title="Gerar dossiê completo"
      description="PDF com capa, projeto, cronograma, documentos, financeiro, participantes, mídia e links externos."
      actions={<ReportGenerator project={project} activities={activities} />}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
        <ReportOptionsForm />
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          <FileArchive className="mb-3 size-5 text-primary" />
          O dossiê gerado pode ser salvo no bucket reports e baixado para entrega.
        </div>
      </div>
    </SectionCard>
  );
}
