import { Upload } from "lucide-react";

export function ProjectCoverUpload() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white p-4 text-sm">
      <Upload className="mb-2 size-5 text-primary" />
      <p className="font-medium">Foto/capa do projeto</p>
      <p className="mt-1 text-muted-foreground">Bucket project-covers.</p>
    </div>
  );
}
