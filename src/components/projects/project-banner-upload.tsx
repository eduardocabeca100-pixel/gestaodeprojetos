import { ProjectMediaUpload } from "./project-media-upload";

export function ProjectBannerUpload({
  initialUrl,
  formId,
  projectId,
}: {
  initialUrl?: string | null;
  formId?: string;
  projectId?: string | null;
}) {
  return (
    <ProjectMediaUpload
      title="Banner interno"
      description="Banner de destaque usado nas páginas internas."
      bucket="project-banners"
      fieldName="bannerUrl"
      initialUrl={initialUrl}
      formId={formId}
      projectId={projectId}
      accent="cyan"
    />
  );
}
