"use client";

import { useMemo, useState, type ReactNode } from "react";
import { FileImage, RotateCcw, Save } from "lucide-react";

import { ProjectPoster } from "@/components/projects/project-poster";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { Project } from "@/modules/projects/types";

type Draft = {
  name: string;
  fullTitle: string;
  approvedAmount: number;
  executedAmount: number;
  startDate: string;
  endDate: string;
  currentStage: string;
  status: Project["status"];
  coverUrl: string | null;
  bannerUrl: string | null;
};

export function ProjectQuickEdit({ project }: { project: Project }) {
  const initial = useMemo<Draft>(
    () => ({
      name: project.name,
      fullTitle: project.fullTitle,
      approvedAmount: project.approvedAmount,
      executedAmount: project.executedAmount,
      startDate: project.startDate,
      endDate: project.endDate,
      currentStage: project.currentStage,
      status: project.status,
      coverUrl: project.coverUrl,
      bannerUrl: project.bannerUrl,
    }),
    [project],
  );
  const [draft, setDraft] = useState(initial);
  const [message, setMessage] = useState("Edição rápida pronta para este projeto.");

  function resetDraft() {
    setDraft(initial);
    setMessage("Campos restaurados para o valor atual do projeto.");
  }

  return (
    <div id="editar-projeto" className="mt-6 border-t border-border pt-6">
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-4">
          <ProjectPoster
            projectId={project.id}
            title={draft.name}
            imageUrl={draft.coverUrl ?? draft.bannerUrl}
            className="h-52"
          />
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Foto / capa
            </span>
            <input
              className="form-input mt-1"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setDraft((current) => ({
                  ...current,
                  coverUrl: URL.createObjectURL(file),
                }));
                setMessage("Imagem do projeto atualizada localmente.");
              }}
            />
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Edição rápida
            </p>
            <h3 className="mt-1 text-lg font-semibold">Ajustar dados do projeto</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Nome, valor, prazo e imagem do projeto ativo. As mudanças ficam prontas para
              persistência no Supabase.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome do projeto">
              <input
                className="form-input"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field label="Status">
              <select
                className="form-input"
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, status: event.target.value as Project["status"] }))
                }
              >
                <option>Planejamento</option>
                <option>Inscrito</option>
                <option>Em avaliação</option>
                <option>Classificado</option>
                <option>Em habilitação</option>
                <option>Aguardando termo</option>
                <option>Aguardando repasse</option>
                <option>Em execução</option>
                <option>Prestação de contas</option>
                <option>Finalizado</option>
                <option>Arquivado</option>
              </select>
            </Field>
            <Field label="Valor aprovado">
              <input
                className="form-input"
                type="number"
                value={draft.approvedAmount}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, approvedAmount: Number(event.target.value) }))
                }
              />
            </Field>
            <Field label="Valor executado">
              <input
                className="form-input"
                type="number"
                value={draft.executedAmount}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, executedAmount: Number(event.target.value) }))
                }
              />
            </Field>
            <Field label="Início">
              <input
                className="form-input"
                type="date"
                value={draft.startDate}
                onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))}
              />
            </Field>
            <Field label="Prazo final">
              <input
                className="form-input"
                type="date"
                value={draft.endDate}
                onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))}
              />
            </Field>
            <Field label="Etapa atual" wide>
              <input
                className="form-input"
                value={draft.currentStage}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, currentStage: event.target.value }))
                }
              />
            </Field>
            <Field label="Título completo" wide>
              <textarea
                className="form-input min-h-24"
                value={draft.fullTitle}
                onChange={(event) => setDraft((current) => ({ ...current, fullTitle: event.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-3 rounded-lg border border-border bg-muted/25 p-4 md:grid-cols-3">
            <Stat label="Aprovado" value={formatCurrency(draft.approvedAmount)} />
            <Stat label="Executado" value={formatCurrency(draft.executedAmount)} />
            <Stat
              label="Saldo"
              value={formatCurrency(Math.max(draft.approvedAmount - draft.executedAmount, 0))}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setMessage("Alterações prontas para salvar no Supabase.")}
            >
              <Save className="size-4" />
              Salvar alterações
            </Button>
            <Button type="button" variant="outline" onClick={resetDraft}>
              <RotateCcw className="size-4" />
              Restaurar
            </Button>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <FileImage className="mb-2 size-4 text-primary" />
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
