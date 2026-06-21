import { listParticipants } from "@/modules/participants/queries";
import { listProjects, getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import { listTeamMembers } from "@/modules/team/queries";

import { nextCertificateNumber } from "./certificate-number";
import {
  buildDefaultBatches,
  buildDefaultCertificateTemplate,
  buildDefaultSignatures,
  buildDefaultSponsorLogos,
  defaultCertificateSettings,
} from "./template-default";
import type { CertificateRecord, CertificateSettings } from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildProjectCertificates(
  projectId: string,
  projectName: string,
  participants: Awaited<ReturnType<typeof listParticipants>>,
): CertificateRecord[] {
  const year = new Date().getFullYear();

  return participants.slice(0, 3).map((participant, index): CertificateRecord => ({
    id: `${projectId}-cert-${index + 1}`,
    projectId,
    templateId: `${projectId}-certificate-template`,
    participantId: participant.id,
    certificateNumber: `CERT-${year}-${String(index + 1).padStart(4, "0")}`,
    studentName: participant.fullName,
    studentDocument: participant.document,
    courseName: projectName,
    modality: "Ações de Qualificação e Formação",
    workload: "33h",
    city: participant.city || "Jaraguá do Sul",
    issueDate: "2026-06-19",
    status: index === 0 ? "Emitido" : index === 1 ? "Pronto" : "Rascunho",
    pdfUrl: null,
    generatedBy: index === 0 ? "Sistema" : null,
    generatedAt: index === 0 ? new Date().toISOString() : null,
    canceledAt: null,
    cancelReason: null,
    createdAt: new Date().toISOString(),
  }));
}

export async function listCertificateTemplates(projectId?: string) {
  const project = await getScopedProject(projectId);

  return [buildDefaultCertificateTemplate(project.id)];
}

export async function listCertificates(projectId?: string) {
  const project = await getScopedProject(projectId);
  const participants = await listParticipants(projectId);

  return buildProjectCertificates(project.id, project.name, participants);
}

export async function listCertificateBatches(projectId?: string) {
  const project = await getScopedProject(projectId);
  const participants = await listParticipants(projectId);

  return buildDefaultBatches(project.id).map((batch) => ({
    ...batch,
    totalCertificates: participants.filter((participant) => participant.status === "Ativo" || participant.status === "Concluído").length,
  }));
}

export async function listCertificateSignatures(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildDefaultSignatures(`${project.id}-certificate-template`);
}

export async function listCertificateSponsorLogos(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildDefaultSponsorLogos(`${project.id}-certificate-template`);
}

export async function getCertificateSettings(projectId?: string) {
  const project = await getScopedProject(projectId);
  const template = buildDefaultCertificateTemplate(project.id);

  return {
    ...defaultCertificateSettings,
    logoInstitutionUrl: project.coverUrl,
    logoCiaUrl: project.bannerUrl,
    modelName: template.name,
    frontText: template.frontText,
    conclusionText: template.conclusionText,
    backTitle: template.backTitle,
    programContent: template.programContent,
    pageOrientation: template.pageOrientation,
  } satisfies CertificateSettings;
}

export async function getCertificateWorkspaceData(projectId?: string) {
  const [project, projects, participants, templates, certificates, batches, signatures, sponsorLogos, settings, teamMembers] =
    await Promise.all([
      getScopedProject(projectId),
      listProjects(),
      listParticipants(projectId),
      listCertificateTemplates(projectId),
      listCertificates(projectId),
      listCertificateBatches(projectId),
      listCertificateSignatures(projectId),
      listCertificateSponsorLogos(projectId),
      getCertificateSettings(projectId),
      listTeamMembers(projectId),
    ]);

  const activeCertificates = certificates.filter((certificate) => certificate.status === "Emitido");
  const readyCertificates = certificates.filter((certificate) => certificate.status === "Pronto");

  return {
    project,
    projects,
    participants,
    templates,
    certificates,
    batches,
    signatures,
    sponsorLogos,
    settings,
    teamMembers,
    stats: {
      templates: templates.length,
      issued: activeCertificates.length,
      ready: readyCertificates.length,
      batches: batches.length,
    },
    nextNumber: nextCertificateNumber(
      "CERT",
      certificates.map((certificate) => certificate.certificateNumber),
      new Date().getFullYear(),
    ),
  };
}
