import { PageContainer } from "@/components/layout/page-container";
import { ProjectBannerUpload } from "@/components/projects/project-banner-upload";
import { ProjectCoverUpload } from "@/components/projects/project-cover-upload";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectTeamPicker } from "@/components/projects/project-team-picker";
import { requireAuthorizedProfile } from "@/lib/auth/require-role";

export default async function NewProjectPage() {
  await requireAuthorizedProfile(["admin", "super_admin"]);

  return (
    <PageContainer
      title="Novo projeto"
      description="Cadastre os dados principais do projeto, foto/capa, banner e equipe."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <ProjectForm />
          <ProjectTeamPicker />
        </div>

        <div className="space-y-6">
          <ProjectCoverUpload formId="project-form" />
          <ProjectBannerUpload formId="project-form" />
        </div>
      </div>
    </PageContainer>
  );
}
