import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { canAccessEveryProject } from "@/lib/auth/permissions";
import { getCurrentProfile } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";

import type { Project, ProjectKpi, ProjectStatus } from "./types";

export const projects: Project[] = [
  {
    id: "refens",
    name: "Reféns",
    fullTitle: "Formação de Artistas de Rua e Montagem do Espetáculo Reféns",
    slug: "formacao-artistas-rua-espetaculo-refens",
    shortDescription:
      "Projeto de formação em teatro de rua, diário de classe, documentos oficiais, orçamento e montagem do espetáculo Reféns.",
    summary:
      "A proposta organiza 11 encontros formativos, diário de presença, documentação do edital, execução financeira detalhada, registros e certificação do percurso do espetáculo Reféns.",
    edital: "Circuito Catarinense de Cultura PNAB SC 2026",
    registrationNumber: "000937",
    approvedAmount: 50000,
    executedAmount: 0,
    status: "Classificado",
    currentStage: "Habilitação documental e organização de anexos",
    modality: "Ações de Qualificação e Formação",
    className: "Classe II",
    proponent: "Marcel Eduardo Cabeça Domingues",
    proponentDocument: "59.053.899/0001-53",
    city: "Jaraguá do Sul",
    state: "SC",
    startDate: "2026-08-01",
    endDate: "2027-07-31",
    coverUrl: null,
    bannerUrl: null,
    notes:
      "Baseado no edital Circuito Catarinense de Cultura PNAB SC 2026 e na planilha orçamentária oficial do projeto Reféns.",
    archived: false,
  },
];

type ProjectRow = {
  id: string;
  name: string;
  full_title: string;
  slug: string;
  short_description: string | null;
  summary: string | null;
  edital: string | null;
  registration_number: string | null;
  approved_amount: number | string | null;
  executed_amount: number | string | null;
  status: string | null;
  current_stage: string | null;
  modality: string | null;
  class_name: string | null;
  proponent: string | null;
  proponent_document: string | null;
  city: string | null;
  state: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_url: string | null;
  banner_url: string | null;
  notes: string | null;
  archived: boolean | null;
};

const projectSelect =
  "id, name, full_title, slug, short_description, summary, edital, registration_number, approved_amount, executed_amount, status, current_stage, modality, class_name, proponent, proponent_document, city, state, start_date, end_date, cover_url, banner_url, notes, archived";

function mapProjectRowToProject(project: ProjectRow): Project {
  return {
    id: project.id,
    name: project.name,
    fullTitle: project.full_title,
    slug: project.slug,
    shortDescription: project.short_description ?? "",
    summary: project.summary ?? "",
    edital: project.edital ?? "",
    registrationNumber: project.registration_number ?? "",
    approvedAmount: Number(project.approved_amount ?? 0),
    executedAmount: Number(project.executed_amount ?? 0),
    status: (project.status ?? "Planejamento") as ProjectStatus,
    currentStage: project.current_stage ?? "",
    modality: project.modality ?? "",
    className: project.class_name ?? "",
    proponent: project.proponent ?? "",
    proponentDocument: project.proponent_document ?? "",
    city: project.city ?? "",
    state: project.state ?? "",
    startDate: project.start_date ?? "",
    endDate: project.end_date ?? "",
    coverUrl: project.cover_url,
    bannerUrl: project.banner_url,
    notes: project.notes ?? "",
    archived: project.archived ?? false,
  };
}

function mapSeedProjectToInsert(project: Project) {
  return {
    name: project.name,
    full_title: project.fullTitle,
    slug: project.slug,
    short_description: project.shortDescription,
    summary: project.summary,
    edital: project.edital,
    registration_number: project.registrationNumber,
    approved_amount: project.approvedAmount,
    executed_amount: project.executedAmount,
    status: project.status,
    current_stage: project.currentStage,
    modality: project.modality,
    class_name: project.className,
    proponent: project.proponent,
    proponent_document: project.proponentDocument,
    city: project.city,
    state: project.state,
    start_date: project.startDate,
    end_date: project.endDate,
    cover_url: project.coverUrl,
    banner_url: project.bannerUrl,
    notes: project.notes,
    archived: project.archived,
  };
}

function normalizeProjectSlugs(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function isProjectMembershipsUnavailable(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.message?.includes("project_memberships") === true
  );
}

