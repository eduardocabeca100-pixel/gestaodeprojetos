"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  FileBadge2,
  PackageOpen,
  ScrollText,
} from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";
import type { Participant } from "@/modules/participants/types";
import type { CertificateGenerationValues } from "@/modules/certificates/schemas";
import type {
  CertificateBatch,
  CertificateRecord,
  CertificateSettings,
  CertificateSignature,
  CertificateSponsorLogo,
  CertificateTemplate,
} from "@/modules/certificates/types";

import { CertificateBatchGenerator } from "./certificate-batch-generator";
import { CertificateCard } from "./certificate-card";
import { CertificateForm } from "./certificate-form";
import { CertificatePdfPreview } from "./certificate-pdf-preview";
import { CertificateStudentSelector } from "./certificate-student-selector";

export type CertificateWorkspaceData = {
  project: Project;
  projects: Project[];
  participants: Participant[];
  templates: CertificateTemplate[];
  certificates: CertificateRecord[];
  batches: CertificateBatch[];
  signatures: CertificateSignature[];
  sponsorLogos: CertificateSponsorLogo[];
  settings: CertificateSettings;
  teamMembers: Array<{ name: string; role: string }>;
  stats: {
    templates: number;
    issued: number;
    ready: number;
    batches: number;
  };
  nextNumber: string;
};

function buildDraft(
  project: Project,
  templates: CertificateTemplate[],
  nextNumber: string,
  participants: Participant[],
): CertificateGenerationValues {
  const template = templates[0];
  const firstStudent = participants[0];

  return {
    projectId: project.id,
    templateId: template?.id ?? `${project.id}-certificate-template`,
    studentIds: firstStudent ? [firstStudent.id] : [],
    courseName: project.fullTitle,
    modality: project.modality || "Oficina",
    area: project.className || "Artes cênicas",
    workload: template?.workload ?? "40h",
    city: project.city,
    issueDate: project.startDate,
    frontText: template?.frontText ?? "",
    conclusionText: template?.conclusionText ?? "",
    programContent: template?.programContent ?? "",
    teacher: "Professor/formador",
    directorGeneral: "Direção Viva",
    executiveDirector: "Produção executiva",
    registry: nextNumber,
    book: "Livro 01",
    folio: "Folhas 01-02",
    notes: "",
    status: "Rascunho",
    showStudentCpf: true,
    allowMissingCpf: true,
    includeBackSide: true,
    backColumns: template?.backColumns ?? 2,
  };
}

