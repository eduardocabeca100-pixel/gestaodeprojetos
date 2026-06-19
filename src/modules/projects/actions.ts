"use server";

import { projectSchema } from "./schemas";

export type ProjectActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

export async function saveProject(
  _state: ProjectActionState | undefined,
  formData: FormData,
): Promise<ProjectActionState> {
  const values = Object.fromEntries(formData);
  const parsed = projectSchema.safeParse({
    ...values,
    approvedAmount: Number(values.approvedAmount ?? 0),
    executedAmount: Number(values.executedAmount ?? 0),
    archived: values.archived === "true" || values.archived === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos obrigatórios do projeto.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    ok: true,
    message:
      "Projeto validado. Conecte esta action ao Supabase para persistir os dados.",
  };
}

export async function archiveProject(projectId: string) {
  return {
    ok: true,
    message: `Projeto ${projectId} marcado para arquivamento lógico.`,
  };
}
