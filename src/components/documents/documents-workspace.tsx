"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Archive, FileCheck2 } from "lucide-react";

import { DocumentCategoryCard } from "@/components/documents/document-category-card";
import { DocumentList } from "@/components/documents/document-list";
import {
  readStoredProjectDocuments,
  writeStoredProjectDocuments,
} from "@/components/documents/local-document-store";
import { DocumentPreview } from "@/components/documents/document-preview";
import {
  DocumentUpload,
  type UploadedDocumentDraft,
} from "@/components/documents/document-upload";
import { SectionCard } from "@/components/layout/section-card";
import { useClientReady } from "@/lib/use-client-ready";
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
  const isClient = useClientReady();

  if (!isClient) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando documentos do projeto...
      </div>
    );
  }

  return <DocumentsWorkspaceContent key={project.id} project={project} documents={documents} />;
}

function DocumentsWorkspaceContent({
  project,
  documents,
}: {
  project: Project;
  documents: ProjectDocument[];
}) {
  const initialItems = useMemo(
    () => readStoredProjectDocuments(project.id, documents),
    [documents, project.id],
  );
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0]?.id ?? "");
  const selectedDocument = useMemo(
    () => items.find((document) => document.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );
  const counts = getStatusCounts(items);

  function commit(next: ProjectDocument[]) {
    setItems(next);
    writeStoredProjectDocuments(project.id, next);
  }

  function handleView(document: ProjectDocument) {
    setSelectedId(document.id);
  }

  function handleDelete(documentId: string) {
    const next = items.filter((document) => document.id !== documentId);
    commit(next);

    if (selectedId === documentId) {
      setSelectedId(next[0]?.id ?? "");
    }
  }

  function handleUpload(newDocuments: UploadedDocumentDraft[]) {
    const uploadedDocuments: ProjectDocument[] = newDocuments.map((document, index) => ({
      ...document,
      id: `${project.id}-local-doc-${Date.now()}-${index}`,
    }));
    const next = [...uploadedDocuments, ...items];

    commit(next);
    setSelectedId(uploadedDocuments[0]?.id ?? selectedId);
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
          <DocumentUpload project={project} onUpload={handleUpload} />
        </SectionCard>
      </div>

      <DocumentPreview document={selectedDocument} />
    </>
  );
}
