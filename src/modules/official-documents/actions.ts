"use server";

import { officialDocumentSchema } from "./schemas";

export async function saveOfficialDocument(formData: FormData) {
  const parsed = officialDocumentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os dados do documento oficial.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    ok: true,
    message: "Documento oficial validado para salvar/exportar.",
  };
}
