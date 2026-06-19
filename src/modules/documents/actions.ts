"use server";

import { isAllowedDocument, isBlockedVideo } from "@/lib/utils/file-validation";

import { documentSchema } from "./schemas";

export async function saveDocument(formData: FormData) {
  const fileName = String(formData.get("fileName") ?? "");

  if (isBlockedVideo(fileName)) {
    return {
      ok: false,
      message: "Vídeos não podem ser enviados diretamente ao sistema.",
    };
  }

  if (!isAllowedDocument(fileName)) {
    return {
      ok: false,
      message: "Formato não permitido para documentos.",
    };
  }

  const parsed = documentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os dados do documento.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    ok: true,
    message: "Documento validado para upload no bucket documents.",
  };
}
