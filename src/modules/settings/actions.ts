"use server";

import { settingsSectionSchema } from "./schemas";

export async function saveSettings(formData: FormData) {
  const fields = String(formData.get("fields") ?? "[]");
  const parsed = settingsSectionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    fields: JSON.parse(fields),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise as configurações.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return { ok: true, message: "Configurações validadas." };
}
