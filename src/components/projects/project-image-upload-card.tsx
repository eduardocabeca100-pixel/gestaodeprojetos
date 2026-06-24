"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Save, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/modules/projects/types";

type ProjectImageKind = "cover" | "banner";

type SavedImage = {
  url: string;
  fileName: string;
  width: number;
  height: number;
  savedAt: string;
};

type ProjectImageUploadCardProps = {
  project?: Project;
  kind: ProjectImageKind;
  title: string;
  description: string;
  bucket: string;
  dbField: "cover_url" | "banner_url";
  recommendedWidth: number;
  recommendedHeight: number;
  initialUrl?: string | null;
};

function getStorageKey(kind: ProjectImageKind, project?: Project) {
  return `viva:project-media:${kind}:${project?.id ?? "draft"}`;
}

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readSavedImage(kind: ProjectImageKind, project?: Project): SavedImage | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(getStorageKey(kind, project));
    return saved ? (JSON.parse(saved) as SavedImage) : null;
  } catch {
    return null;
  }
}

function writeSavedImage(kind: ProjectImageKind, project: Project | undefined, image: SavedImage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(kind, project), JSON.stringify(image));
}

function removeSavedImage(kind: ProjectImageKind, project?: Project) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getStorageKey(kind, project));
}

function getImageDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = reject;
    image.src = src;
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProjectImageUploadCard({
  project,
  kind,
  title,
  description,
  bucket,
  dbField,
  recommendedWidth,
  recommendedHeight,
  initialUrl,
}: ProjectImageUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl ?? null);
  const [fileName, setFileName] = useState("");
  const [actualWidth, setActualWidth] = useState<number | null>(null);
  const [actualHeight, setActualHeight] = useState<number | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const saved = readSavedImage(kind, project);

      if (saved) {
        setImageUrl(saved.url);
        setFileName(saved.fileName);
        setActualWidth(saved.width);
        setActualHeight(saved.height);
        return;
      }

      if (initialUrl) {
        setImageUrl(initialUrl);
      }
    }, 0);

    return () => window.clearTimeout(handle);
  }, [initialUrl, kind, project]);

  const exactMatch = useMemo(() => {
    if (!actualWidth || !actualHeight) return false;
    return actualWidth === recommendedWidth && actualHeight === recommendedHeight;
  }, [actualHeight, actualWidth, recommendedHeight, recommendedWidth]);

  async function handleFileChange(file: File | null) {
    setMessage("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Envie um arquivo de imagem válido.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    const dimensions = await getImageDimensions(dataUrl);

    setPendingFile(file);
    setPendingDataUrl(dataUrl);
    setImageUrl(dataUrl);
    setFileName(file.name);
    setActualWidth(dimensions.width);
    setActualHeight(dimensions.height);
    setMessage("Imagem carregada. Clique em Salvar imagem para gravar.");
  }

  async function saveImage() {
    if (!pendingFile || !pendingDataUrl || !actualWidth || !actualHeight) {
      setMessage("Selecione uma imagem antes de salvar.");
      return;
    }

    setSaving(true);
    setMessage("Salvando imagem...");

    let finalUrl = pendingDataUrl;

    try {
      const supabase = createClient();

      if (project && supabase) {
        const extension = pendingFile.name.split(".").pop() || "png";
        const path = `${project.id}/${kind}-${Date.now()}-${safeFileName(project.slug)}.${extension}`;

        const upload = await supabase.storage.from(bucket).upload(path, pendingFile, {
          cacheControl: "3600",
          upsert: true,
        });

        if (!upload.error) {
          const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
          finalUrl = publicUrl;

          const update = await supabase
            .from("projects")
            .update({ [dbField]: publicUrl } as never)
            .eq("id", project.id);

          if (update.error) {
            setMessage(`Imagem enviada, mas não consegui atualizar o projeto: ${update.error.message}`);
          } else {
            setMessage("Imagem salva no projeto.");
          }
        } else {
          setMessage(`Não consegui enviar ao Supabase. Salvei localmente. Erro: ${upload.error.message}`);
        }
      } else if (!project) {
        setMessage("Imagem salva como rascunho local. Para salvar no projeto, use a edição depois de criar.");
      } else {
        setMessage("Supabase não configurado no navegador. Imagem salva localmente.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? `Imagem salva localmente. Erro: ${error.message}` : "Imagem salva localmente.");
    } finally {
      writeSavedImage(kind, project, {
        url: finalUrl,
        fileName: pendingFile.name,
        width: actualWidth,
        height: actualHeight,
        savedAt: new Date().toISOString(),
      });

      setImageUrl(finalUrl);
      setPendingFile(null);
      setPendingDataUrl(null);
      setSaving(false);
    }
  }

  function removeImage() {
    removeSavedImage(kind, project);
    setImageUrl(null);
    setFileName("");
    setActualWidth(null);
    setActualHeight(null);
    setPendingFile(null);
    setPendingDataUrl(null);
    setMessage("Imagem removida deste card.");
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <UploadCloud className="size-5" />
        </div>

        <div>
          <p className="font-bold text-slate-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          <p className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            Tamanho exato recomendado: {recommendedWidth} × {recommendedHeight} px
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {imageUrl ? (
          <NextImage
            src={imageUrl}
            alt={title}
            width={recommendedWidth}
            height={recommendedHeight}
            unoptimized
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="flex h-56 flex-col items-center justify-center text-center text-slate-400">
            <ImagePlus className="mb-3 size-8" />
            <p className="text-sm font-semibold">Prévia da imagem</p>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-500">
        <p>
          Arquivo: <strong className="text-slate-700">{fileName || "Nenhuma imagem escolhida"}</strong>
        </p>

        <p>
          Tamanho enviado:{" "}
          <strong className={exactMatch ? "text-emerald-700" : "text-amber-700"}>
            {actualWidth && actualHeight ? `${actualWidth} × ${actualHeight} px` : "Ainda não informado"}
          </strong>
        </p>

        {actualWidth && actualHeight && !exactMatch ? (
          <p className="text-amber-700">
            A imagem funciona, mas o ideal é enviar exatamente {recommendedWidth} × {recommendedHeight} px.
          </p>
        ) : null}

        {exactMatch ? (
          <p className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            Tamanho perfeito.
          </p>
        ) : null}
      </div>

      {message ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            void handleFileChange(event.target.files?.[0] ?? null);
          }}
        />

        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="mr-2 size-4" />
          Selecionar imagem
        </Button>

        <Button type="button" onClick={saveImage} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Salvar imagem
        </Button>

        {imageUrl ? (
          <Button type="button" variant="destructive" onClick={removeImage}>
            <Trash2 className="mr-2 size-4" />
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}
