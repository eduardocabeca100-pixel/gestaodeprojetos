"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/permissions";
import { getCurrentProfile } from "@/lib/auth/require-role";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

import { projectSchema, type ProjectFormValues } from "./schemas";

export type ProjectActionState = {
  ok: boolean;
  message: string;
  projectId?: string;
  projectSlug?: string;
  errors?: Record<string, string[] | undefined>;
};

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function projectPayload(values: ProjectFormValues, formData: FormData) {
  return {
    name: values.name,
    full_title: values.fullTitle,
    slug: values.slug,
    short_description: values.shortDescription,
    summary: values.summary,
    edital: values.edital,
    registration_number: values.registrationNumber,
    approved_amount: values.approvedAmount,
    executed_amount: values.executedAmount,
    status: values.status,
    current_stage: values.currentStage,
    modality: values.modality,
    class_name: values.className,
    proponent: values.proponent,
    proponent_document: values.proponentDocument,
    city: values.city,
    state: values.state,
    start_date: values.startDate,
    end_date: values.endDate,
    cover_url: nullableText(formData.get("coverUrl")),
    banner_url: nullableText(formData.get("bannerUrl")),
    notes: values.notes ?? "",
    archived: Boolean(values.archived),
  };
}

async function persistSelectedTeam(projectId: string, formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  const selectedIds = formData
    .getAll("selectedTeamRosterIds")
    .map(String)
    .filter(Boolean);

  if (selectedIds.length === 0) {
    return;
  }

  const rosterResult = await supabase
    .from("team_roster")
    .select("id")
    .in("id", selectedIds);

  if (rosterResult.error || !rosterResult.data?.length) {
    return;
  }

  const rosterRows = (rosterResult.data ?? []) as Array<{ id: string }>;
  const payload = rosterRows.map((member) => ({
    team_roster_id: member.id,
    project_id: projectId,
    expected_amount: 0,
    paid_amount: 0,
    payment_status: "Previsto",
    notes: "Selecionado no cadastro do projeto.",
  }));

  await supabase
    .from("team_roster_assignments")
    .upsert(payload as never, { onConflict: "team_roster_id,project_id" });
}

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

  if (!hasSupabaseServerEnv()) {
    return {
      ok: false,
      message: "Supabase não configurado no servidor. Confira NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const profile = await getCurrentProfile();

  if (!profile || !can(profile.role, "edit_project")) {
    return {
      ok: false,
      message: "Você não tem permissão para salvar projetos.",
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Cliente Supabase não foi inicializado.",
    };
  }

  const projectId = nullableText(formData.get("projectId"));
  const payload = projectPayload(parsed.data, formData);

  const result = projectId
    ? await supabase
        .from("projects")
        .update(payload as never)
        .eq("id", projectId)
        .select("id, slug")
        .single()
    : await supabase
        .from("projects")
        .insert({ ...payload, created_by: profile.id } as never)
        .select("id, slug")
        .single();

  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.error?.message ?? "Não foi possível salvar o projeto no Supabase.",
    };
  }

  const savedProject = result.data as { id: string; slug: string };

  await persistSelectedTeam(savedProject.id, formData);

  revalidatePath("/dashboard", "page");
  revalidatePath("/projetos", "page");
  revalidatePath(`/projetos/${savedProject.id}`, "page");
  revalidatePath(`/projetos/${savedProject.slug}`, "page");

  return {
    ok: true,
    projectId: savedProject.id,
    projectSlug: savedProject.slug,
    message: projectId ? "Projeto atualizado com sucesso." : "Projeto criado com sucesso.",
  };
}

export async function archiveProject(projectId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase não configurado.",
    };
  }

  const result = await supabase
    .from("projects")
    .update({ archived: true } as never)
    .eq("id", projectId);

  if (result.error) {
    return {
      ok: false,
      message: result.error.message,
    };
  }

  revalidatePath("/dashboard", "page");
  revalidatePath("/projetos", "page");

  return {
    ok: true,
    message: `Projeto ${projectId} arquivado.`,
  };
}
