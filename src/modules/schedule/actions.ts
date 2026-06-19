"use server";

import { activitySchema } from "./schemas";

export async function saveActivity(formData: FormData) {
  const parsed = activitySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os dados da atividade.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    ok: true,
    message: "Atividade validada para gravação no cronograma.",
  };
}
