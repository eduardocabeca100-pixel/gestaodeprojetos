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
      message: "Supabase não configurado no servidor.",
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
      message: "Cliente Supabase não inicializado.",
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
      message: result.error?.message ?? "Não foi possível salvar o projeto.",
    };
  }

  const savedProject = result.data as { id: string; slug: string };

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



export async function deleteProject(projectId: string) {
  if (!projectId) {
    return { ok: false, message: "Projeto não identificado." };
  }

  if (!hasSupabaseServerEnv()) {
    return { ok: false, message: "Supabase não configurado." };
  }

  const profile = await getCurrentProfile();

  if (!profile || !can(profile.role, "archive_project")) {
    return { ok: false, message: "Você não tem permissão para excluir projetos." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { ok: false, message: "Cliente Supabase não inicializado." };
  }

  const tablesToClean = [
    "expenses",
    "attendance",
    "classes",
    "activities",
    "documents",
    "media",
    "participants",
    "team_members",
    "budget_items",
    "reports",
    "official_documents",
    "project_stages",
    "project_memberships",
  ];

  for (const table of tablesToClean) {
    const result = await (supabase as any).from(table).delete().eq("project_id", projectId);

    if (
      result.error &&
      result.error.code !== "PGRST205" &&
      !String(result.error.message ?? "").includes("Could not find")
    ) {
      console.error(`deleteProject ${table} failed`, result.error);
      return {
        ok: false,
        message: `Não consegui limpar os dados de ${table}. A exclusão foi interrompida.`,
      };
    }
  }

  const result = await supabase.from("projects").delete().eq("id", projectId);

  if (result.error) {
    return {
      ok: false,
      message: result.error.message,
    };
  }

  revalidatePath("/dashboard", "page");
  revalidatePath("/projetos", "page");
  revalidatePath("/projetos/selecionar", "page");

  return {
    ok: true,
    message: "Projeto excluído definitivamente.",
  };
}
