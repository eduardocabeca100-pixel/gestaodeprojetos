import { ProjectMediaUpload } from "./project-media-upload";

export function ProjectCoverUpload({
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
      title="Foto/capa do projeto"
      description="Imagem principal do card e do topo do projeto."
      bucket="project-covers"
      fieldName="coverUrl"
      initialUrl={initialUrl}
      formId={formId}
      projectId={projectId}
    />
  );
}
