import { FileText } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/format-date";
import type { OfficialDocument } from "@/modules/official-documents/types";

export function SavedOfficialDocuments({
  documents,
}: {
  documents: OfficialDocument[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {documents.map((document) => (
        <article
          key={document.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-white p-4"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{document.title}</p>
              <StatusBadge value={document.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {document.template} · {document.code} · {formatDate(document.date)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
