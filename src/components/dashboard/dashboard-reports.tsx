import Link from "next/link";
import { FileArchive, FileDown } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Report } from "@/modules/reports/types";

export function DashboardReports({ reports }: { reports: Report[] }) {
  return (
    <SectionCard
      title="Relatórios"
      description="Dossiês e relatórios prontos para geração."
      actions={
        <Button asChild>
          <Link href="/relatorios">
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
            className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"
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
