import { BrainCircuit } from "lucide-react";

import { CerebroIaWorkspace } from "@/components/cerebro/cerebro-ia-workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function EscritaDeProjetosPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const projectId = first(params.project || params.projectId);

  return (
    <main className="w-full max-w-none space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
              CÉREBRO IA
            </p>

            <h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <BrainCircuit className="size-5" />
              </span>
              Escrita de Projetos
            </h1>

            <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-500">
              Ambiente para criar, escrever, revisar e estruturar projetos culturais antes de transformar o projeto aprovado em gestão completa dentro do VIVA.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            Sem iframe • Sem login interno
          </div>
        </div>
      </section>

      <CerebroIaWorkspace projectId={projectId} />
    </main>
  );
}
