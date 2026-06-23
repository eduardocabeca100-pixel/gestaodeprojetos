"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type ProjectMediaUploadProps = {
  title: string;
  description: string;
  bucket: "project-covers" | "project-banners";
  fieldName: "coverUrl" | "bannerUrl";
  initialUrl?: string | null;
  formId?: string;
  projectId?: string | null;
  accent?: "primary" | "cyan";
};

function safeFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "jpg";
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 64);

  return `${base || "imagem"}-${Date.now()}.${extension}`;
}

export function ProjectMediaUpload({
  title,
  description,
  bucket,
  fieldName,
  initialUrl = null,
  formId = "project-form",
  projectId = null,
  accent = "primary",
}: ProjectMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(initialUrl ?? "");
  const [status, setStatus] = useState(initialUrl ? "Imagem carregada." : "Nenhuma imagem escolhida.");
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Escolha uma imagem JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus("A imagem precisa ter no máximo 10 MB.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setStatus("Enviando imagem...");

    try {
      const supabase = createClient();

      if (!supabase) {
        setStatus("Supabase não configurado no navegador. Confira NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return;
      }

      const folder = projectId ? projectId : "drafts";
      const path = `${folder}/${safeFileName(file.name)}`;

      const result = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (result.error) {
        setStatus(result.error.message || "Não foi possível enviar a imagem.");
        return;
      }

      const publicUrl = supabase.storage.from(bucket).getPublicUrl(result.data.path).data.publicUrl;

      setUrl(publicUrl);
      setPreviewUrl(publicUrl);
      setStatus("Imagem enviada. Agora clique em Salvar projeto para gravar.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-white p-4 text-sm soft-shadow">
      <input type="hidden" name={fieldName} value={url} form={formId} />

      <div className="mb-3 flex items-start gap-3">
        <div className={accent === "cyan" ? "text-cyan-600" : "text-primary"}>
          <Upload className="size-5" />
        </div>

        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
      </div>

      {previewUrl ? (
        <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="mb-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground">
          <ImagePlus className="mr-2 size-5" />
          Prévia da imagem
        </div>
      )}

      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {url ? "Trocar imagem" : "Selecionar imagem"}
        </Button>

        {url ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setUrl("");
              setPreviewUrl("");
              setStatus("Imagem removida. Clique em Salvar projeto para gravar.");
            }}
          >
            Remover
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">{status}</p>
    </div>
  );
}
