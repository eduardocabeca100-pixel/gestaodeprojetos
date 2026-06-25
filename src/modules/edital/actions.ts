"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/require-role";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

import {
  buildEditalStoragePath,
  encodeEditalAttachmentNotes,
  mapDocumentRowToEditalAttachment,
  type EditalDocumentRow,
} from "./storage";
import {
  normalizeEditalAttachmentKind,
  normalizeEditalAttachmentStatus,
  type EditalAttachment,
} from "./types";

type EditalActionResult = {
  ok: boolean;
  message: string;
  attachment?: EditalAttachment;
};

const editalDocumentSelect =
  "id, project_id, activity_id, participant_id, team_member_id, file_name, storage_path, category, uploaded_by, uploaded_at, expires_at, notes, status, archived";

function getRequiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function buildFallbackFileName(title: string) {
  return `${title.trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;
}

function revalidateEditalPages() {
  revalidatePath("/edital", "page");
  revalidatePath("/dashboard", "page");
}

export async function saveEditalAttachment(formData: FormData): Promise<EditalActionResult> {
  if (!hasSupabaseServerEnv()) {
    return {
      ok: false,
      message: "Supabase não está configurado. Configure as variáveis de ambiente para salvar de verdade.",
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Não foi possível conectar ao Supabase.",
    };
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      ok: false,
      message: "Faça login novamente para salvar este arquivo.",
    };
  }

  const projectId = getRequiredString(formData, "projectId");
  const attachmentId = getRequiredString(formData, "id");
  const title = getRequiredString(formData, "title");
  const kind = normalizeEditalAttachmentKind(getRequiredString(formData, "kind"));
  const status = normalizeEditalAttachmentStatus(getRequiredString(formData, "status"));
  const notes = getRequiredString(formData, "notes");
  const fileName = getRequiredString(formData, "fileName") || buildFallbackFileName(title);

  if (!projectId) {
    return {
      ok: false,
      message: "Projeto não identificado. Troque o projeto e tente novamente.",
    };
  }

  if (!title) {
    return {
      ok: false,
      message: "Digite um título para o anexo.",
    };
  }

  const payload = {
    project_id: projectId,
    file_name: fileName,
    storage_path: buildEditalStoragePath(projectId, fileName),
    category: kind,
    uploaded_by: profile.id,
    notes: encodeEditalAttachmentNotes({
      title,
      notes,
      uploadedBy: profile.name,
      kind,
      status,
    }),
    status,
    archived: false,
  };

  const documents = (supabase as any).from("documents");

  let savedRow: EditalDocumentRow | null = null;

  if (attachmentId && /^[0-9a-fA-F-]{36}$/.test(attachmentId)) {
    const { data, error } = await documents
      .update(payload)
      .eq("id", attachmentId)
      .eq("project_id", projectId)
      .select(editalDocumentSelect)
      .maybeSingle();

    if (error) {
      console.error("saveEditalAttachment update failed", error);
      return {
        ok: false,
        message: "Erro ao atualizar no banco. O arquivo não foi gravado.",
      };
    }

    savedRow = data as EditalDocumentRow | null;
  }

  if (!savedRow) {
    const { data, error } = await documents
      .insert({ ...payload, uploaded_at: new Date().toISOString() })
      .select(editalDocumentSelect)
      .single();

    if (error) {
      console.error("saveEditalAttachment insert failed", error);
      return {
        ok: false,
        message: "Erro ao salvar no banco. O arquivo não foi gravado.",
      };
    }

    savedRow = data as EditalDocumentRow;
  }

  const attachment = mapDocumentRowToEditalAttachment(savedRow);
  revalidateEditalPages();

  return {
    ok: true,
    message: attachmentId ? "Arquivo atualizado no banco." : "Arquivo salvo no banco.",
    attachment,
  };
}

export async function deleteEditalAttachment(
  attachmentId: string,
  projectId: string,
): Promise<EditalActionResult> {
  if (!hasSupabaseServerEnv()) {
    return {
      ok: false,
      message: "Supabase não está configurado. Configure as variáveis de ambiente para excluir de verdade.",
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Não foi possível conectar ao Supabase.",
    };
  }

  if (!attachmentId || !projectId) {
    return {
      ok: false,
      message: "Arquivo ou projeto não identificado.",
    };
  }

  if (!/^[0-9a-fA-F-]{36}$/.test(attachmentId)) {
    revalidateEditalPages();

    return {
      ok: true,
      message: "Arquivo removido da tela. Como era um item antigo de demonstração, ele não existia no banco.",
    };
  }

  const { error } = await (supabase as any)
    .from("documents")
    .delete()
    .eq("id", attachmentId)
    .eq("project_id", projectId);

  if (error) {
    console.error("deleteEditalAttachment failed", error);
    return {
      ok: false,
      message: "Erro ao excluir no banco. O arquivo não foi removido.",
    };
  }

  revalidateEditalPages();

  return {
    ok: true,
    message: "Arquivo excluído definitivamente do banco.",
  };
}
