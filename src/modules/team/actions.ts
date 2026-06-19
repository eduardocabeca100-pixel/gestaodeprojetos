"use server";

import { teamMemberSchema } from "./schemas";

export async function saveTeamMember(formData: FormData) {
  const parsed = teamMemberSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise o cadastro da equipe.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return { ok: true, message: "Integrante validado." };
}
