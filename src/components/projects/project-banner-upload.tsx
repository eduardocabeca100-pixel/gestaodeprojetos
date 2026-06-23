import { ProjectMediaUpload } from "./project-media-upload";

export function ProjectBannerUpload({
  initialUrl,
  formId,
}: {
  initialUrl?: string | null;
  formId?: string;
}) {
  return (
    <ProjectMediaUpload
      title="Banner interno"
      description="Banner de destaque usado nas páginas internas. Bucket project-banners."
      bucket="project-banners"
      fieldName="bannerUrl"
      initialUrl={initialUrl}
      formId={formId}
      accent="cyan"
    />
  );
}
