import Link from "next/link";
import {
  Check,
  ChevronDown,
  MousePointerClick,
  PenLine,
} from "lucide-react";

import { updateProjectStage } from "@/modules/projects/stage-actions";
import type { ProjectStage } from "@/modules/projects/types";

const stages: Array<[ProjectStage, string, string]> = [
  ["Avaliação", "1", "Avaliação"],
  ["Habilitação", "2", "Habilitação"],
  ["Assinatura do termo", "3", "Assinatura"],
  ["Repasse", "4", "Repasse"],
  ["Execução", "5", "Execução"],
  ["Prestação de contas", "6", "Prest. Contas"],
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function currentStageIndex(current: string) {
  const normalizedCurrent = normalize(current);

  const index = stages.findIndex(([stage]) => {
    const normalizedStage = normalize(stage);
    const firstWord = normalizedStage.split(" ")[0];

    return (
      normalizedCurrent.includes(normalizedStage) ||
      normalizedCurrent.includes(firstWord)
    );
  });

  return index === -1 ? 0 : index;
}

export function ProjectStagesPanel({
  projectId,
  current,
}: {
  projectId: string;
  current: string;
}) {
  const currentIndex = currentStageIndex(current);

  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(246,248,255,0.96))] p-5 soft-shadow">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.28em] text-primary/70">
            Etapas do projeto
          </p>

          <h3 className="mt-2 text-[1.3rem] font-semibold text-slate-950">
            Linha de acompanhamento
          </h3>

          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <MousePointerClick className="size-3.5" />
            Clique em uma etapa para atualizar.
          </p>
        </div>

        <Link
          href={`/projetos/${projectId}#editar-projeto`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl border border-white/80 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-muted"
        >
          <PenLine className="size-4" />
          Editar projeto
          <ChevronDown className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        {stages.map(([stage, number, title], index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const status = done
            ? "Concluída"
            : active
              ? "Em andamento"
              : "Pendente";

          return (
            <form
              key={stage}
              action={updateProjectStage}
              className="relative text-center text-xs"
            >
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="stage" value={stage} />

              {index < stages.length - 1 ? (
                <div className="absolute left-1/2 top-4 hidden h-px w-full translate-x-1/2 bg-slate-200 md:block" />
              ) : null}

              <button
                type="submit"
                className="group relative z-10 w-full rounded-2xl p-1 transition hover:-translate-y-0.5"
              >
                <div
                  className={
                    done
                      ? "mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_14px_30px_-20px_rgba(16,185,129,0.9)]"
                      : active
                        ? "mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f46e5,#2563eb)] text-white shadow-[0_14px_30px_-20px_rgba(79,70,229,0.9)]"
                        : "mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
                  }
                >
                  {done ? <Check className="size-4" /> : number}
                </div>

                <p className="font-semibold text-slate-950">{title}</p>

                <p
                  className={
                    active
                      ? "mt-1 text-primary"
                      : "mt-1 text-muted-foreground"
                  }
                >
                  {status}
                </p>
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
