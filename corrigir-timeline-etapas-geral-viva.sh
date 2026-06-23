#!/usr/bin/env bash
set -euo pipefail

echo "===================================================="
echo " Corrigindo timeline clicável + check geral VIVA"
echo "===================================================="

if [ ! -f package.json ]; then
  echo "ERRO: rode este script na raiz do projeto, onde está o package.json."
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".backup-timeline-etapas-$TS"
mkdir -p "$BACKUP_DIR"

echo "Criando backup dos arquivos alterados..."

for file in \
  src/modules/projects/stage-actions.ts \
  src/components/projects/project-status-timeline.tsx \
  src/components/dashboard/project-stages-panel.tsx \
  "src/app/(protected)/dashboard/page.tsx" \
  "src/app/(protected)/projetos/[id]/page.tsx"
do
  [ -f "$file" ] && cp "$file" "$BACKUP_DIR/$(basename "$file").backup"
done

mkdir -p src/modules/projects
mkdir -p src/components/projects
mkdir -p src/components/dashboard

echo "Criando action para salvar etapa no Supabase..."

cat > src/modules/projects/stage-actions.ts <<'TSEOF'
"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/permissions";
import { getCurrentProfile } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStage, ProjectStatus } from "@/modules/projects/types";

const allowedStages: ProjectStage[] = [
  "Avaliação",
  "Habilitação",
  "Assinatura do termo",
  "Repasse",
  "Execução",
  "Prestação de contas",
];

const stageToStatus: Record<ProjectStage, ProjectStatus> = {
  Avaliação: "Em avaliação",
  Habilitação: "Em habilitação",
  "Assinatura do termo": "Aguardando termo",
  Repasse: "Aguardando repasse",
  Execução: "Em execução",
  "Prestação de contas": "Prestação de contas",
};

export type UpdateProjectStageState = {
  ok: boolean;
  message: string;
};

export async function updateProjectStage(
  formData: FormData,
): Promise<UpdateProjectStageState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const rawStage = String(formData.get("stage") ?? "").trim();
  const stage = allowedStages.find((item) => item === rawStage);

  if (!projectId) {
    return { ok: false, message: "Projeto inválido." };
  }

  if (!stage) {
    return { ok: false, message: "Etapa inválida." };
  }

  const profile = await getCurrentProfile();

  if (!profile || !can(profile.role, "edit_project")) {
    return {
      ok: false,
      message: "Você não tem permissão para alterar a etapa do projeto.",
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { ok: false, message: "Supabase não configurado." };
  }

  const result = await supabase
    .from("projects")
    .update({
      current_stage: stage,
      status: stageToStatus[stage],
    } as never)
    .eq("id", projectId)
    .select("id, slug")
    .single();

  if (result.error) {
    return { ok: false, message: result.error.message };
  }

  const savedProject = result.data as { id: string; slug?: string | null };

  revalidatePath("/dashboard", "page");
  revalidatePath("/projetos", "page");
  revalidatePath(`/projetos/${savedProject.id}`, "page");

  if (savedProject.slug) {
    revalidatePath(`/projetos/${savedProject.slug}`, "page");
  }

  return { ok: true, message: `Etapa atualizada para ${stage}.` };
}
TSEOF

echo "Transformando timeline da página do projeto em botões clicáveis..."

cat > src/components/projects/project-status-timeline.tsx <<'TSEOF'
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
TSEOF

echo "Transformando timeline do dashboard em botões clicáveis..."

cat > src/components/dashboard/project-stages-panel.tsx <<'TSEOF'
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
TSEOF

echo "Ajustando chamadas nas páginas..."

python3 - <<'PY'
from pathlib import Path
import re

dashboard = Path("src/app/(protected)/dashboard/page.tsx")
if dashboard.exists():
    text = dashboard.read_text()

    text = re.sub(
        r"<ProjectStagesPanel\s*/>",
        "<ProjectStagesPanel projectId={featured.id} current={featured.currentStage} />",
        text,
    )

    text = re.sub(
        r"<ProjectStagesPanel\s+projectId=\{featured\.id\}\s*/>",
        "<ProjectStagesPanel projectId={featured.id} current={featured.currentStage} />",
        text,
    )

    text = re.sub(
        r"<ProjectStagesPanel\s+projectId=\{featured\.id\}\s+current=\{featured\.currentStage\}\s*/>",
        "<ProjectStagesPanel projectId={featured.id} current={featured.currentStage} />",
        text,
    )

    dashboard.write_text(text)

detail = Path("src/app/(protected)/projetos/[id]/page.tsx")
if detail.exists():
    text = detail.read_text()

    text = re.sub(
        r"<ProjectStatusTimeline\s+current=\{project\.currentStage\}\s*/>",
        "<ProjectStatusTimeline projectId={project.id} current={project.currentStage} />",
        text,
    )

    text = re.sub(
        r"<ProjectStatusTimeline\s+projectId=\{project\.id\}\s+current=\{project\.currentStage\}\s*/>",
        "<ProjectStatusTimeline projectId={project.id} current={project.currentStage} />",
        text,
    )

    detail.write_text(text)
PY

echo "Protegendo .env..."

touch .gitignore

grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF ".env.*.local" .gitignore || echo ".env.*.local" >> .gitignore
grep -qxF "!.env.example" .gitignore || echo "!.env.example" >> .gitignore

git rm --cached .env .env.local 2>/dev/null || true

echo "Check rápido de arquivos importantes..."

mkdir -p artifacts

cat > artifacts/check-timeline-etapas-$TS.txt <<REPORT
CHECK TIMELINE ETAPAS - $TS

Arquivos corrigidos:
- src/modules/projects/stage-actions.ts
- src/components/projects/project-status-timeline.tsx
- src/components/dashboard/project-stages-panel.tsx
- src/app/(protected)/dashboard/page.tsx
- src/app/(protected)/projetos/[id]/page.tsx

O que foi ajustado:
- Timeline da página do projeto agora é clicável.
- Timeline do dashboard agora é clicável.
- Clique em etapa atualiza current_stage e status no Supabase.
- Botão Editar projeto leva para /projetos/[id]#editar-projeto.
REPORT

echo "Rodando build..."

npm run build

echo ""
echo "Correção finalizada."
echo ""
echo "Teste agora:"
echo "1. Abra o projeto Reféns."
echo "2. Clique em Execução na Timeline de etapas."
echo "3. Volte ao dashboard e confira se mudou."
echo "4. Clique em Editar projeto para abrir a área de edição."
