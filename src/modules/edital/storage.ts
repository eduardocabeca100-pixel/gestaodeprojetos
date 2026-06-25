import {
  editalAttachmentKinds,
  normalizeEditalAttachmentKind,
  normalizeEditalAttachmentStatus,
  type EditalAttachment,
  type EditalAttachmentKind,
  type EditalAttachmentStatus,
} from "./types";

export const editalDocumentCategories = [
  "Edital e anexos",
  ...editalAttachmentKinds,
] as const;

export type EditalDocumentRow = {
  id: string;
  project_id: string;
  activity_id: string | null;
  participant_id: string | null;
  team_member_id: string | null;
  file_name: string;
  storage_path: string;
  category: string;
  uploaded_by: string | null;
  uploaded_at: string;
  expires_at: string | null;
  notes: string | null;
  status: string;
  archived: boolean;
};

type StoredEditalNotes = {
  vivaEditalAttachment?: true;
  title?: string;
  notes?: string;
  uploadedBy?: string;
  kind?: string;
  status?: string;
};

export function encodeEditalAttachmentNotes({
  title,
  notes,
  uploadedBy,
  kind,
  status,
}: {
  title: string;
  notes: string;
  uploadedBy: string;
  kind: EditalAttachmentKind;
  status: EditalAttachmentStatus;
}) {
  return JSON.stringify({
    vivaEditalAttachment: true,
    title,
    notes,
    uploadedBy,
    kind,
    status,
  } satisfies StoredEditalNotes);
}

function decodeStoredNotes(notes: string | null): StoredEditalNotes | null {
  if (!notes) {
    return null;
  }

  try {
    const parsed = JSON.parse(notes) as StoredEditalNotes;

    if (parsed?.vivaEditalAttachment) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function prettifyFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");

  return withoutExtension
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildEditalStoragePath(projectId: string, fileName: string) {
  const safeProjectId = projectId.replace(/[^a-zA-Z0-9-]/g, "-");
  const safeFileName = fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  return `edital/${safeProjectId}/${safeFileName || "arquivo.pdf"}`;
}

export function mapDocumentRowToEditalAttachment(row: EditalDocumentRow): EditalAttachment {
  const storedNotes = decodeStoredNotes(row.notes);
  const title = storedNotes?.title?.trim() || prettifyFileName(row.file_name);
  const notes = storedNotes?.notes ?? row.notes ?? "";
  const uploadedBy = storedNotes?.uploadedBy?.trim() || "Equipe VIVA";

  return {
    id: row.id,
    projectId: row.project_id,
    kind: normalizeEditalAttachmentKind(storedNotes?.kind ?? row.category),
    title,
    fileName: row.file_name,
    uploadedAt: row.uploaded_at?.slice(0, 10) ?? "",
    uploadedBy,
    status: normalizeEditalAttachmentStatus(storedNotes?.status ?? row.status),
    notes,
  };
}
