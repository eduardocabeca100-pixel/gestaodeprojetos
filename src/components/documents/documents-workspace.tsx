"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Archive, FileCheck2 } from "lucide-react";

import { DocumentCategoryCard } from "@/components/documents/document-category-card";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentPreview } from "@/components/documents/document-preview";
import { DocumentUpload } from "@/components/documents/document-upload";
import { SectionCard } from "@/components/layout/section-card";
import type { Project } from "@/modules/projects/types";
import type { ProjectDocument } from "@/modules/documents/types";

function getStatusCounts(documents: ProjectDocument[]) {
  const valid = documents.filter((document) => document.status === "Válido").length;
  const alert = documents.filter(
    (document) => document.expiresAt || document.status === "Pendente",
  ).length;
  const archived = documents.filter((document) => document.status === "Arquivado").length;

  return { valid, alert, archived };
}

export function DocumentsWorkspace({
  project,
  documents,
}: {
  project: Project;
  documents: ProjectDocument[];
}) {
  const [items, setItems] = useState(documents);
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");
  const selectedDocument = useMemo(
    () => items.find((document) => document.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );
  const counts = getStatusCounts(items);

  function handleView(document: ProjectDocument) {
    setSelectedId(document.id);
  }

  function handleDelete(documentId: string) {
    setItems((current) => {
      const next = current.filter((document) => document.id !== documentId);

      if (selectedId === documentId) {
        setSelectedId(next[0]?.id ?? "");
      }

      return next;
    });
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <DocumentCategoryCard
          title="Documentos válidos"
          count={counts.valid}
          icon={FileCheck2}
          tone="bg-emerald-50 text-emerald-700"
        />
        <DocumentCategoryCard
          title="Alertas de validade"
          count={counts.alert}
          icon={AlertTriangle}
          tone="bg-amber-50 text-amber-700"
        />
        <DocumentCategoryCard
          title="Arquivados"
          count={counts.archived}
          icon={Archive}
          tone="bg-slate-50 text-slate-700"
        />
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
        <SectionCard
          title="Lista de documentos"
          description={`Busca, visualização e exclusão dos arquivos do projeto ${project.name}.`}
        >
          <DocumentList documents={items} onView={handleView} onDelete={handleDelete} />
        </SectionCard>
        <SectionCard title="Upload">
          <DocumentUpload project={project} />
        </SectionCard>
      </div>

      <DocumentPreview document={selectedDocument} />
    </>
  );
}
