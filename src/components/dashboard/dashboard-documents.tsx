import { AlertTriangle, FileText } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/format-date";
import type { ProjectDocument } from "@/modules/documents/types";

export function DashboardDocuments({
  documents,
}: {
  documents: ProjectDocument[];
}) {
  return (
    <SectionCard
      title="Documentos"
      description="Habilitação, certidões e anexos críticos."
    >
      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {document.expiresAt ? (
                <AlertTriangle className="size-4" />
              ) : (
                <FileText className="size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{document.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {document.category}
                {document.expiresAt ? ` · vence ${formatDate(document.expiresAt)}` : ""}
              </p>
            </div>
            <StatusBadge value={document.status} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
