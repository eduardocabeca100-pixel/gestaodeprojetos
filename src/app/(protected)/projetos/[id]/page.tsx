import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectHeader } from "@/components/projects/project-header";
import { ProjectStatusTimeline } from "@/components/projects/project-status-timeline";
import { ProjectSummaryCard } from "@/components/projects/project-summary-card";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { getProjectById } from "@/modules/projects/queries";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <PageContainer
      title={project.name}
      description={project.currentStage}
      actions={<ProjectActionsMenu />}
    >
      <ProjectHeader project={project} />
      <ProjectWorkspaceNav project={project} />
      <SectionCard title="Timeline de etapas">
        <ProjectStatusTimeline current={project.currentStage} />
      </SectionCard>
      <ProjectSummaryCard project={project} />
      <ProjectTabs overview={{ summary: project.summary, notes: project.notes }} />
      <div id="editar-projeto">
        <ProjectForm project={project} />
      </div>
    </PageContainer>
  );
}
