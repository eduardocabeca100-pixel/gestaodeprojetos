"use client";

import { useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { certificateGenerationSchema, type CertificateGenerationValues } from "@/modules/certificates/schemas";
import type { CertificateTemplate } from "@/modules/certificates/types";

import { CertificateProgramContentEditor } from "./certificate-program-content-editor";

export function CertificateForm({
  templates,
  initialValues,
  selectedStudentIds,
  onChange,
  onSubmit,
}: {
  templates: CertificateTemplate[];
  initialValues: CertificateGenerationValues;
  selectedStudentIds: string[];
  onChange?: (values: CertificateGenerationValues) => void;
  onSubmit?: (values: CertificateGenerationValues) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CertificateGenerationValues>({
    resolver: zodResolver(certificateGenerationSchema) as Resolver<
      CertificateGenerationValues,
      unknown,
      CertificateGenerationValues
    >,
    defaultValues: initialValues,
  });

  const watched = useWatch({
    control,
    defaultValue: initialValues,
  }) as CertificateGenerationValues;

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    setValue("studentIds", selectedStudentIds, { shouldDirty: true, shouldTouch: true });
  }, [selectedStudentIds, setValue]);

  useEffect(() => {
    if (watched) {
      onChange?.(watched as CertificateGenerationValues);
    }
  }, [onChange, watched]);

  return (
    <form
      className="rounded-lg border border-border bg-white p-4 soft-shadow"
      onSubmit={handleSubmit((values) => onSubmit?.(values))}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cadastro do certificado</p>
          <h3 className="mt-1 text-[1rem] font-semibold">Dados principais</h3>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="size-4" />
          Salvar modelo
        </Button>
      </div>

      <input type="hidden" {...register("projectId")} />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Modelo</span>
          <select className="form-input mt-1" {...register("templateId")}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {errors.templateId ? <p className="mt-1 text-xs text-red-600">{errors.templateId.message}</p> : null}
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Nome do curso/formação</span>
          <input className="form-input mt-1" {...register("courseName")} />
          {errors.courseName ? <p className="mt-1 text-xs text-red-600">{errors.courseName.message}</p> : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium">Modalidade</span>
          <input className="form-input mt-1" {...register("modality")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Área cultural</span>
          <input className="form-input mt-1" {...register("area")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Carga horária</span>
          <input className="form-input mt-1" {...register("workload")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Cidade</span>
          <input className="form-input mt-1" {...register("city")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Data de emissão</span>
          <input className="form-input mt-1" type="date" {...register("issueDate")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Registro</span>
          <input className="form-input mt-1" {...register("registry")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Livro</span>
          <input className="form-input mt-1" {...register("book")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Folhas</span>
          <input className="form-input mt-1" {...register("folio")} />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Texto de conclusão</span>
          <textarea className="form-input mt-1 min-h-24" {...register("conclusionText")} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Texto da frente</span>
          <textarea className="form-input mt-1 min-h-24" {...register("frontText")} />
        </label>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <CertificateProgramContentEditor
          value={watched.programContent}
          columns={watched.backColumns}
          onChange={(value) => setValue("programContent", value, { shouldDirty: true })}
          onColumnsChange={(value) => setValue("backColumns", value, { shouldDirty: true })}
        />
        <section className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Opções do documento</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ToggleField label="Mostrar CPF" checked={watched.showStudentCpf} onChange={(value) => setValue("showStudentCpf", value, { shouldDirty: true })} />
            <ToggleField label="Permitir CPF vazio" checked={watched.allowMissingCpf} onChange={(value) => setValue("allowMissingCpf", value, { shouldDirty: true })} />
            <ToggleField label="Incluir verso" checked={watched.includeBackSide} onChange={(value) => setValue("includeBackSide", value, { shouldDirty: true })} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Professor/formador</span>
              <input className="form-input mt-1" {...register("teacher")} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <select className="form-input mt-1" {...register("status")}>
                <option value="Rascunho">Rascunho</option>
                <option value="Pronto">Pronto</option>
                <option value="Emitido">Emitido</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Diretor geral</span>
              <input className="form-input mt-1" {...register("directorGeneral")} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Diretor executivo</span>
              <input className="form-input mt-1" {...register("executiveDirector")} />
            </label>
          </div>
        </section>
      </div>
    </form>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={
        checked
          ? "rounded-lg border border-primary bg-primary/10 px-3 py-2 text-left text-sm font-semibold text-primary"
          : "rounded-lg border border-border bg-white px-3 py-2 text-left text-sm font-medium text-muted-foreground"
      }
      onClick={() => onChange(!checked)}
    >
      {label}
    </button>
  );
}
