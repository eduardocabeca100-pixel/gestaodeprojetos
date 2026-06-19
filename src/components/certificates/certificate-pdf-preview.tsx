"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileImage, FileDown } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

import type { Project } from "@/modules/projects/types";
import type {
  CertificateRecord,
  CertificateSettings,
  CertificateSponsorLogo,
  CertificateTemplate,
} from "@/modules/certificates/types";
import { Button } from "@/components/ui/button";

import { CertificateTemplatePreview } from "./certificate-template-preview";

export function CertificatePdfPreview({
  project,
  template,
  record,
  settings,
  sponsorLogos = [],
}: {
  project: Project;
  template: CertificateTemplate;
  record: CertificateRecord;
  settings: CertificateSettings;
  sponsorLogos?: CertificateSponsorLogo[];
}) {
  const frontRef = useRef<HTMLElement | null>(null);
  const backRef = useRef<HTMLElement | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "front" | "back" | null>(null);

  const baseName = useMemo(
    () => `${project.name} - ${record.studentName} - ${record.certificateNumber}`.replace(/[\\/:*?"<>|]+/g, "-"),
    [project.name, record.studentName, record.certificateNumber],
  );

  const downloadUrl = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  };

  const exportSheetAsImage = async (target: "front" | "back") => {
    const node = target === "front" ? frontRef.current : backRef.current;

    if (!node) return;

    setExporting(target);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      downloadUrl(dataUrl, `${baseName}-${target}.png`);
    } finally {
      setExporting(null);
    }
  };

  const exportAsPdf = async () => {
    if (!frontRef.current || !backRef.current) return;

    setExporting("pdf");
    try {
      const [frontUrl, backUrl] = await Promise.all([
        toPng(frontRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" }),
        toPng(backRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" }),
      ]);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(frontUrl, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.addPage();
      pdf.addImage(backUrl, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`${baseName}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prévia HTML</p>
          <h3 className="mt-1 text-[1rem] font-semibold">Pronta para conversão em PDF ou imagem</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => exportSheetAsImage("front")}
            disabled={exporting !== null}
          >
            <FileImage className="size-4" />
            Baixar frente PNG
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => exportSheetAsImage("back")}
            disabled={exporting !== null}
          >
            <Download className="size-4" />
            Baixar verso PNG
          </Button>
          <Button type="button" onClick={exportAsPdf} disabled={exporting !== null}>
            <FileDown className="size-4" />
            Baixar certificado
          </Button>
        </div>
      </div>
      <CertificateTemplatePreview
        project={project}
        template={template}
        record={record}
        settings={settings}
        sponsorLogos={sponsorLogos}
        frontRef={frontRef}
        backRef={backRef}
      />
    </div>
  );
}
