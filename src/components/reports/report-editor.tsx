"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Download, Save } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";
import { reportTypes } from "@/modules/reports/types";

type ReportDraft = {
  type: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string;
  documentsNotes: string;
  financeNotes: string;
  scheduleNotes: string;
  signature: string;
};

function createDraft(project: Project): ReportDraft {
  return {
    type: "Dossiê completo do projeto",
    title: `Relatório - ${project.name}`,
    startDate: project.startDate,
    endDate: project.endDate,
    summary: project.summary,
    documentsNotes: "Documentos anexados e organizados por categoria.",
    financeNotes: "Execução financeira vinculada às rubricas aprovadas.",
    scheduleNotes: "Cronograma editável com aulas, ensaios e atividades.",
    signature: "Eduardo / Marcel",
  };
}

function makeReportText(project: Project, draft: ReportDraft) {
  return [
    draft.title,
    draft.type,
    "",
    `Projeto: ${project.fullTitle}`,
    `Edital: ${project.edital}`,
    `Período: ${draft.startDate} a ${draft.endDate}`,
    "",
    "Resumo",
    draft.summary,
    "",
    "Documentos",
    draft.documentsNotes,
    "",
    "Financeiro",
    draft.financeNotes,
    "",
    "Cronograma",
    draft.scheduleNotes,
    "",
    `Responsável: ${draft.signature}`,
  ].join("\n");
}

export function ReportEditor({ project }: { project: Project }) {
  const [draft, setDraft] = useState<ReportDraft>(() => createDraft(project));
  const [feedback, setFeedback] = useState("Relatório pronto para edição.");
  const reportText = useMemo(() => makeReportText(project, draft), [draft, project]);

  function updateField<K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function downloadTxt() {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${draft.title || "relatorio"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback("Relatório TXT gerado.");
  }

  return (
    <SectionCard
      title="Editar relatório"
      description={feedback}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFeedback("Rascunho do relatório salvo.")}
          >
            <Save className="size-4" />
            Salvar
          </Button>
          <Button type="button" onClick={downloadTxt}>
            <Download className="size-4" />
            TXT
          </Button>
        </>
      }
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid gap-3">
          <Field label="Tipo">
            <select
              className="form-input mt-1"
              value={draft.type}
              onChange={(event) => updateField("type", event.target.value)}
            >
              {reportTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Título">
            <input
              className="form-input mt-1"
              value={draft.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Data inicial">
              <input
                className="form-input mt-1"
                type="date"
                value={draft.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
              />
            </Field>
            <Field label="Data final">
              <input
                className="form-input mt-1"
                type="date"
                value={draft.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
              />
            </Field>
          </div>
          <Field label="Resumo">
            <textarea
              className="form-input mt-1 min-h-28"
              value={draft.summary}
              onChange={(event) => updateField("summary", event.target.value)}
            />
          </Field>
          <Field label="Documentos">
            <textarea
              className="form-input mt-1 min-h-20"
              value={draft.documentsNotes}
              onChange={(event) => updateField("documentsNotes", event.target.value)}
            />
          </Field>
          <Field label="Financeiro">
            <textarea
              className="form-input mt-1 min-h-20"
              value={draft.financeNotes}
              onChange={(event) => updateField("financeNotes", event.target.value)}
            />
          </Field>
          <Field label="Cronograma">
            <textarea
              className="form-input mt-1 min-h-20"
              value={draft.scheduleNotes}
              onChange={(event) => updateField("scheduleNotes", event.target.value)}
            />
          </Field>
          <Field label="Responsável">
            <input
              className="form-input mt-1"
              value={draft.signature}
              onChange={(event) => updateField("signature", event.target.value)}
            />
          </Field>
        </div>

        <article className="rounded-lg border border-border bg-white p-5 text-sm leading-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Prévia
          </p>
          <h3 className="mt-2 text-xl font-semibold">{draft.title}</h3>
          <p className="mt-1 text-muted-foreground">{draft.type}</p>
          <div className="mt-5 space-y-4">
            <PreviewBlock title="Projeto" value={project.fullTitle} />
            <PreviewBlock title="Resumo" value={draft.summary} />
            <PreviewBlock title="Documentos" value={draft.documentsNotes} />
            <PreviewBlock title="Financeiro" value={draft.financeNotes} />
            <PreviewBlock title="Cronograma" value={draft.scheduleNotes} />
          </div>
          <p className="mt-8 text-right text-muted-foreground">
            {draft.signature}
          </p>
        </article>
      </div>
    </SectionCard>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function PreviewBlock({ title, value }: { title: string; value: string }) {
  return (
    <section>
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-1 whitespace-pre-line text-muted-foreground">{value}</p>
    </section>
  );
}
