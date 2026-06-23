import Link from "next/link";
import { Check, ChevronDown, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";

const stages = [
  ["1", "Avaliação", "Concluída"],
  ["2", "Habilitação", "Em andamento"],
  ["3", "Assinatura", "Pendente"],
  ["4", "Repasse", "Pendente"],
  ["5", "Execução", "Pendente"],
  ["6", "Prest. Contas", "Pendente"],
] as const;

export function ProjectStagesPanel({ projectId }: { projectId: string }) {
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
        </div>

        <Button asChild className="rounded-2xl border-white/80" variant="outline">
          <Link href={`/projetos/${projectId}#editar-projeto`}>
            <PenLine className="size-4" />
            Editar projeto
            <ChevronDown className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        {stages.map(([number, title, status], index) => {
          const done = number === "1";
          const current = number === "2";

          return (
            <div key={number} className="relative text-center text-xs">
              {index < stages.length - 1 ? (
                <div className="absolute left-1/2 top-4 hidden h-px w-full translate-x-1/2 bg-slate-200 md:block" />
              ) : null}

              <div
                className={
                  done
                    ? "relative z-10 mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_14px_30px_-20px_rgba(16,185,129,0.9)]"
                    : current
                      ? "relative z-10 mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f46e5,#2563eb)] text-white shadow-[0_14px_30px_-20px_rgba(79,70,229,0.9)]"
                      : "relative z-10 mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                }
              >
                {done ? <Check className="size-4" /> : number}
              </div>

              <p className="font-semibold text-slate-950">{title}</p>
              <p className={current ? "mt-1 text-primary" : "mt-1 text-muted-foreground"}>
                {status}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
