import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectWorkspaceSelector } from "@/components/projects/project-workspace-selector";
import { listProjects } from "@/modules/projects/queries";

export default async function SelectProjectPage() {
  const projects = await listProjects();

  return (
    <PageContainer
      title="Escolher projeto"
      description="Selecione o projeto de trabalho para manter documentos, financeiro, mídia, equipe e participantes separados."
    >
      <SectionCard title="Área de trabalho por projeto">
        <ProjectWorkspaceSelector projects={projects} />
      </SectionCard>
    </PageContainer>
  );
}
