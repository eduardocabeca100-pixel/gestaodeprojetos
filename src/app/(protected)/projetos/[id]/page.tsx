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
        <ProjectStatusTimeline projectId={project.id} current={project.currentStage} />
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
