#!/usr/bin/env bash
set -euo pipefail

echo "================================================="
echo " Corrigindo editar projeto + foto/capa + banner"
echo "================================================="

if [ ! -f package.json ]; then
  echo "ERRO: rode este script na raiz do projeto, onde está o package.json."
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".backup-foto-projeto-$TS"
mkdir -p "$BACKUP_DIR"

for file in \
  src/components/projects/project-cover-upload.tsx \
  src/components/projects/project-banner-upload.tsx \
  src/components/projects/project-media-upload.tsx \
  src/components/projects/project-form.tsx \
  src/modules/projects/actions.ts \
  src/components/dashboard/project-stages-panel.tsx \
  "src/app/(protected)/dashboard/page.tsx" \
  "src/app/(protected)/projetos/novo/page.tsx" \
  "src/app/(protected)/projetos/[id]/page.tsx"
do
  [ -f "$file" ] && cp "$file" "$BACKUP_DIR/$(basename "$file").backup"
done

mkdir -p src/components/projects
mkdir -p supabase/migrations

echo "Criando componente real de upload de imagem..."

cat > src/components/projects/project-media-upload.tsx <<'TSEOF'
"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type ProjectMediaUploadProps = {
  title: string;
  description: string;
  bucket: "project-covers" | "project-banners";
  fieldName: "coverUrl" | "bannerUrl";
  initialUrl?: string | null;
  formId?: string;
  projectId?: string | null;
  accent?: "primary" | "cyan";
};

function safeFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "jpg";
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 64);

  return `${base || "imagem"}-${Date.now()}.${extension}`;
}

