import { Upload } from "lucide-react";

export function ProjectBannerUpload() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white p-4 text-sm">
      <Upload className="mb-2 size-5 text-cyan-600" />
      <p className="font-medium">Banner interno</p>
      <p className="mt-1 text-muted-foreground">Bucket project-banners.</p>
    </div>
  );
}
