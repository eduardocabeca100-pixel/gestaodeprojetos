"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText } from "lucide-react";

import { readStoredProjectDocuments } from "@/components/documents/local-document-store";
import { SectionCard } from "@/components/layout/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/format-date";
import type { ProjectDocument } from "@/modules/documents/types";

const CENTRAL_DOCUMENTS_UPDATED_EVENT = "viva:central-cultural-documents-updated";

export function DashboardDocuments({
  documents,
  projectId,
}: {
  documents: ProjectDocument[];
  projectId: string;
}) {
  const [localDocuments, setLocalDocuments] = useState<ProjectDocument[]>(documents);

  useEffect(() => {
    const refresh = () => {
      setLocalDocuments(readStoredProjectDocuments(projectId, documents));
    };

    refresh();
    window.addEventListener(CENTRAL_DOCUMENTS_UPDATED_EVENT, refresh as EventListener);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(CENTRAL_DOCUMENTS_UPDATED_EVENT, refresh as EventListener);
      window.removeEventListener("storage", refresh);
    };
  }, [documents, projectId]);

  const visibleDocuments = useMemo(
    () => localDocuments.filter((document) => document.status !== "Arquivado"),
    [localDocuments],
  );

  return (
    <SectionCard title="Documentos" description="Somente arquivos reais vinculados ao projeto.">
      {visibleDocuments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-muted-foreground">
          Nenhum documento cadastrado para este projeto ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleDocuments.slice(0, 5).map((document) => (
            <div
              key={document.id}
              className="flex items-center gap-3 rounded-[1.1rem] border border-white/80 bg-white/86 p-3 shadow-[0_18px_36px_-32px_rgba(99,102,241,0.34)]"
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
                  {document.linkedTo || document.category}
                  {document.expiresAt ? ` · vence ${formatDate(document.expiresAt)}` : ""}
                </p>
              </div>
              <StatusBadge value={document.status} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
