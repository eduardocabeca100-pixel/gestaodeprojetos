"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/permissions";
import { getCurrentProfile } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStage, ProjectStatus } from "@/modules/projects/types";

const allowedStages: ProjectStage[] = [
  "Avaliação",
  "Habilitação",
  "Assinatura do termo",
  "Repasse",
  "Execução",
  "Prestação de contas",
];

const stageToStatus: Record<ProjectStage, ProjectStatus> = {
  Avaliação: "Em avaliação",
  Habilitação: "Em habilitação",
  "Assinatura do termo": "Aguardando termo",
  Repasse: "Aguardando repasse",
  Execução: "Em execução",
  "Prestação de contas": "Prestação de contas",
};

export async function updateProjectStage(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const rawStage = String(formData.get("stage") ?? "").trim();
  const stage = allowedStages.find((item) => item === rawStage);

  if (!projectId || !stage) {
    return;
  }

  const profile = await getCurrentProfile();

  if (!profile || !can(profile.role, "edit_project")) {
    return;
  }

  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  const result = await supabase
    .from("projects")
    .update({
      current_stage: stage,
      status: stageToStatus[stage],
    } as never)
    .eq("id", projectId)
    .select("id, slug")
    .single();

  if (result.error || !result.data) {
    return;
  }

  const savedProject = result.data as { id: string; slug?: string | null };

  revalidatePath("/dashboard", "page");
  revalidatePath("/projetos", "page");
  revalidatePath(`/projetos/${savedProject.id}`, "page");

  if (savedProject.slug) {
    revalidatePath(`/projetos/${savedProject.slug}`, "page");
  }
}
