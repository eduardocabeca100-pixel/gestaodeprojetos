"use server";

import { reportOptionsSchema } from "./schemas";

export async function generateReport(formData: FormData) {
  const parsed = reportOptionsSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise as opções do relatório.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return { ok: true, message: "Relatório pronto para geração." };
}
