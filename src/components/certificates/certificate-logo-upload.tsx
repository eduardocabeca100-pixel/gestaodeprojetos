"use client";

import { ImagePlus } from "lucide-react";

export function CertificateLogoUpload({
  title,
  description,
  fileName,
  onFileChange,
}: {
  title: string;
  description: string;
  fileName?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <label className="mt-3 block">
        <div className="form-input flex items-center gap-2">
          <ImagePlus className="size-4 text-muted-foreground" />
          <input
            className="w-full border-0 bg-transparent p-0 text-sm outline-none"
            type="file"
            accept="image/*"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
        </div>
      </label>
      <p className="mt-2 text-xs text-muted-foreground">{fileName ?? "Nenhum arquivo selecionado"}</p>
    </section>
  );
}
