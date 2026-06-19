"use server";

import { isBlockedVideo } from "@/lib/utils/file-validation";

import { mediaSchema } from "./schemas";

export async function saveMedia(formData: FormData) {
  const url = String(formData.get("url") ?? "");

  if (isBlockedVideo(url)) {
    return {
      ok: false,
      message: "Envie vídeos apenas como links externos.",
    };
  }

  const parsed = mediaSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os dados da mídia.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return { ok: true, message: "Mídia validada." };
}
