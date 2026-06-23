import { CheckCircle2, Circle, MousePointerClick } from "lucide-react";

import { updateProjectStage } from "@/modules/projects/stage-actions";
import type { ProjectStage } from "@/modules/projects/types";

const stages: ProjectStage[] = [
  "Avaliação",
  "Habilitação",
  "Assinatura do termo",
  "Repasse",
  "Execução",
  "Prestação de contas",
];

const stageHints: Record<ProjectStage, string> = {
  Avaliação: "Projeto em análise ou já avaliado.",
  Habilitação: "Documentação, anexos e conferências.",
  "Assinatura do termo": "Aguardando termo/contrato.",
  Repasse: "Aguardando liberação financeira.",
  Execução: "Projeto em execução.",
  "Prestação de contas": "Fechamento e prestação final.",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function currentStageIndex(current: string) {
  const normalizedCurrent = normalize(current);

  const index = stages.findIndex((stage) => {
    const normalizedStage = normalize(stage);
    const firstWord = normalizedStage.split(" ")[0];

    return (
      normalizedCurrent.includes(normalizedStage) ||
      normalizedCurrent.includes(firstWord)
    );
  });

  return index === -1 ? 0 : index;
}

export function ProjectStatusTimeline({
  projectId,
  current,
}: {
  projectId: string;
  current: string;
}) {
  const currentIndex = currentStageIndex(current);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
        <div className="flex items-start gap-2">
          <MousePointerClick className="mt-0.5 size-4 shrink-0" />
          <p>
            Clique em uma etapa abaixo para atualizar o andamento do projeto.
            A alteração é salva no Supabase e reflete no dashboard.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {stages.map((stage, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;
          const Icon = complete || active ? CheckCircle2 : Circle;

          return (
            <form key={stage} action={updateProjectStage}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="stage" value={stage} />

              <button
                type="submit"
                className={
                  active
                    ? "h-full w-full rounded-lg border border-primary/40 bg-primary/10 p-3 text-left text-sm text-primary shadow-[0_20px_50px_-35px_rgba(37,99,235,0.8)] transition hover:-translate-y-0.5 hover:border-primary"
                    : complete
                      ? "h-full w-full rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-left text-sm text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-400"
                      : "h-full w-full rounded-lg border border-border bg-white p-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                }
              >
                <Icon
                  className={
                    active
                      ? "mb-2 size-4 text-primary"
                      : complete
                        ? "mb-2 size-4 text-emerald-600"
                        : "mb-2 size-4 text-muted-foreground"
                  }
                />

                <p className="font-semibold">{stage}</p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {stageHints[stage]}
                </p>

                {active ? (
                  <p className="mt-2 text-xs font-semibold text-primary">
                    Etapa atual
                  </p>
                ) : null}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
