import { ProjectMediaUpload } from "./project-media-upload";

export function ProjectCoverUpload({
  initialUrl,
  formId,
}: {
  initialUrl?: string | null;
  formId?: string;
}) {
  return (
    <ProjectMediaUpload
      title="Foto/capa do projeto"
      description="Imagem principal usada no card e no cabeçalho do projeto. Bucket project-covers."
      bucket="project-covers"
      fieldName="coverUrl"
      initialUrl={initialUrl}
      formId={formId}
    />
  );
}
