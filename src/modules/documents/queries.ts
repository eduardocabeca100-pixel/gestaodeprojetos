import "server-only";

import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

import {
  documentCategories,
  documentStatuses,
  type DocumentCategory,
  type DocumentStatus,
  type ProjectDocument,
} from "./types";

type DocumentRow = {
  id: string;
  project_id: string;
  file_name: string;
  category: string;
  uploaded_by: string | null;
  uploaded_at: string;
  expires_at: string | null;
  notes: string | null;
  status: string;
  archived: boolean;
};

function normalizeCategory(value: string | null): DocumentCategory {
  return documentCategories.includes(value as DocumentCategory)
    ? (value as DocumentCategory)
    : "Outros";
}

function normalizeStatus(value: string | null): DocumentStatus {
  return documentStatuses.includes(value as DocumentStatus)
    ? (value as DocumentStatus)
    : "Pendente";
}

function mapDocument(row: DocumentRow): ProjectDocument {
  return {
    id: row.id,
    fileName: row.file_name,
    category: normalizeCategory(row.category),
    projectId: row.project_id,
    linkedTo: row.category || "Documento do projeto",
    uploadedAt: row.uploaded_at?.slice(0, 10) ?? "",
    uploadedBy: row.uploaded_by ?? "Equipe do projeto",
    expiresAt: row.expires_at,
    notes: row.notes ?? "",
    status: normalizeStatus(row.status),
  };
}

export async function listDocuments(projectId?: string) {
  if (!projectId || !hasSupabaseServerEnv()) {
    return [] satisfies ProjectDocument[];
  }

  const supabase = await createClient();

  if (!supabase) {
    return [] satisfies ProjectDocument[];
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, project_id, file_name, category, uploaded_by, uploaded_at, expires_at, notes, status, archived")
    .eq("project_id", projectId)
    .eq("archived", false)
    .order("uploaded_at", { ascending: false });

  if (error || !data) {
    console.error("listDocuments failed", error);
    return [] satisfies ProjectDocument[];
  }

  return (data as DocumentRow[]).map(mapDocument);
}

export async function listExpiringDocuments(projectId?: string) {
  const documents = await listDocuments(projectId);
  return documents.filter((document) => document.expiresAt);
}
