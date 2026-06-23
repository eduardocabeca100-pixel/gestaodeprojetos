"use client";

import { useMemo, useState, type ReactNode } from "react";
import { RotateCcw, Save } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
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
    <SectionCard
      title="Edicao rapida"
      description="Ajuste dados principais do projeto ativo sem sair do dashboard."
      className="h-full p-5"
    >
      <div id="editar-projeto" className="space-y-4">
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

        <div className="grid gap-3 rounded-[1.4rem] border border-white/80 bg-white/86 p-4 md:grid-cols-3">
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

        <div className="rounded-[1.25rem] border border-dashed border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          {message}
        </div>
      </div>
    </SectionCard>
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
    <div className="rounded-[1rem] border border-white/80 bg-white p-3 shadow-[0_18px_34px_-30px_rgba(37,99,235,0.35)]">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
