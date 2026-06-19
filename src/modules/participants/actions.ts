"use server";

import { participantSchema } from "./schemas";

export async function saveParticipant(formData: FormData) {
  const parsed = participantSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise o cadastro do participante.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return { ok: true, message: "Participante validado." };
}
