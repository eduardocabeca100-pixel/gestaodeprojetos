import Link from "next/link";
import { FileArchive, FileDown } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Report } from "@/modules/reports/types";

export function DashboardReports({
  projectId,
  reports,
}: {
  projectId: string;
  reports: Report[];
}) {
  return (
    <SectionCard
      title="Relatórios"
      description="Dossiês e relatórios prontos para geração."
      actions={
        <Button asChild className="rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-white shadow-[0_18px_36px_-26px_rgba(79,70,229,0.65)]">
          <Link href={`/relatorios?project=${projectId}`}>
            <FileDown className="size-4" />
            Gerar PDF
          </Link>
        </Button>
      }
    >
      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex items-center gap-3 rounded-[1.1rem] border border-white/80 bg-white/86 p-3 shadow-[0_18px_36px_-32px_rgba(245,158,11,0.34)]"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <FileArchive className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{report.title}</p>
              <p className="text-xs text-muted-foreground">{report.type}</p>
            </div>
            <StatusBadge value={report.status} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
