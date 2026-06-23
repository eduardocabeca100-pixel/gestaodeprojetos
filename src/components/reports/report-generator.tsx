"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openSystemPdf, escapePdfHtml } from "@/lib/pdf/pdf-template";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { Project } from "@/modules/projects/types";
import type { Activity } from "@/modules/schedule/types";

function formatBrDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function buildProjectDossierBodyHtml(project: Project, activities: Activity[]) {
  const completedActivities = activities.filter(
    (activity) => activity.status === "Realizada",
  ).length;
  const scheduledActivities = activities.filter(
    (activity) => activity.status !== "Realizada",
  ).length;
  const totalAttendance = activities.reduce(
    (sum, activity) => sum + activity.attendanceCount,
    0,
  );
  const totalPhotos = activities.reduce(
    (sum, activity) => sum + activity.photoCount,
    0,
  );

  const overviewCards = [
    ["Projeto", project.name],
    ["Edital", project.edital],
    ["Inscrição", project.registrationNumber],
    ["Status", project.status],
    ["Valor aprovado", formatCurrency(project.approvedAmount)],
    ["Valor executado", formatCurrency(project.executedAmount)],
    ["Atividades realizadas", String(completedActivities)],
    ["Atividades programadas", String(scheduledActivities)],
  ]
    .map(
      ([label, value]) => `
        <div class="info-card">
          <strong>${escapePdfHtml(label)}</strong>
          <div>${escapePdfHtml(value)}</div>
        </div>
      `,
    )
    .join("");

  const activityRows = activities.length
    ? activities
        .map(
          (activity) => `
            <tr>
              <td>${escapePdfHtml(activity.title)}</td>
              <td>${escapePdfHtml(activity.type)}</td>
              <td>${escapePdfHtml(formatBrDate(activity.date))}</td>
              <td>${escapePdfHtml(activity.status)}</td>
            </tr>
          `,
        )
        .join("")
    : `
      <tr>
        <td colspan="4">Nenhuma atividade cadastrada para este projeto.</td>
      </tr>
    `;

  return `
    <p class="eyebrow">Dossiê institucional</p>
    <div class="info-grid">
      ${overviewCards}
    </div>

    <section class="document-section">
      <h2>Resumo do projeto</h2>
      <p>${escapePdfHtml(project.fullTitle)}</p>
      <p class="pre-line">${escapePdfHtml(project.summary)}</p>
    </section>

    <section class="document-section">
      <h2>Dados de execução</h2>
      <div class="detail-list">
        <div class="info-card">
          <strong>Período</strong>
          <div>${escapePdfHtml(formatBrDate(project.startDate))} a ${escapePdfHtml(formatBrDate(project.endDate))}</div>
        </div>
        <div class="info-card">
          <strong>Proponente</strong>
          <div>${escapePdfHtml(project.proponent)}</div>
        </div>
        <div class="info-card">
          <strong>Modalidade / classe</strong>
          <div>${escapePdfHtml(`${project.modality} • ${project.className}`)}</div>
        </div>
        <div class="info-card">
          <strong>Cidade / estado</strong>
          <div>${escapePdfHtml(`${project.city} / ${project.state}`)}</div>
        </div>
      </div>
      <p class="inline-note">
        Frequência registrada: ${escapePdfHtml(String(totalAttendance))} presenças somadas.
        Acervo selecionado: ${escapePdfHtml(String(totalPhotos))} mídias marcadas ao longo das atividades.
      </p>
    </section>

    <section class="document-section">
      <h2>Cronograma e atividades</h2>
      <table>
        <thead>
          <tr>
            <th>Atividade</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${activityRows}
        </tbody>
      </table>
    </section>

    <section class="document-section">
      <h2>Observações institucionais</h2>
      <p class="pre-line">${escapePdfHtml(project.notes)}</p>
    </section>
  `;
}

function toPdfFileName(project: Project) {
  return `dossie-${project.slug}.pdf`;
}

export function ReportGenerator({
  project,
  activities,
}: {
  project: Project;
  activities: Activity[];
}) {
  function generatePdf() {
    openSystemPdf({
      title: `Dossiê completo - ${project.name}`,
      subtitle:
        "Documento institucional consolidado com visão do projeto, cronograma e situação atual.",
      documentLabel: "Dossiê completo do projeto",
      preparedBy: "Sistema",
      fileName: toPdfFileName(project),
      bodyHtml: buildProjectDossierBodyHtml(project, activities),
    });
  }

  return (
    <Button type="button" onClick={generatePdf}>
      <Download className="size-4" />
      Gerar PDF
    </Button>
  );
}