async function listProjectsBySlugs(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  projectSlugs: string[],
) {
  if (projectSlugs.length === 0) {
    return [];
  }

  const projectResult = await supabase
    .from("projects")
    .select(projectSelect)
    .in("slug", projectSlugs);

  if (projectResult.error) {
    return projects.filter((project) => projectSlugs.includes(project.slug));
  }

  if (!projectResult.data.length) {
    return projects.filter((project) => projectSlugs.includes(project.slug));
  }

  return projectResult.data.map((project) =>
    mapProjectRowToProject(project as ProjectRow),
  );
}

export const ensureSeedProjects = cache(async () => {
  if (!hasSupabaseServerEnv()) {
    return;
  }

  const admin = createAdminClient();

  if (!admin) {
    return;
  }

  const existingResult = await admin.from("projects").select("slug");

  if (existingResult.error) {
    throw new Error(existingResult.error.message);
  }

  const existingSlugs = new Set(
    existingResult.data.map((project) => project.slug),
  );
  const missingProjects = projects
    .filter((project) => !existingSlugs.has(project.slug))
    .map(mapSeedProjectToInsert);

  if (missingProjects.length === 0) {
    return;
  }

  const insertResult = await admin.from("projects").insert(missingProjects as never);

  if (insertResult.error) {
    throw new Error(insertResult.error.message);
  }
});

export const listProjects = cache(async () => {
  const profile = await getCurrentProfile();

  if (!profile) {
    return [];
  }

  if (!hasSupabaseServerEnv() || canAccessEveryProject(profile.role)) {
    if (!hasSupabaseServerEnv()) {
      return projects;
    }
  }

  await ensureSeedProjects();

  const supabase = await createClient();

  if (!supabase) {
    return projects;
  }

  if (canAccessEveryProject(profile.role)) {
    const projectResult = await supabase
      .from("projects")
      .select(projectSelect)
      .order("name");

    if (projectResult.error) {
      return projects;
    }

    if (!projectResult.data.length) {
      return projects;
    }

    return projectResult.data.map((project) =>
      mapProjectRowToProject(project as ProjectRow),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const metadataProjectSlugs = normalizeProjectSlugs(
    user?.user_metadata?.projectSlugs ?? user?.user_metadata?.project_slugs,
  );

  const membershipResult = await supabase
    .from("project_memberships")
    .select("project_id")
    .eq("profile_id", profile.id);

  if (membershipResult.error) {
    if (isProjectMembershipsUnavailable(membershipResult.error)) {
      return listProjectsBySlugs(supabase, metadataProjectSlugs);
    }

    return [];
  }

  if (!membershipResult.data?.length) {
    return listProjectsBySlugs(supabase, metadataProjectSlugs);
  }

  const projectIds = membershipResult.data.map((membership) => membership.project_id);
  const projectResult = await supabase
    .from("projects")
    .select(projectSelect)
    .in("id", projectIds);

  if (projectResult.error) {
    return listProjectsBySlugs(supabase, metadataProjectSlugs);
  }

  const scopedProjects = projectResult.data.map((project) =>
    mapProjectRowToProject(project as ProjectRow),
  );

  if (scopedProjects.length === 0) {
    return listProjectsBySlugs(supabase, metadataProjectSlugs);
  }

  return scopedProjects;
});

export const getFeaturedProject = cache(async () => {
  const [project] = await listProjects();

  if (!project) {
    redirect("/acesso-negado?motivo=sem-projeto");
  }

  return project;
});

export const getProjectById = cache(async (id: string) => {
  const accessibleProjects = await listProjects();

  return accessibleProjects.find(
    (project) => project.id === id || project.slug === id,
  );
});

export async function getProjectKpis(): Promise<ProjectKpi[]> {
  const accessibleProjects = await listProjects();
  const activeProjects = accessibleProjects.filter((project) => !project.archived);
  const approvedTotal = activeProjects.reduce(
    (total, project) => total + project.approvedAmount,
    0,
  );
  const executedTotal = activeProjects.reduce(
    (total, project) => total + project.executedAmount,
    0,
  );

  return [
    {
      label: "Projetos ativos",
      value: String(activeProjects.length),
      helper: "Projetos em acompanhamento",
      tone: "purple",
    },
    {
      label: "Valor aprovado total",
      value: formatCurrency(approvedTotal),
      helper: "Somatório dos projetos",
      tone: "green",
    },
    {
      label: "Valor executado",
      value: formatCurrency(executedTotal),
      helper: "Lançado no financeiro",
      tone: "amber",
    },
    {
      label: "A prestar contas",
      value: formatCurrency(approvedTotal - executedTotal),
      helper: "Saldo documental/financeiro",
      tone: "cyan",
    },
  ];
}
