import { notFound } from "next/navigation";

import { CertificateWorkspace } from "@/components/certificates/certificate-workspace";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { getProjectById } from "@/modules/projects/queries";
import { getCertificateWorkspaceData } from "@/modules/certificates/queries";

export default async function ProjectCertificatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const data = await getCertificateWorkspaceData(project.id);

  return (
    <PageContainer
      title={`${project.name} • Certificados`}
      description="Emissão e histórico de certificados vinculados a este projeto."
    >
      <ProjectScopeBanner projectId={project.id} />
      <ProjectWorkspaceNav project={project} />
      <CertificateWorkspace data={data} scope="project" />
    </PageContainer>
  );
}
