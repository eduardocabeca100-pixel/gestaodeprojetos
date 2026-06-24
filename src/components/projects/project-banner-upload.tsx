import { ProjectImageUploadCard } from "@/components/projects/project-image-upload-card";
import type { Project } from "@/modules/projects/types";

export function ProjectBannerUpload({ project }: { project?: Project }) {
  return (
    <ProjectImageUploadCard
      project={project}
      kind="banner"
      title="Banner interno"
      description="Banner de destaque usado nas páginas internas do projeto."
      bucket="project-banners"
      dbField="banner_url"
      recommendedWidth={1920}
      recommendedHeight={640}
      initialUrl={project?.bannerUrl}
    />
  );
}
