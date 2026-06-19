import { FileText } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/format-date";
import type { Report } from "@/modules/reports/types";

export function ReportCard({ report }: { report: Report }) {
  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <FileText className="size-5 text-primary" />
        <StatusBadge value={report.status} />
      </div>
      <h3 className="mt-3 font-semibold">{report.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{report.type}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        Gerado em {formatDate(report.generatedAt)} por {report.generatedBy}
      </p>
    </article>
  );
}