export function ProjectMediaUpload({
  title,
  description,
  bucket,
  fieldName,
  initialUrl = null,
  formId = "project-form",
  projectId = null,
  accent = "primary",
}: ProjectMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(initialUrl ?? "");
  const [status, setStatus] = useState(initialUrl ? "Imagem carregada." : "Nenhuma imagem escolhida.");
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Escolha uma imagem JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus("A imagem precisa ter no máximo 10 MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setStatus("Enviando imagem...");

    try {
      const supabase = createClient();

      if (!supabase) {
        setStatus("Supabase não configurado no navegador. Confira NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return;
      }

      const folder = projectId ? projectId : "drafts";
      const path = `${folder}/${safeFileName(file.name)}`;

      const result = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (result.error) {
        setStatus(result.error.message || "Não foi possível enviar a imagem.");
        return;
      }

      const publicUrl = supabase.storage.from(bucket).getPublicUrl(result.data.path).data.publicUrl;

      setUrl(publicUrl);
      setPreviewUrl(publicUrl);
      setStatus("Imagem enviada. Agora clique em Salvar projeto para gravar.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-white p-4 text-sm soft-shadow">
      <input type="hidden" name={fieldName} value={url} form={formId} />

      <div className="mb-3 flex items-start gap-3">
        <div className={accent === "cyan" ? "text-cyan-600" : "text-primary"}>
          <Upload className="size-5" />
        </div>

        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
      </div>

      {previewUrl ? (
        <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="mb-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground">
          <ImagePlus className="mr-2 size-5" />
          Prévia da imagem
        </div>
      )}

      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {url ? "Trocar imagem" : "Selecionar imagem"}
        </Button>

        {url ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setUrl("");
              setPreviewUrl("");
              setStatus("Imagem removida. Clique em Salvar projeto para gravar.");
            }}
          >
            Remover
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">{status}</p>
    </div>
  );
}
TSEOF

cat > src/components/projects/project-cover-upload.tsx <<'TSEOF'
import { ProjectMediaUpload } from "./project-media-upload";

export function ProjectCoverUpload({
  initialUrl,
  formId,
  projectId,
}: {
  initialUrl?: string | null;
  formId?: string;
  projectId?: string | null;
}) {
  return (
    <ProjectMediaUpload
      title="Foto/capa do projeto"
      description="Imagem principal do card e do topo do projeto."
      bucket="project-covers"
      fieldName="coverUrl"
      initialUrl={initialUrl}
      formId={formId}
      projectId={projectId}
    />
  );
}
TSEOF

cat > src/components/projects/project-banner-upload.tsx <<'TSEOF'
import { ProjectMediaUpload } from "./project-media-upload";

export function ProjectBannerUpload({
  initialUrl,
  formId,
  projectId,
}: {
  initialUrl?: string | null;
  formId?: string;
  projectId?: string | null;
}) {
  return (
    <ProjectMediaUpload
      title="Banner interno"
      description="Banner de destaque usado nas páginas internas."
      bucket="project-banners"
      fieldName="bannerUrl"
      initialUrl={initialUrl}
      formId={formId}
      projectId={projectId}
      accent="cyan"
    />
  );
}
TSEOF

echo "Corrigindo action para salvar foto/capa e banner no projeto..."

cat > src/modules/projects/actions.ts <<'TSEOF'
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
TSEOF

echo "Corrigindo formulário para salvar no Supabase..."

cat > src/components/projects/project-form.tsx <<'TSEOF'
"use client";

import { startTransition, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { generateSlug } from "@/lib/utils/generate-slug";
import { saveProject, type ProjectActionState } from "@/modules/projects/actions";
import { projectSchema, type ProjectFormValues } from "@/modules/projects/schemas";
import { projectStatuses, type Project } from "@/modules/projects/types";

const defaultProjectValues: ProjectFormValues = {
  name: "Reféns",
  fullTitle: "Formação de Artistas de Rua e Montagem do Espetáculo Reféns",
  slug: "formacao-artistas-rua-espetaculo-refens",
  shortDescription:
    "Formação de artistas de rua com diário de classe, documentação oficial, execução financeira e montagem do espetáculo Reféns.",
  summary:
    "Projeto de formação em teatro de rua com 11 encontros, controle de presença, documentação do edital, planilha orçamentária e prestação de contas.",
  edital: "Circuito Catarinense de Cultura PNAB SC 2026",
  registrationNumber: "000937",
  approvedAmount: 50000,
  executedAmount: 0,
  status: "Classificado",
  currentStage: "Habilitação em andamento",
  modality: "Ações de Qualificação e Formação",
  className: "Classe II",
  proponent: "Marcel Eduardo Cabeça Domingues",
  proponentDocument: "59.053.899/0001-53",
  city: "Jaraguá do Sul",
  state: "SC",
  startDate: "2026-08-01",
  endDate: "2027-07-31",
  notes: "",
  archived: false,
};

function getProjectValues(project?: Project): ProjectFormValues {
  if (!project) return defaultProjectValues;

  return {
    name: project.name,
    fullTitle: project.fullTitle,
    slug: project.slug,
    shortDescription: project.shortDescription,
    summary: project.summary,
    edital: project.edital,
    registrationNumber: project.registrationNumber,
    approvedAmount: project.approvedAmount,
    executedAmount: project.executedAmount,
    status: project.status,
    currentStage: project.currentStage,
    modality: project.modality,
    className: project.className,
    proponent: project.proponent,
    proponentDocument: project.proponentDocument,
    city: project.city,
    state: project.state,
    startDate: project.startDate,
    endDate: project.endDate,
    notes: project.notes,
    archived: project.archived,
  };
}

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const [state, setState] = useState<ProjectActionState | undefined>();
  const [pending, startPending] = useTransition();

  const {
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: getProjectValues(project),
  });

  useEffect(() => {
    if (!project) {
      const name = getValues("name");
      if (name) {
        setValue("slug", generateSlug(name), { shouldValidate: true });
      }
    }
  }, [getValues, project, setValue]);

  function handleAction(formData: FormData) {
    const currentValues = getValues();

    if (!project) {
      formData.set("slug", generateSlug(currentValues.name));
    }

    startPending(async () => {
      const result = await saveProject(state, formData);
      setState(result);

      if (result.ok) {
        if (!project && result.projectId) {
          router.push(`/projetos/${result.projectId}#editar-projeto`);
          return;
        }

        startTransition(() => router.refresh());
      }
    });
  }

  return (
    <SectionCard
      title={project ? "Editar projeto" : "Cadastro de projeto"}
      description={
        project
          ? "Altere dados, foto/capa e banner interno do projeto."
          : "Campos principais do edital e execução."
      }
    >
      {state?.message ? (
        <div
          className={
            state.ok
              ? "mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {state.message}
        </div>
      ) : null}

      <form id="project-form" className="grid gap-4 lg:grid-cols-2" action={handleAction}>
        {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
        <input type="hidden" name="archived" value={project?.archived ? "true" : "false"} />

        <Field label="Nome do projeto" error={errors.name?.message ?? state?.errors?.name?.[0]}>
          <input {...register("name")} className="form-input" />
        </Field>

        <Field label="Slug" error={errors.slug?.message ?? state?.errors?.slug?.[0]}>
          <input {...register("slug")} className="form-input" />
        </Field>

        <Field label="Título completo" error={errors.fullTitle?.message ?? state?.errors?.fullTitle?.[0]} wide>
          <input {...register("fullTitle")} className="form-input" />
        </Field>

        <Field label="Edital" error={errors.edital?.message ?? state?.errors?.edital?.[0]}>
          <input {...register("edital")} className="form-input" />
        </Field>

        <Field label="Inscrição" error={errors.registrationNumber?.message ?? state?.errors?.registrationNumber?.[0]}>
          <input {...register("registrationNumber")} className="form-input" />
        </Field>

        <Field label="Valor aprovado" error={errors.approvedAmount?.message ?? state?.errors?.approvedAmount?.[0]}>
          <input {...register("approvedAmount", { valueAsNumber: true })} className="form-input" type="number" />
        </Field>

        <Field label="Valor executado" error={errors.executedAmount?.message ?? state?.errors?.executedAmount?.[0]}>
          <input {...register("executedAmount", { valueAsNumber: true })} className="form-input" type="number" />
        </Field>

        <Field label="Status" error={errors.status?.message ?? state?.errors?.status?.[0]}>
          <select {...register("status")} className="form-input">
            {projectStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>

        <Field label="Etapa atual" error={errors.currentStage?.message ?? state?.errors?.currentStage?.[0]}>
          <input {...register("currentStage")} className="form-input" />
        </Field>

        <Field label="Modalidade" error={errors.modality?.message ?? state?.errors?.modality?.[0]}>
          <input {...register("modality")} className="form-input" />
        </Field>

        <Field label="Classe" error={errors.className?.message ?? state?.errors?.className?.[0]}>
          <input {...register("className")} className="form-input" />
        </Field>

        <Field label="Proponente" error={errors.proponent?.message ?? state?.errors?.proponent?.[0]}>
          <input {...register("proponent")} className="form-input" />
        </Field>

        <Field label="CPF/CNPJ do proponente" error={errors.proponentDocument?.message ?? state?.errors?.proponentDocument?.[0]}>
          <input {...register("proponentDocument")} className="form-input" />
        </Field>

        <Field label="Cidade" error={errors.city?.message ?? state?.errors?.city?.[0]}>
          <input {...register("city")} className="form-input" />
        </Field>

        <Field label="Estado" error={errors.state?.message ?? state?.errors?.state?.[0]}>
          <input {...register("state")} className="form-input" maxLength={2} />
        </Field>

        <Field label="Data inicial" error={errors.startDate?.message ?? state?.errors?.startDate?.[0]}>
          <input {...register("startDate")} className="form-input" type="date" />
        </Field>

        <Field label="Data final" error={errors.endDate?.message ?? state?.errors?.endDate?.[0]}>
          <input {...register("endDate")} className="form-input" type="date" />
        </Field>

        <Field label="Resumo" error={errors.summary?.message ?? state?.errors?.summary?.[0]} wide>
          <textarea {...register("summary")} className="form-input min-h-28" />
        </Field>

        <Field label="Descrição curta" error={errors.shortDescription?.message ?? state?.errors?.shortDescription?.[0]} wide>
          <textarea {...register("shortDescription")} className="form-input min-h-20" />
        </Field>

        <Field label="Observações" error={errors.notes?.message ?? state?.errors?.notes?.[0]} wide>
          <textarea {...register("notes")} className="form-input min-h-24" />
        </Field>

        <div className="lg:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar projeto"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function Field({
  label,
  error,
  children,
  wide,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "block lg:col-span-2" : "block"}>
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-1 block">{children}</span>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
TSEOF

echo "Corrigindo página de novo projeto..."

cat > "src/app/(protected)/projetos/novo/page.tsx" <<'TSEOF'
import { PageContainer } from "@/components/layout/page-container";
import { ProjectBannerUpload } from "@/components/projects/project-banner-upload";
import { ProjectCoverUpload } from "@/components/projects/project-cover-upload";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectTeamPicker } from "@/components/projects/project-team-picker";
import { requireAuthorizedProfile } from "@/lib/auth/require-role";

export default async function NewProjectPage() {
  await requireAuthorizedProfile(["admin", "super_admin"]);

  return (
    <PageContainer
      title="Novo projeto"
      description="Cadastre os dados principais do projeto, foto/capa, banner e equipe."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <ProjectForm />
          <ProjectTeamPicker />
        </div>

        <div className="space-y-6">
          <ProjectCoverUpload formId="project-form" />
          <ProjectBannerUpload formId="project-form" />
        </div>
      </div>
    </PageContainer>
  );
}
TSEOF

echo "Corrigindo página de edição do projeto para ter troca de imagem..."

cat > "src/app/(protected)/projetos/[id]/page.tsx" <<'TSEOF'
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectBannerUpload } from "@/components/projects/project-banner-upload";
import { ProjectCoverUpload } from "@/components/projects/project-cover-upload";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectHeader } from "@/components/projects/project-header";
import { ProjectStatusTimeline } from "@/components/projects/project-status-timeline";
import { ProjectSummaryCard } from "@/components/projects/project-summary-card";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { can } from "@/lib/auth/permissions";
import { requireAuthorizedProfile } from "@/lib/auth/require-role";
import { getProjectById } from "@/modules/projects/queries";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, project] = await Promise.all([
    requireAuthorizedProfile(),
    getProjectById(id),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <PageContainer
      title={project.name}
      description={project.currentStage}
      actions={
        <ProjectActionsMenu
          canDuplicate={can(profile.role, "create_project")}
          canArchive={can(profile.role, "archive_project")}
        />
      }
    >
      <ProjectHeader project={project} />
      <ProjectWorkspaceNav project={project} />

      <SectionCard title="Timeline de etapas">
        <ProjectStatusTimeline current={project.currentStage} />
      </SectionCard>

      <ProjectSummaryCard project={project} />
      <ProjectTabs overview={{ summary: project.summary, notes: project.notes }} />

      <div id="editar-projeto" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <ProjectForm project={project} />

        <div className="space-y-6">
          <ProjectCoverUpload formId="project-form" projectId={project.id} initialUrl={project.coverUrl} />
          <ProjectBannerUpload formId="project-form" projectId={project.id} initialUrl={project.bannerUrl} />
        </div>
      </div>
    </PageContainer>
  );
}
TSEOF

echo "Corrigindo botão Editar projeto do dashboard..."

cat > src/components/dashboard/project-stages-panel.tsx <<'TSEOF'
import Link from "next/link";
import { Check, ChevronDown, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";

const stages = [
  ["1", "Avaliação", "Concluída"],
  ["2", "Habilitação", "Em andamento"],
  ["3", "Assinatura", "Pendente"],
  ["4", "Repasse", "Pendente"],
  ["5", "Execução", "Pendente"],
  ["6", "Prest. Contas", "Pendente"],
] as const;

export function ProjectStagesPanel({ projectId }: { projectId: string }) {
  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(246,248,255,0.96))] p-5 soft-shadow">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.28em] text-primary/70">
            Etapas do projeto
          </p>
          <h3 className="mt-2 text-[1.3rem] font-semibold text-slate-950">
            Linha de acompanhamento
          </h3>
        </div>

        <Button asChild className="rounded-2xl border-white/80" variant="outline">
          <Link href={`/projetos/${projectId}#editar-projeto`}>
            <PenLine className="size-4" />
            Editar projeto
            <ChevronDown className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        {stages.map(([number, title, status], index) => {
          const done = number === "1";
          const current = number === "2";

          return (
            <div key={number} className="relative text-center text-xs">
              {index < stages.length - 1 ? (
                <div className="absolute left-1/2 top-4 hidden h-px w-full translate-x-1/2 bg-slate-200 md:block" />
              ) : null}

              <div
                className={
                  done
                    ? "relative z-10 mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_14px_30px_-20px_rgba(16,185,129,0.9)]"
                    : current
                      ? "relative z-10 mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f46e5,#2563eb)] text-white shadow-[0_14px_30px_-20px_rgba(79,70,229,0.9)]"
                      : "relative z-10 mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                }
              >
                {done ? <Check className="size-4" /> : number}
              </div>

              <p className="font-semibold text-slate-950">{title}</p>
              <p className={current ? "mt-1 text-primary" : "mt-1 text-muted-foreground"}>
                {status}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
TSEOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/(protected)/dashboard/page.tsx")
text = path.read_text()
text = text.replace("<ProjectStagesPanel />", "<ProjectStagesPanel projectId={featured.id} />")
path.write_text(text)
PY

echo "Liberando buckets de imagem para exibir URL pública..."

cat > supabase/migrations/20260623142000_project_media_public_buckets.sql <<'SQLEOF'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-covers', 'project-covers', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('project-banners', 'project-banners', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "operators read project media public buckets" on storage.objects;
create policy "operators read project media public buckets" on storage.objects
  for select using (
    bucket_id in ('project-covers', 'project-banners')
  );

drop policy if exists "operators upload project media public buckets" on storage.objects;
create policy "operators upload project media public buckets" on storage.objects
  for insert with check (
    bucket_id in ('project-covers', 'project-banners')
    and public.is_operator()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

drop policy if exists "operators update project media public buckets" on storage.objects;
create policy "operators update project media public buckets" on storage.objects
  for update using (
    bucket_id in ('project-covers', 'project-banners')
    and public.is_operator()
  ) with check (
    bucket_id in ('project-covers', 'project-banners')
    and public.is_operator()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );
SQLEOF

echo "Protegendo .env..."

touch .gitignore
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF ".env.*.local" .gitignore || echo ".env.*.local" >> .gitignore
grep -qxF "!.env.example" .gitignore || echo "!.env.example" >> .gitignore
git rm --cached .env .env.local 2>/dev/null || true

echo "Aplicando migration no Supabase..."
npx supabase db push || echo "ATENÇÃO: se pediu login, rode: npx supabase login && npx supabase db push"

echo "Rodando build..."
npm run build

echo ""
echo "Correção concluída."
echo "Agora o botão Editar projeto abre a tela de edição com Trocar imagem."
