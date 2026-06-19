"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { Activity } from "@/modules/schedule/types";
import type { Project } from "@/modules/projects/types";

export function ReportGenerator({
  project,
  activities,
}: {
  project: Project;
  activities: Activity[];
}) {
  function generatePdf() {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("VIVA Gestão Cultural", 14, 18);
    doc.setFontSize(13);
    doc.text(`Dossiê completo - ${project.name}`, 14, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Edital: ${project.edital}`, 14, 42);
    doc.text(`Inscrição: ${project.registrationNumber}`, 14, 49);
    doc.text(`Valor aprovado: ${formatCurrency(project.approvedAmount)}`, 14, 56);
    doc.text(`Status: ${project.status}`, 14, 63);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 70);

    autoTable(doc, {
      startY: 82,
      head: [["Aula/Atividade", "Tipo", "Data", "Status"]],
      body: activities.map((activity) => [
        activity.title,
        activity.type,
        new Date(activity.date).toLocaleDateString("pt-BR"),
        activity.status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237] },
    });

    doc.save(`dossie-${project.slug}.pdf`);
  }

  return (
    <Button type="button" onClick={generatePdf}>
      <Download className="size-4" />
      Gerar PDF
    </Button>
  );
}
