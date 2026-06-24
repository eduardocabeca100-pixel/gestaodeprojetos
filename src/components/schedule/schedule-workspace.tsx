"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Plus,
  PencilLine,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format-date";
import type { Project } from "@/modules/projects/types";
import {
  activityStatuses,
  activityTypes,
  type Activity,
} from "@/modules/schedule/types";
import {
  forceEmptySchedule,
  readStoredScheduleActivities,
  resetStoredScheduleActivities,
  writeStoredScheduleActivities,
} from "@/components/schedule/local-schedule-store";

function emptyLesson(number: number): NonNullable<Activity["lesson"]> {
  return {
    number,
    theme: "",
    objective: "",
    content: "",
    practice: "",
    expectedResult: "",
    teacher: "",
    pedagogicalNotes: "",
  };
}

function createBlankActivity(project: Project, index: number): Activity {
  return {
    id: `${project.id}-nova-${Date.now()}`,
    projectId: project.id,
    title: `Nova atividade ${index}`,
    type: "Aula",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    responsible: "",
    description: "",
    status: "Pendente",
    attendanceCount: 0,
    photoCount: 0,
    documentCount: 0,
    notes: "",
    lesson: emptyLesson(index),
  };
}

export function ScheduleWorkspace({
  activities,
  project,
}: {
  activities: Activity[];
  project: Project;
}) {
  const [items, setItems] = useState<Activity[]>(activities);
  const [selectedId, setSelectedId] = useState(activities[0]?.id ?? "");
  const [feedback, setFeedback] = useState("Cronograma pronto para edição.");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const stored = readStoredScheduleActivities(project, activities);

      setItems(stored);
      setSelectedId((current) =>
        stored.some((activity) => activity.id === current)
          ? current
          : stored[0]?.id ?? "",
      );
    }, 0);

    return () => window.clearTimeout(handle);
  }, [activities, project]);

  const selected = useMemo(
    () => items.find((activity) => activity.id === selectedId) ?? items[0],
    [items, selectedId],
  );

  function commitItems(nextItems: Activity[], message: string, nextSelectedId?: string) {
    setItems(nextItems);
    writeStoredScheduleActivities(project, nextItems);
    setSelectedId(nextSelectedId ?? nextItems[0]?.id ?? "");
    setFeedback(message);
  }

  function updateActivity(next: Activity) {
    const nextItems = items.map((activity) =>
      activity.id === next.id ? next : activity,
    );

    commitItems(nextItems, "Alteração salva no cronograma.", next.id);
  }

  function updateField<K extends keyof Activity>(key: K, value: Activity[K]) {
    if (!selected) return;
    updateActivity({ ...selected, [key]: value });
  }

  function updateLesson<K extends keyof NonNullable<Activity["lesson"]>>(
    key: K,
    value: NonNullable<Activity["lesson"]>[K],
  ) {
    if (!selected) return;

    const lesson = selected.lesson ?? emptyLesson(items.indexOf(selected) + 1);
    updateActivity({ ...selected, lesson: { ...lesson, [key]: value } });
  }

  function addActivity() {
    const next = createBlankActivity(project, items.length + 1);
    commitItems([...items, next], "Nova atividade criada e salva.", next.id);
  }

  function editActivity(activityId: string) {
    setSelectedId(activityId);
    setFeedback("Atividade aberta para edição.");
  }

  function deleteActivity(activityId: string) {
    const next = items.filter((activity) => activity.id !== activityId);
    const nextSelectedId = selectedId === activityId ? next[0]?.id ?? "" : selectedId;

    commitItems(next, "Atividade removida e salva. Ela também sai do diário de classe.", nextSelectedId);
  }

  function clearAndSaveEmpty() {
    if (
      !window.confirm(
        "Apagar e salvar o cronograma vazio? O diário de classe deste projeto também ficará sem aulas.",
      )
    ) {
      return;
    }

    forceEmptySchedule(project);
    setItems([]);
    setSelectedId("");
    setFeedback("Cronograma vazio salvo. O diário de classe também ficará vazio.");
  }

  function restoreInitialModel() {
    resetStoredScheduleActivities(project);
    setItems(activities);
    setSelectedId(activities[0]?.id ?? "");
    setFeedback("Modelo inicial restaurado.");
  }

  function markDone() {
    if (!selected) return;

    updateActivity({ ...selected, status: "Realizada" });
    setFeedback("Atividade marcada como realizada.");
  }

  if (!selected) {
    return (
      <SectionCard
        title="Cronograma editável"
        description="Este projeto está sem aulas/atividades cadastradas."
        actions={
          <>
            <Button type="button" onClick={addActivity}>
              <Plus className="size-4" />
              Criar primeira atividade
            </Button>

            <Button type="button" variant="outline" onClick={restoreInitialModel}>
              <RotateCcw className="size-4" />
              Restaurar modelo
            </Button>
          </>
        }
      >
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Cronograma vazio salvo. O Diário de Classe deste projeto também deve ficar vazio.
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Calendário do projeto"
        actions={
          <>
            <Button type="button" variant="destructive" onClick={clearAndSaveEmpty}>
              <Trash2 className="size-4" />
              Apagar e salvar vazio
            </Button>

            <Button type="button" variant="outline" onClick={restoreInitialModel}>
              <RotateCcw className="size-4" />
              Restaurar modelo
            </Button>
          </>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {items.slice(0, 8).map((activity) => (
            <button
              key={activity.id}
              type="button"
              className={
                activity.id === selected.id
                  ? "rounded-lg border border-primary bg-primary/10 p-3 text-left text-sm"
                  : "rounded-lg border border-border bg-white p-3 text-left text-sm transition hover:border-primary"
              }
              onClick={() => setSelectedId(activity.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">
                  {activity.date ? activity.date.slice(8, 10) : "--"}
                </p>
                <StatusBadge value={activity.status} />
              </div>
              <p className="mt-1 line-clamp-2 text-muted-foreground">
                {activity.title}
              </p>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,0.92fr)_minmax(340px,1.08fr)]">
        <SectionCard
          title={`Atividades de ${project.name}`}
          description={`${items.length} registros no cronograma. ${feedback}`}
          actions={
            <Button type="button" onClick={addActivity}>
              <Plus className="size-4" />
              Nova aula
            </Button>
          }
        >
          <div className="space-y-3">
            {items.map((activity) => (
              <article
                key={activity.id}
                role="button"
                tabIndex={0}
                className={
                  activity.id === selected.id
                    ? "w-full rounded-lg border border-primary bg-primary/10 p-4 text-left"
                    : "w-full rounded-lg border border-border bg-white p-4 text-left transition hover:border-primary"
                }
                onClick={() => setSelectedId(activity.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(activity.id);
                  }
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
                      {activity.type}
                    </p>
                    <h3 className="mt-1 font-semibold">{activity.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activity.date ? formatDate(activity.date) : "Sem data"} ·{" "}
                      {activity.startTime || "--:--"} às {activity.endTime || "--:--"}
                    </p>
                  </div>
                  <StatusBadge value={activity.status} />
                </div>

                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5 text-primary" />
                    {activity.location || "Sem local"}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="size-3.5 text-emerald-600" />
                    {activity.attendanceCount} presenças
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-cyan-600" />
                    {activity.documentCount} docs
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      editActivity(activity.id);
                    }}
                  >
                    <PencilLine className="size-3.5" />
                    Editar
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteActivity(activity.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Apagar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Editar aula / atividade"
          description={feedback}
          actions={
            <>
              <Button type="button" variant="outline" onClick={markDone}>
                <CheckCircle2 className="size-4" />
                Aula realizada
              </Button>

              <Button
                type="button"
                onClick={() => {
                  writeStoredScheduleActivities(project, items);
                  setFeedback("Cronograma salvo. O diário de classe foi sincronizado.");
                }}
              >
                <Save className="size-4" />
                Salvar
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Título">
                <input
                  className="form-input mt-1"
                  value={selected.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
              </Field>

              <Field label="Tipo">
                <select
                  className="form-input mt-1"
                  value={selected.type}
                  onChange={(event) =>
                    updateField("type", event.target.value as Activity["type"])
                  }
                >
                  {activityTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Data">
                <input
                  className="form-input mt-1"
                  type="date"
                  value={selected.date}
                  onChange={(event) => updateField("date", event.target.value)}
                />
              </Field>

              <Field label="Início">
                <input
                  className="form-input mt-1"
                  type="time"
                  value={selected.startTime}
                  onChange={(event) => updateField("startTime", event.target.value)}
                />
              </Field>

              <Field label="Fim">
                <input
                  className="form-input mt-1"
                  type="time"
                  value={selected.endTime}
                  onChange={(event) => updateField("endTime", event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Local">
                <input
                  className="form-input mt-1"
                  value={selected.location}
                  onChange={(event) => updateField("location", event.target.value)}
                />
              </Field>

              <Field label="Responsável">
                <input
                  className="form-input mt-1"
                  value={selected.responsible}
                  onChange={(event) => updateField("responsible", event.target.value)}
                />
              </Field>
            </div>

            <Field label="Status">
              <select
                className="form-input mt-1"
                value={selected.status}
                onChange={(event) =>
                  updateField("status", event.target.value as Activity["status"])
                }
              >
                {activityStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </Field>

            <Field label="Descrição">
              <textarea
                className="form-input mt-1 min-h-24"
                value={selected.description}
                onChange={(event) => updateField("description", event.target.value)}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Presenças">
                <input
                  className="form-input mt-1"
                  type="number"
                  value={selected.attendanceCount}
                  onChange={(event) =>
                    updateField("attendanceCount", Number(event.target.value))
                  }
                />
              </Field>

              <Field label="Fotos">
                <input
                  className="form-input mt-1"
                  type="number"
                  value={selected.photoCount}
                  onChange={(event) =>
                    updateField("photoCount", Number(event.target.value))
                  }
                />
              </Field>

              <Field label="Documentos">
                <input
                  className="form-input mt-1"
                  type="number"
                  value={selected.documentCount}
                  onChange={(event) =>
                    updateField("documentCount", Number(event.target.value))
                  }
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tema">
                <input
                  className="form-input mt-1"
                  value={selected.lesson?.theme ?? ""}
                  onChange={(event) => updateLesson("theme", event.target.value)}
                />
              </Field>

              <Field label="Professor / responsável">
                <input
                  className="form-input mt-1"
                  value={selected.lesson?.teacher ?? ""}
                  onChange={(event) => updateLesson("teacher", event.target.value)}
                />
              </Field>
            </div>

            <Field label="Objetivo">
              <textarea
                className="form-input mt-1 min-h-20"
                value={selected.lesson?.objective ?? ""}
                onChange={(event) => updateLesson("objective", event.target.value)}
              />
            </Field>

            <Field label="Conteúdo programático">
              <textarea
                className="form-input mt-1 min-h-24"
                value={selected.lesson?.content ?? ""}
                onChange={(event) => updateLesson("content", event.target.value)}
              />
            </Field>

            <Field label="Prática / encaminhamento">
              <textarea
                className="form-input mt-1 min-h-20"
                value={selected.lesson?.practice ?? ""}
                onChange={(event) => updateLesson("practice", event.target.value)}
              />
            </Field>

            <Field label="Observações">
              <textarea
                className="form-input mt-1 min-h-24"
                value={selected.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </Field>
          </div>
        </SectionCard>
      </div>
    </div>
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
