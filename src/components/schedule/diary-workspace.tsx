"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { TeamMember } from "@/modules/team/types";
import { readStoredScheduleActivities, SCHEDULE_STORAGE_EVENT } from "@/components/schedule/local-schedule-store";

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
  activities: initialActivities,
  participants,
  teamMembers,
}: {
  project: Project;
  activities: Activity[];
  participants: Participant[];
  teamMembers: TeamMember[];
}) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [selectedActivityId, setSelectedActivityId] = useState(
    initialActivities[0]?.id ?? "",
  );
  const [selectedParticipantId, setSelectedParticipantId] = useState(
    participants[0]?.id ?? "",
  );
  const [attendance, setAttendance] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(activities.map((activity) => [activity.id, [] as string[]])),
  );
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, LessonDraft>>(() =>
    Object.fromEntries(activities.map((activity) => [activity.id, getLessonContent(activity)])),
  );
  const [certificateDraft, setCertificateDraft] = useState(() => ({
    title: "ATESTADO DE MATRÍCULA",
    body:
      "Atestamos, para os devidos fins, que {{nome}} encontra-se matriculado(a) no projeto {{projeto}}, no âmbito do PNAB, participando do ciclo de aulas descrito neste documento. O(a) participante está vinculado(a) à aula {{aula}} de {{total_aulas}}, com conteúdo programático voltado para {{tema}}. Objetivo: {{objetivo}}. Conteúdo: {{conteudo}}.",
    footerNote:
      "Documento gerado a partir do diário de classe da Companhia de Artes Viva.",
  }));
  const [feedback, setFeedback] = useState("Chamada pronta para edição.");

  useEffect(() => {
    function refreshDiaryActivities() {
      const nextActivities = readStoredScheduleActivities(project.id, initialActivities);

      setActivities(nextActivities);
      setSelectedActivityId((current) =>
        nextActivities.some((activity) => activity.id === current)
          ? current
          : nextActivities[0]?.id ?? "",
      );
      setAttendance((current) => {
        const validIds = new Set(nextActivities.map((activity) => activity.id));

        return Object.fromEntries(
          Object.entries(current).filter(([activityId]) => validIds.has(activityId)),
        );
      });
      setLessonDrafts((current) => {
        const validIds = new Set(nextActivities.map((activity) => activity.id));
        const cleaned = Object.fromEntries(
          Object.entries(current).filter(([activityId]) => validIds.has(activityId)),
        );

        for (const activity of nextActivities) {
          cleaned[activity.id] = cleaned[activity.id] ?? getLessonContent(activity);
        }

        return cleaned;
      });
    }

    const handle = window.setTimeout(refreshDiaryActivities, 0);
    window.addEventListener(SCHEDULE_STORAGE_EVENT, refreshDiaryActivities);
    window.addEventListener("storage", refreshDiaryActivities);

    return () => {
      window.clearTimeout(handle);
      window.removeEventListener(SCHEDULE_STORAGE_EVENT, refreshDiaryActivities);
      window.removeEventListener("storage", refreshDiaryActivities);
    };
  }, [initialActivities, project.id]);
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
  const selectedParticipant =
    participants.find((participant) => participant.id === selectedParticipantId) ??
    participants[0] ??
    null;
  const attendanceRate =
    participants.length > 0
      ? Math.round((presentParticipants.length / participants.length) * 100)
      : 0;
  const participantAttendanceSummary = useMemo(
    () =>
      participants.map((participant) => {
        const presentCount = activities.reduce(
          (count, activity) => count + Number(attendance[activity.id]?.includes(participant.id)),
          0,
        );
        const rate = activities.length > 0 ? Math.round((presentCount / activities.length) * 100) : 0;

        return { participant, presentCount, rate, isAtRisk: rate < 75 };
      }),
    [activities, attendance, participants],
  );
  const isApproved = attendanceRate >= 75;
  const selectedLessonNumber = lesson?.number ??
    activities.findIndex((activity) => activity.id === selectedActivity?.id) + 1;
  const totalCourseHours = useMemo(
    () =>
      activities.reduce((total, activity) => {
        const start = parseTimeToMinutes(activity.startTime);
        const end = parseTimeToMinutes(activity.endTime);
        if (start === null || end === null || end <= start) return total;

        return total + (end - start) / 60;
      }, 0),
    [activities],
  );
  const selectedActivityHours = useMemo(() => {
    if (!selectedActivity) return 0;

    const start = parseTimeToMinutes(selectedActivity.startTime);
    const end = parseTimeToMinutes(selectedActivity.endTime);
    if (start === null || end === null || end <= start) return 0;

    return (end - start) / 60;
  }, [selectedActivity]);
  const producerSignature =
    teamMembers.find((member) => member.role === "Diretor geral") ??
    teamMembers.find((member) => member.role === "Diretor executivo") ??
    teamMembers[0] ??
    null;
  const executiveProducerSignature =
    teamMembers.find((member) => member.role === "Produtor executivo") ??
    teamMembers.find((member) => member.role === "Diretor executivo") ??
    teamMembers.find((member) => member.role === "Diretor geral") ??
    teamMembers[0] ??
    null;

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

  function handleParticipantClick(participantId: string) {
    setSelectedParticipantId(participantId);
    toggleParticipant(participantId);
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
    if (!selectedActivity || !lesson || !selectedParticipant) return;

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const width = pdf.internal.pageSize.getWidth();
    const margin = 52;
    let y = 64;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text(certificateDraft.title, width / 2, y, { align: "center" });
    pdf.setFontSize(12);
    pdf.text("Companhia de Artes Viva", width / 2, y + 22, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Sistema de gestão de projetos culturais - PNAB", width / 2, y + 38, {
      align: "center",
    });

    y += 72;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    y = writeCertificateField(pdf, margin, y, "Projeto", project.name, width - margin * 2);
    y = writeCertificateField(pdf, margin, y, "Participante", selectedParticipant.fullName, width - margin * 2);
    y = writeCertificateField(pdf, margin, y, "CPF", selectedParticipant.document, width - margin * 2);
    y = writeCertificateField(pdf, margin, y, "Aula", `${selectedLessonNumber} de ${activities.length}`, width - margin * 2);
    y = writeCertificateField(pdf, margin, y, "Atividade", selectedActivity.title, width - margin * 2);
    y = writeCertificateField(
      pdf,
      margin,
      y,
      "Data",
      selectedActivity.date ? formatDate(selectedActivity.date) : "Sem data",
      width - margin * 2,
    );
    y = writeCertificateField(
      pdf,
      margin,
      y,
      "Carga horária da aula",
      selectedActivityHours > 0 ? formatHours(selectedActivityHours) : "a definir",
      width - margin * 2,
    );
    y = writeCertificateField(
      pdf,
      margin,
      y,
      "Carga horária total do ciclo",
      totalCourseHours > 0 ? formatHours(totalCourseHours) : "a definir",
      width - margin * 2,
    );
    y += 10;

    pdf.setFontSize(10);
    const bodyText = applyCertificateTemplate(certificateDraft.body, {
      nome: selectedParticipant.fullName,
      cpf: selectedParticipant.document,
      projeto: project.name,
      aula: `${selectedLessonNumber}`,
      total_aulas: `${activities.length}`,
      atividade: selectedActivity.title,
      data: selectedActivity.date ? formatDate(selectedActivity.date) : "Sem data",
      tema: lesson.theme,
      objetivo: lesson.objective,
      conteudo: lesson.content,
      horas_aula: selectedActivityHours > 0 ? formatHours(selectedActivityHours) : "a definir",
      horas_total: totalCourseHours > 0 ? formatHours(totalCourseHours) : "a definir",
      produtor_projeto: producerSignature?.name ?? "Produtor do projeto",
      produtor_executivo: executiveProducerSignature?.name ?? "Produtor executivo",
    });
    const textLines = pdf.splitTextToSize(bodyText, width - margin * 2);
    pdf.text(textLines, margin, y);
    y += textLines.length * 15 + 18;

    y += 26;

    pdf.line(margin, y, margin + 210, y);
    pdf.text(producerSignature?.name ?? "Produtor do projeto", margin, y + 18);
    pdf.setFontSize(9);
    pdf.text("Produtor do projeto", margin, y + 32);

    pdf.setFontSize(11);
    pdf.line(width - margin - 210, y, width - margin, y);
    pdf.text(executiveProducerSignature?.name ?? "Produtor executivo", width - margin, y + 18, {
      align: "right",
    });
    pdf.setFontSize(9);
    pdf.text("Produtor executivo", width - margin, y + 32, { align: "right" });

    y += 60;
    pdf.setFontSize(8);
    pdf.setTextColor(90);
    pdf.text(applyCertificateTemplate(certificateDraft.footerNote, {
      nome: selectedParticipant.fullName,
      cpf: selectedParticipant.document,
      projeto: project.name,
      aula: `${selectedLessonNumber}`,
      total_aulas: `${activities.length}`,
      atividade: selectedActivity.title,
      data: selectedActivity.date ? formatDate(selectedActivity.date) : "Sem data",
      tema: lesson.theme,
      objetivo: lesson.objective,
      conteudo: lesson.content,
      horas_aula: selectedActivityHours > 0 ? formatHours(selectedActivityHours) : "a definir",
      horas_total: totalCourseHours > 0 ? formatHours(totalCourseHours) : "a definir",
      produtor_projeto: producerSignature?.name ?? "Produtor do projeto",
      produtor_executivo: executiveProducerSignature?.name ?? "Produtor executivo",
    }), width / 2, y, {
      align: "center",
    });

    pdf.save(`atestado-matricula-${project.slug}-${selectedParticipant.id}-${selectedActivity.id}.pdf`);
    setFeedback("Atestado de matrícula PDF gerado para o aluno selecionado.");
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
            {participantAttendanceSummary.map(({ participant, presentCount, rate, isAtRisk }) => {
              const isPresent = presentIds.includes(participant.id);

              return (
                <button
                  key={participant.id}
                  type="button"
                  className={
                    `${participant.id === selectedParticipant?.id ? "ring-2 ring-primary/50" : ""} ${
                      isPresent
                        ? "flex min-h-16 w-full items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-left"
                        : "flex min-h-16 w-full items-center justify-between rounded-lg border border-border bg-white p-2.5 text-left transition hover:border-primary"
                    }`
                  }
                  onClick={() => handleParticipantClick(participant.id)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{participant.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {participant.document ? `CPF ${participant.document}` : "CPF não informado"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.city && participant.neighborhood
                        ? `${participant.city} - ${participant.neighborhood}`
                        : participant.neighborhood || participant.city || "Sem bairro"}
                    </p>
                    <p className={isAtRisk ? "mt-1 text-[11px] font-semibold text-red-600" : "mt-1 text-[11px] font-semibold text-emerald-700"}>
                      Frequência geral {rate}% ({presentCount}/{activities.length || 1} aulas)
                    </p>
                  </div>
                  <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                    <span className={isPresent ? "rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white" : "rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"}>
                      {isPresent ? "Presente" : "Ausente"}
                    </span>
                    <span className={isAtRisk ? "rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700" : "rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"}>
                      {isAtRisk ? "Risco" : "Seguro"}
                    </span>
                  </div>
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
        title="Atestado de matrícula"
        description="Documento nominal com participante, CPF, aula do ciclo, carga horária e assinaturas oficiais."
          actions={
            <Button type="button" onClick={downloadCertificate}>
              <Download className="size-4" />
              Gerar atestado
            </Button>
          }
        >
          <div className="rounded-lg border border-border bg-white p-5 text-sm leading-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Aluno selecionado
            </p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedParticipant?.fullName ?? "Selecione um aluno"}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  {selectedParticipant?.document ? `CPF ${selectedParticipant.document}` : "CPF não informado"}
                </p>
              </div>
              <label className="min-w-64 flex-1 max-w-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Trocar aluno
                </span>
                <select
                  className="form-input mt-1"
                  value={selectedParticipant?.id ?? ""}
                  onChange={(event) => setSelectedParticipantId(event.target.value)}
                >
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.fullName} {participant.document ? `- CPF ${participant.document}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-1 text-muted-foreground">
              {selectedActivity.date ? formatDate(selectedActivity.date) : "Sem data"} · Aula{" "}
              {selectedLessonNumber} de {activities.length}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                Horas do ciclo {formatHours(totalCourseHours)}
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium">Título do documento</span>
                  <input
                    className="form-input mt-1"
                    value={certificateDraft.title}
                    onChange={(event) =>
                      setCertificateDraft((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium">Texto principal</span>
                  <textarea
                    className="form-input mt-1 min-h-36"
                    value={certificateDraft.body}
                    onChange={(event) =>
                      setCertificateDraft((current) => ({ ...current, body: event.target.value }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use <code>{`{{nome}}`}</code>, <code>{`{{cpf}}`}</code>, <code>{`{{projeto}}`}</code>,{" "}
                    <code>{`{{aula}}`}</code>, <code>{`{{tema}}`}</code> e <code>{`{{horas_total}}`}</code>.
                  </p>
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium">Rodapé do documento</span>
                  <textarea
                    className="form-input mt-1 min-h-24"
                    value={certificateDraft.footerNote}
                    onChange={(event) =>
                      setCertificateDraft((current) => ({ ...current, footerNote: event.target.value }))
                    }
                  />
                </label>
              </div>
              <PreviewRow label="Projeto PNAB" value={project.name} />
              <PreviewRow label="Aula emitida" value={`${selectedLessonNumber} de ${activities.length}`} />
              <PreviewRow label="Tema" value={lesson?.theme ?? ""} />
              <PreviewRow label="Objetivo" value={lesson?.objective ?? ""} />
              <PreviewRow label="Conteúdo programático" value={lesson?.content ?? ""} />
              <PreviewRow label="Prática" value={lesson?.practice ?? ""} />
              <PreviewRow label="Carga horária da aula" value={formatHours(selectedActivityHours)} />
              <PreviewRow label="Carga horária total" value={formatHours(totalCourseHours)} />
              <PreviewRow
                label="Assinaturas oficiais"
                value={`${producerSignature?.name ?? "Produtor do projeto"} / ${executiveProducerSignature?.name ?? "Produtor executivo"}`}
              />
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            O atestado usa o aluno selecionado, a chamada acumulada e o modelo abaixo, que você pode editar antes de gerar o PDF.
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

function parseTimeToMinutes(value: string) {
  const match = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
}

function formatHours(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0h";

  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${hours}h`;

  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

function writeCertificateField(
  pdf: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  maxWidth: number,
) : number {
  if (!value) return y;

  pdf.setFont("helvetica", "bold");
  pdf.text(`${label}:`, x, y);
  pdf.setFont("helvetica", "normal");
  const lines = pdf.splitTextToSize(value, maxWidth - 24);
  pdf.text(lines, x, y + 14);

  return y + 14 + lines.length * 12 + 8;
}

function applyCertificateTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, token: string) => values[token] ?? "");
}
