"use client";

import { projectScopedKey } from "@/lib/project-scope";
import type { ProjectDocument } from "@/modules/documents/types";

const STORAGE_KEY_BASE = "viva:project-documents:v1";
const CENTRAL_STORAGE_KEY_BASE = "viva:central-cultural:documents:v1";

type CentralDocumentFile = {
  id: string;
  sourceId?: string;
  name: string;
  category: string;
  status: string;
  validUntil: string;
  notes: string;
  fileName?: string;
  uploadedAt?: string;
  fileDataUrl?: string;
};

const legacyPlaceholderIds = new Set([
  "doc-cartao-cnpj",
  "doc-certidao-federal",
  "doc-certidao-estadual",
  "doc-certidao-municipal",
]);

function isLegacyPlaceholder(document: CentralDocumentFile) {
  return (
    legacyPlaceholderIds.has(document.id) &&
    !document.fileDataUrl &&
    !document.fileName &&
    !document.notes &&
    document.status === "Pendente"
  );
}

function normalizeStatus(status: string): ProjectDocument["status"] {
  if (status === "Aprovado" || status === "Enviado") return "Válido";
  if (status === "Vencido") return "Vencido";
  if (status === "Precisa corrigir" || status === "Pendente") return "Pendente";
  return "Pendente";
}

function readCentralDocuments(projectId: string): ProjectDocument[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(
      projectScopedKey(CENTRAL_STORAGE_KEY_BASE, projectId),
    );

    if (saved === null) {
      return null;
    }

    const parsed = JSON.parse(saved) as CentralDocumentFile[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((document) => !isLegacyPlaceholder(document))
      .map((document) => ({
        id: document.id,
        fileName: document.fileName || document.name,
        category: "Outros",
        projectId,
        linkedTo: document.category || "Documento do projeto",
        uploadedAt: document.uploadedAt?.slice(0, 10) ?? "",
        uploadedBy: "Equipe do projeto",
        expiresAt: document.validUntil || null,
        notes: document.notes || document.category || "",
        status: normalizeStatus(document.status),
      }));
  } catch {
    return null;
  }
}

export function readStoredProjectDocuments(
  projectId: string,
  fallback: ProjectDocument[],
): ProjectDocument[] {
  if (typeof window === "undefined") {
    return fallback;
  }

  const centralDocuments = readCentralDocuments(projectId);

  if (centralDocuments !== null) {
    return centralDocuments;
  }

  try {
    const saved = window.localStorage.getItem(projectScopedKey(STORAGE_KEY_BASE, projectId));

    if (!saved) {
      return fallback;
    }

    const parsed = JSON.parse(saved) as ProjectDocument[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredProjectDocuments(
  projectId: string,
  documents: ProjectDocument[],
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    projectScopedKey(STORAGE_KEY_BASE, projectId),
    JSON.stringify(documents),
  );
}