export function CertificateWorkspace({
  data,
  scope = "project",
}: {
  data: CertificateWorkspaceData;
  scope?: "global" | "project";
}) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    data.participants.slice(0, 2).map((student) => student.id),
  );
  const initialDraft = useMemo(
    () => buildDraft(data.project, data.templates, data.nextNumber, data.participants),
    [data.project, data.templates, data.nextNumber, data.participants],
  );
  const [draft, setDraft] = useState<CertificateGenerationValues>(
    initialDraft,
  );
  const [feedback, setFeedback] = useState("Estrutura pronta para emissão.");
  const effectiveDraft = useMemo(
    () => ({
      ...draft,
      studentIds: selectedStudentIds,
    }),
    [draft, selectedStudentIds],
  );

  const selectedStudent = useMemo(
    () =>
      data.participants.find((student) => student.id === selectedStudentIds[0]) ??
      data.participants[0] ??
      null,
    [data.participants, selectedStudentIds],
  );
  const selectedTemplate = useMemo(
    () =>
      data.templates.find((template) => template.id === effectiveDraft.templateId) ??
      data.templates[0] ??
      data.templates.at(0)!,
    [data.templates, effectiveDraft.templateId],
  );
  const selectedRecord = useMemo(
    () =>
      data.certificates.find((certificate) => certificate.participantId === selectedStudent?.id) ??
      data.certificates[0] ??
      data.certificates.at(0)!,
    [data.certificates, selectedStudent?.id],
  );
  const eligibleCount = data.participants.filter((student) => student.status === "Ativo" || student.status === "Concluído").length;

  return (
    <div className="space-y-6">
      {scope === "global" ? (
        <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Módulo Certificados</p>
              <h2 className="mt-1 text-[1rem] font-semibold">Projetos com certificados</h2>
            </div>
            <p className="text-sm text-muted-foreground">Selecione um projeto e continue o fluxo com a turma correta.</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projetos/${project.id}/certificados`}
                className={
                  project.id === data.project.id
                    ? "rounded-lg border border-primary bg-primary/5 p-4"
                    : "rounded-lg border border-border bg-muted/20 p-4 transition hover:border-primary"
                }
              >
                <p className="text-sm font-semibold">{project.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{project.shortDescription}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <CertificateCard label="Modelos" value={String(data.stats.templates)} helper="Modelos disponíveis para emissão" icon={FileBadge2} tone="violet" />
        <CertificateCard label="Emitidos" value={String(data.stats.issued)} helper="Certificados já concluídos" icon={BadgeCheck} tone="emerald" />
        <CertificateCard label="Prontos" value={String(data.stats.ready)} helper="Prontos para emissão" icon={ScrollText} tone="amber" />
        <CertificateCard label="Lotes" value={String(data.stats.batches)} helper="Lotes gerados no projeto" icon={PackageOpen} tone="blue" />
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <div className="space-y-6">
          <CertificateStudentSelector
            students={data.participants}
            selectedIds={selectedStudentIds}
            onChange={setSelectedStudentIds}
          />

          <CertificateForm
            templates={data.templates}
            initialValues={initialDraft}
            selectedStudentIds={selectedStudentIds}
            onChange={setDraft}
            onSubmit={(values) => {
              setDraft(values);
              setFeedback("Modelo salvo localmente e pronto para a geração do PDF.");
            }}
          />

          <CertificateBatchGenerator
            selectedCount={selectedStudentIds.length}
            totalCount={eligibleCount}
            onGenerateSelected={() => setFeedback("Geração em lote preparada para os alunos selecionados.")}
            onGenerateAll={() => setFeedback("Geração de todos os certificados preparada.")}
          />
        </div>

        <div className="space-y-6">
          <CertificatePdfPreview
            project={data.project}
            template={selectedTemplate}
            record={selectedRecord}
            settings={data.settings}
            sponsorLogos={data.sponsorLogos}
          />

          <SectionCard
            title="Histórico"
            description={`Projetos emitidos e arquivos vinculados. ${feedback}`}
            className="space-y-4"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Aluno</th>
                    <th className="py-2 pr-4">Projeto</th>
                    <th className="py-2 pr-4">Curso</th>
                    <th className="py-2 pr-4">Código</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.certificates.map((certificate) => (
                    <tr key={certificate.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 font-medium">{certificate.studentName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{data.project.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{certificate.courseName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{certificate.certificateNumber}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          {certificate.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" onClick={() => setFeedback(`Visualizando ${certificate.studentName}.`)}>
                            Visualizar
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setFeedback(`Regerando ${certificate.studentName}.`)}>
                            Gerar novamente
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setFeedback(`Cancelamento preparado para ${certificate.studentName}.`)}>
                            Cancelar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Modelos disponíveis" description="Tabela visual dos modelos cadastrados para este projeto.">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Modelo</th>
                    <th className="py-2 pr-4">Padrão</th>
                    <th className="py-2 pr-4">Frente</th>
                    <th className="py-2 pr-4">Verso</th>
                  </tr>
                </thead>
                <tbody>
                  {data.templates.map((template) => (
                    <tr key={template.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 font-medium">{template.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{template.isDefault ? "Sim" : "Não"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{template.frontText.slice(0, 60)}...</td>
                      <td className="py-3 pr-4 text-muted-foreground">{template.backTitle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
