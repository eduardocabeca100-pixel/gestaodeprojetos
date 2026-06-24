import { ProjectImageUploadCard } from "@/components/projects/project-image-upload-card";
import type { Project } from "@/modules/projects/types";

export function ProjectCoverUpload({ project }: { project?: Project }) {
  return (
    <ProjectImageUploadCard
      project={project}
      kind="cover"
      title="Foto/capa do projeto"
      description="Imagem principal usada no card e no topo do projeto."
      bucket="project-covers"
      dbField="cover_url"
      recommendedWidth={1200}
      recommendedHeight={800}
      initialUrl={project?.coverUrl}
    />
  );
}
