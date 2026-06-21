"use server";

import { settingsSectionSchema } from "./schemas";
import { getCurrentProfile } from "@/lib/auth/require-role";

export async function saveSettings(formData: FormData) {
  const profile = await getCurrentProfile();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return {
      ok: false,
      message: "Somente o Administrador Geral ou Super Admin pode alterar configurações.",
    };
  }

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
