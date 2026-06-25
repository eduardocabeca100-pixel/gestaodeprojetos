import { PageContainer } from "@/components/layout/page-container";
import { ProjectZipExportWorkspace } from "@/components/settings/project-zip-export-workspace";
import { listProjects } from "@/modules/projects/queries";

export default async function ExportProjectPage() {
  const projects = await listProjects();

  const registeredProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
  }));

  return (
    <PageContainer
      title="Exportar projeto completo"
      description="Baixe um ZIP do projeto cadastrado, com arquivos em PDF organizados por pastas e subpastas."
    >
      <ProjectZipExportWorkspace registeredProjects={registeredProjects} />
    </PageContainer>
  );
}
