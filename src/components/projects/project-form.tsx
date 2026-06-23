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
