"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import {
  CalendarDays,
  Download,
  Save,
  UserCheck,
  UserX,
} from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format-date";
import type { Project } from "@/modules/projects/types";
import type { Activity } from "@/modules/schedule/types";
import type { Participant } from "@/modules/participants/types";

type LessonDraft = NonNullable<Activity["lesson"]>;

function getLessonContent(activity: Activity) {
  return activity.lesson ?? {
    number: 1,
    theme: activity.title,
    objective: activity.description,
    content: activity.description,
    practice: activity.notes,
    expectedResult: "Registro de presença e comprovação documental.",
    teacher: activity.responsible,
    pedagogicalNotes: "",
  };
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function DiaryWorkspace({
  project,
  activities,
  participants,
}: {
  project: Project;
  activities: Activity[];
  participants: Participant[];
}) {
  const [selectedActivityId, setSelectedActivityId] = useState(
    activities[0]?.id ?? "",
  );
  const [attendance, setAttendance] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(activities.map((activity) => [activity.id, [] as string[]])),
  );
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, LessonDraft>>(() =>
    Object.fromEntries(activities.map((activity) => [activity.id, getLessonContent(activity)])),
  );
  const [feedback, setFeedback] = useState("Chamada pronta para edição.");
  const selectedActivity = useMemo(
    () =>
      activities.find((activity) => activity.id === selectedActivityId) ??
      activities[0],
    [activities, selectedActivityId],
  );
  const presentIds = attendance[selectedActivity?.id ?? ""] ?? [];
  const presentParticipants = participants.filter((participant) =>
    presentIds.includes(participant.id),
  );
  const lesson = selectedActivity ? lessonDrafts[selectedActivity.id] ?? getLessonContent(selectedActivity) : null;
  const attendanceRate =
    participants.length > 0
      ? Math.round((presentParticipants.length / participants.length) * 100)
      : 0;
  const isApproved = attendanceRate >= 75;

  function toggleParticipant(participantId: string) {
    if (!selectedActivity) return;

    setAttendance((current) => {
      const currentIds = current[selectedActivity.id] ?? [];
      const nextIds = currentIds.includes(participantId)
        ? currentIds.filter((id) => id !== participantId)
        : [...currentIds, participantId];

      return {
        ...current,
        [selectedActivity.id]: nextIds,
      };
    });
  }

  function markAllPresent() {
    if (!selectedActivity) return;

    setAttendance((current) => ({
      ...current,
      [selectedActivity.id]: participants.map((participant) => participant.id),
    }));
    setFeedback("Turma marcada como presente.");
  }

  function clearAttendance() {
    if (!selectedActivity) return;

    setAttendance((current) => ({ ...current, [selectedActivity.id]: [] }));
    setFeedback("Chamada limpa.");
  }

  function updateLesson<K extends keyof LessonDraft>(key: K, value: LessonDraft[K]) {
    if (!selectedActivity) return;

    setLessonDrafts((current) => ({
      ...current,
      [selectedActivity.id]: {
        ...(current[selectedActivity.id] ?? getLessonContent(selectedActivity)),
        [key]: value,
      },
    }));
  }

  function downloadCertificate() {
    if (!selectedActivity || !lesson) return;

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const width = pdf.internal.pageSize.getWidth();
    const margin = 52;
    let y = 64;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("CERTIFICADO", width / 2, y, { align: "center" });
    pdf.setFontSize(12);
    pdf.text("Companhia de Artes Viva", width / 2, y + 22, { align: "center" });

    y += 68;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Projeto: ${project.name}`, margin, y);
    y += 18;
    pdf.text(`Atividade: ${selectedActivity.title}`, margin, y);
    y += 18;
    pdf.text(`Data: ${selectedActivity.date ? formatDate(selectedActivity.date) : "Sem data"}`, margin, y);
    y += 18;
    pdf.text(`Carga horária: ${selectedActivity.startTime && selectedActivity.endTime ? `${selectedActivity.startTime} - ${selectedActivity.endTime}` : "a definir"}`, margin, y);
    y += 28;

    const textLines = pdf.splitTextToSize(
      `Certificamos que o(a) participante participou da atividade acima, com conteúdo programático voltado para ${lesson.theme}. Objetivo: ${lesson.objective}. Conteúdo: ${lesson.content}. Frequência final: ${attendanceRate}%. Resultado: ${isApproved ? "APROVADO" : "REPROVADO"}.`,
      width - margin * 2,
    );
    pdf.text(textLines, margin, y);
    y += textLines.length * 15 + 18;

    pdf.text(`Frequência final: ${attendanceRate}%`, margin, y);
    y += 18;
    pdf.text(`Situação: ${isApproved ? "APROVADO" : "REPROVADO"}`, margin, y);
    y += 38;

    pdf.line(margin, y, margin + 200, y);
    pdf.text("Direção executiva", margin + 54, y + 18);

    pdf.save(`certificado-${project.slug}-${selectedActivity.id}.pdf`);
    setFeedback("Certificado PDF gerado.");
  }

  if (!selectedActivity) {
    return (
      <SectionCard title="Diário de classe" description="Sem atividades para chamar.">
        <p className="text-sm text-muted-foreground">
          Cadastre uma atividade no cronograma para começar o diário.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Aulas do projeto"
        description={`Selecione uma aula para editar, marcar presença e gerar certificado. ${feedback}`}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activities.map((activity) => (
            <button
              key={activity.id}
              type="button"
              className={
                activity.id === selectedActivity.id
                  ? "rounded-lg border border-primary bg-primary/10 p-4 text-left"
                  : "rounded-lg border border-border bg-white p-4 text-left transition hover:border-primary"
              }
              onClick={() => setSelectedActivityId(activity.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-primary">
                    {activity.type}
                  </p>
                  <h3 className="mt-1 font-semibold">{activity.title}</h3>
                </div>
                <CalendarDays className="size-4 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {activity.date ? formatDate(activity.date) : "Sem data"}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Frequência</span>
                <span
                  className={
                    attendance[activity.id]?.length && participants.length
                      ? "rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
                      : "rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
                  }
                >
                  {participants.length
                    ? `${Math.round(((attendance[activity.id]?.length ?? 0) / participants.length) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,0.96fr)_minmax(340px,1.04fr)]">
        <SectionCard
          title={`Chamada - ${selectedActivity.title}`}
          description={`Presença da aula selecionada. Comparecimento: ${formatPercent(attendanceRate)}. ${isApproved ? "Aprovado" : "Reprovado"} com base em 75% de presença.`}
          actions={
            <>
              <Button type="button" variant="outline" onClick={markAllPresent}>
                <UserCheck className="size-4" />
                Todos presentes
              </Button>
              <Button type="button" variant="outline" onClick={clearAttendance}>
                <UserX className="size-4" />
                Limpar chamada
              </Button>
              <Button type="button" onClick={() => setFeedback("Chamada salva localmente.")}>
                <Save className="size-4" />
                Salvar
              </Button>
            </>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {participants.map((participant) => {
              const isPresent = presentIds.includes(participant.id);

              return (
                <button
                  key={participant.id}
                  type="button"
                  className={
                    isPresent
                      ? "flex min-h-16 w-full items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-left"
                      : "flex min-h-16 w-full items-center justify-between rounded-lg border border-border bg-white p-2.5 text-left transition hover:border-primary"
                  }
                  onClick={() => toggleParticipant(participant.id)}
                >
                  <div>
                    <p className="text-sm font-medium">{participant.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {participant.city && participant.neighborhood
                        ? `${participant.city} - ${participant.neighborhood}`
                        : participant.neighborhood || participant.city || "Sem bairro"}
                    </p>
                  </div>
                  <span className={isPresent ? "rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white" : "rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"}>
                    {isPresent ? "Presente" : "Ausente"}
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Edição da aula"
          description="Ajuste tema, objetivo, conteúdo e prática da aula selecionada."
          actions={
            <Button type="button" variant="outline" onClick={() => setFeedback("Aula preparada para edição.")}>
              Editar aula
            </Button>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Tema</span>
              <input
                className="form-input mt-1"
                value={lesson?.theme ?? ""}
                onChange={(event) => updateLesson("theme", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Objetivo</span>
              <textarea
                className="form-input mt-1 min-h-28"
                value={lesson?.objective ?? ""}
                onChange={(event) => updateLesson("objective", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Conteúdo programático</span>
              <textarea
                className="form-input mt-1 min-h-28"
                value={lesson?.content ?? ""}
                onChange={(event) => updateLesson("content", event.target.value)}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Prática</span>
              <textarea
                className="form-input mt-1 min-h-24"
                value={lesson?.practice ?? ""}
                onChange={(event) => updateLesson("practice", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Professor</span>
              <input
                className="form-input mt-1"
                value={lesson?.teacher ?? ""}
                onChange={(event) => updateLesson("teacher", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Observações pedagógicas</span>
              <textarea
                className="form-input mt-1 min-h-24"
                value={lesson?.pedagogicalNotes ?? ""}
                onChange={(event) => updateLesson("pedagogicalNotes", event.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => setFeedback("Aula atualizada localmente.")}>
              <Save className="size-4" />
              Salvar aula
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!selectedActivity) return;
                setLessonDrafts((current) => ({
                  ...current,
                  [selectedActivity.id]: getLessonContent(selectedActivity),
                }));
                setFeedback("Aula restaurada para a versão original.");
              }}
            >
              Restaurar aula
            </Button>
          </div>
        </SectionCard>

        <SectionCard
          title="Certificado"
          description="Prévia com conteúdo programático, carga horária e frequência da aula."
          actions={
            <Button type="button" onClick={downloadCertificate}>
              <Download className="size-4" />
              Gerar certificado
            </Button>
          }
        >
          <div className="rounded-lg border border-border bg-white p-5 text-sm leading-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Certificado da aula
            </p>
            <h3 className="mt-2 text-xl font-semibold">{selectedActivity.title}</h3>
            <p className="mt-1 text-muted-foreground">
              {selectedActivity.date ? formatDate(selectedActivity.date) : "Sem data"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={
                  isApproved
                    ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                }
              >
                {isApproved ? "APROVADO" : "REPROVADO"}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                Frequência {formatPercent(attendanceRate)}
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <PreviewRow label="Tema" value={lesson?.theme ?? ""} />
              <PreviewRow label="Objetivo" value={lesson?.objective ?? ""} />
              <PreviewRow label="Conteúdo programático" value={lesson?.content ?? ""} />
              <PreviewRow label="Prática" value={lesson?.practice ?? ""} />
              <PreviewRow label="Frequência" value={formatPercent(attendanceRate)} />
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            O certificado usa a aula selecionada e a frequência marcada nesta tela.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <section>
      <h4 className="font-semibold">{label}</h4>
      <p className="mt-1 whitespace-pre-line text-muted-foreground">
        {value || "Em branco"}
      </p>
    </section>
  );
}
