import { PageContainer } from "@/components/layout/page-container";
import { ProjectBannerUpload } from "@/components/projects/project-banner-upload";
import { ProjectCoverUpload } from "@/components/projects/project-cover-upload";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <PageContainer
      title="Novo projeto"
      description="Cadastro modular preparado para persistência no Supabase."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <ProjectForm />
        <div className="space-y-4">
          <ProjectCoverUpload />
          <ProjectBannerUpload />
        </div>
      </div>
    </PageContainer>
  );
}
