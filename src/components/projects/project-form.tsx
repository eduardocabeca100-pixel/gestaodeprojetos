"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { generateSlug } from "@/lib/utils/generate-slug";
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
  if (!project) {
    return defaultProjectValues;
  }

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
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: getProjectValues(project),
  });

  return (
    <SectionCard
      title={project ? "Editar projeto" : "Cadastro de projeto"}
      description="Campos principais do edital e execução."
    >
      {isSubmitSuccessful ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Projeto validado localmente. A próxima etapa é persistir no Supabase.
        </div>
      ) : null}
      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={handleSubmit((values) => {
          setValue("slug", generateSlug(values.name));
        })}
      >
        <Field label="Nome do projeto" error={errors.name?.message}>
          <input {...register("name")} className="form-input" />
        </Field>
        <Field label="Slug" error={errors.slug?.message}>
          <input {...register("slug")} className="form-input" />
        </Field>
        <Field label="Título completo" error={errors.fullTitle?.message} wide>
          <input {...register("fullTitle")} className="form-input" />
        </Field>
        <Field label="Edital" error={errors.edital?.message}>
          <input {...register("edital")} className="form-input" />
        </Field>
        <Field label="Inscrição" error={errors.registrationNumber?.message}>
          <input {...register("registrationNumber")} className="form-input" />
        </Field>
        <Field label="Valor aprovado" error={errors.approvedAmount?.message}>
          <input {...register("approvedAmount", { valueAsNumber: true })} className="form-input" type="number" />
        </Field>
        <Field label="Valor executado" error={errors.executedAmount?.message}>
          <input {...register("executedAmount", { valueAsNumber: true })} className="form-input" type="number" />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select {...register("status")} className="form-input">
            {projectStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>
        <Field label="Etapa atual" error={errors.currentStage?.message}>
          <input {...register("currentStage")} className="form-input" />
        </Field>
        <Field label="Modalidade" error={errors.modality?.message}>
          <input {...register("modality")} className="form-input" />
        </Field>
        <Field label="Classe" error={errors.className?.message}>
          <input {...register("className")} className="form-input" />
        </Field>
        <Field label="Proponente" error={errors.proponent?.message}>
          <input {...register("proponent")} className="form-input" />
        </Field>
        <Field label="CPF/CNPJ do proponente" error={errors.proponentDocument?.message}>
          <input {...register("proponentDocument")} className="form-input" />
        </Field>
        <Field label="Cidade" error={errors.city?.message}>
          <input {...register("city")} className="form-input" />
        </Field>
        <Field label="Estado" error={errors.state?.message}>
          <input {...register("state")} className="form-input" maxLength={2} />
        </Field>
        <Field label="Data inicial" error={errors.startDate?.message}>
          <input {...register("startDate")} className="form-input" type="date" />
        </Field>
        <Field label="Data final" error={errors.endDate?.message}>
          <input {...register("endDate")} className="form-input" type="date" />
        </Field>
        <Field label="Resumo" error={errors.summary?.message} wide>
          <textarea {...register("summary")} className="form-input min-h-28" />
        </Field>
        <Field label="Descrição curta" error={errors.shortDescription?.message} wide>
          <textarea {...register("shortDescription")} className="form-input min-h-20" />
        </Field>
        <Field label="Observações" error={errors.notes?.message} wide>
          <textarea {...register("notes")} className="form-input min-h-24" />
        </Field>
        <div className="lg:col-span-2">
          <Button type="submit">Salvar projeto</Button>
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
