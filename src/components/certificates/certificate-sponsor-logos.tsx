"use client";

import { useMemo } from "react";
import { Plus, Upload, Eye, Trash2, MoveHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  certificateLogoPositions,
  certificateLogoTypes,
  type CertificateLogoPosition,
  type CertificateLogoType,
} from "@/modules/certificates/types";

export type SponsorLogoDraft = {
  id: string;
  name: string;
  type: CertificateLogoType;
  size: number;
  displayWidthMm: number;
  maxHeightMm: number;
  position: CertificateLogoPosition;
  displayOrder: number;
  showOnFront: boolean;
  showOnBack: boolean;
  isActive: boolean;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  logoUrl?: string | null;
};

type FileMeta = {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  imageWidth: number;
  imageHeight: number;
};

const logoRecommendations: Record<CertificateLogoType, { min: [number, number]; recommended: [number, number] }> = {
  "realização": { min: [600, 150], recommended: [1200, 300] },
  "apoio": { min: [600, 150], recommended: [1200, 300] },
  "patrocínio": { min: [600, 150], recommended: [1200, 300] },
  "parceria": { min: [600, 150], recommended: [1200, 300] },
  "projeto cultural": { min: [600, 150], recommended: [1200, 300] },
  "instituição": { min: [600, 150], recommended: [1200, 300] },
};

export function CertificateSponsorLogos({
  items,
  onChange,
}: {
  items: SponsorLogoDraft[];
  onChange: (items: SponsorLogoDraft[]) => void;
}) {
  const groupedItems = useMemo(
    () =>
      certificateLogoTypes.map((category) => ({
        category,
        logos: items
          .filter((item) => item.type === category)
          .sort((a, b) => a.displayOrder - b.displayOrder),
      })),
    [items],
  );

  function updateItem(id: string, patch: Partial<SponsorLogoDraft>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleFileChange(id: string, file: File | null) {
    if (!file) return;
    const meta = await readFileMeta(file);
    updateItem(id, {
      fileName: meta.fileName,
      fileType: meta.fileType,
      fileSize: meta.fileSize,
      imageWidth: meta.imageWidth,
      imageHeight: meta.imageHeight,
      logoUrl: meta.url,
    });
  }

  function addLogo(category: CertificateLogoType) {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        name: `Novo logo - ${category}`,
        type: category,
        size: 28,
        displayWidthMm: 32,
        maxHeightMm: 16,
        position: "centro",
        displayOrder: items.length + 1,
        showOnFront: true,
        showOnBack: true,
        isActive: true,
        fileName: null,
        fileType: null,
        fileSize: null,
        imageWidth: null,
        imageHeight: null,
        logoUrl: null,
      },
    ]);
  }

  return (
    <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Rodapé e logos</p>
          <h3 className="mt-1 text-[1rem] font-semibold">Categorias, imagens e posições</h3>
        </div>
        <Button type="button" variant="outline" onClick={() => addLogo("instituição")}>
          <Plus className="size-4" />
          Adicionar logo
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        {groupedItems.map(({ category, logos }) => (
          <div key={category} className="rounded-2xl border border-border bg-muted/15 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{category}</p>
                <p className="text-sm text-muted-foreground">{logos.length} logo(s)</p>
              </div>
              <Button type="button" variant="outline" onClick={() => addLogo(category)}>
                <Plus className="size-4" />
                Adicionar logo
              </Button>
            </div>

            {logos.length ? (
              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                {logos.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-border bg-white p-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
                        {item.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.logoUrl}
                            alt={item.name}
                            className="h-full w-full rounded-xl object-contain p-2"
                          />
                        ) : (
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {item.name.slice(0, 2)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <input
                              className="w-full border-0 bg-transparent p-0 text-sm font-semibold outline-none"
                              value={item.name}
                              onChange={(event) => updateItem(item.id, { name: event.target.value })}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.fileName ?? "Sem imagem enviada"}
                            </p>
                          </div>
                          <button
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                            type="button"
                            onClick={() => onChange(items.filter((logo) => logo.id !== item.id))}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Categoria</span>
                            <select
                              className="form-input mt-1"
                              value={item.type}
                              onChange={(event) => updateItem(item.id, { type: event.target.value as CertificateLogoType })}
                            >
                              {certificateLogoTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Ordem</span>
                            <input
                              className="form-input mt-1"
                              type="number"
                              value={item.displayOrder}
                              onChange={(event) => updateItem(item.id, { displayOrder: Number(event.target.value) })}
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Largura (mm)</span>
                            <input
                              className="form-input mt-1"
                              type="number"
                              value={item.displayWidthMm}
                              onChange={(event) => updateItem(item.id, { displayWidthMm: Number(event.target.value) })}
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Altura máx. (mm)</span>
                            <input
                              className="form-input mt-1"
                              type="number"
                              value={item.maxHeightMm}
                              onChange={(event) => updateItem(item.id, { maxHeightMm: Number(event.target.value) })}
                            />
                          </label>
                        </div>

                        <label className="block">
                          <span className="text-xs font-medium text-muted-foreground">Posição</span>
                          <select
                            className="form-input mt-1"
                            value={item.position}
                            onChange={(event) => updateItem(item.id, { position: event.target.value as CertificateLogoPosition })}
                          >
                            {certificateLogoPositions.map((position) => (
                              <option key={position} value={position}>
                                {position}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="flex flex-wrap gap-2">
                          <ToggleChip
                            label="Frente"
                            active={item.showOnFront}
                            onClick={() => updateItem(item.id, { showOnFront: !item.showOnFront })}
                          />
                          <ToggleChip
                            label="Verso"
                            active={item.showOnBack}
                            onClick={() => updateItem(item.id, { showOnBack: !item.showOnBack })}
                          />
                          <ToggleChip
                            label="Ativa"
                            active={item.isActive}
                            onClick={() => updateItem(item.id, { isActive: !item.isActive })}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs font-medium text-muted-foreground">
                            <Upload className="size-4" />
                            Substituir imagem
                            <input
                              type="file"
                              className="hidden"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                              onChange={(event) => {
                                void handleFileChange(item.id, event.target.files?.[0] ?? null);
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                          >
                            <Eye className="size-4" />
                            Pré-visualizar
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                          >
                            <MoveHorizontal className="size-4" />
                            Ver tamanho recomendado
                          </button>
                        </div>

                        <div className="grid gap-2 rounded-xl border border-dashed border-border bg-muted/10 p-3 text-xs text-muted-foreground md:grid-cols-2">
                          <p>Dimensões: <span className="font-semibold text-foreground">{formatDimensions(item.imageWidth, item.imageHeight)}</span></p>
                          <p>Tamanho: <span className="font-semibold text-foreground">{formatFileSize(item.fileSize)}</span></p>
                          <p>Formato: <span className="font-semibold text-foreground">{item.fileType ?? "—"}</span></p>
                          <p>Posição sugerida: <span className="font-semibold text-foreground">{item.position}</span></p>
                        </div>

                        {item.imageWidth && item.imageHeight ? (
                          <RecommendationAlert item={item} />
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
                Nenhuma logo cadastrada nesta categoria. Quando adicionar, este bloco aparece no certificado.
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendationAlert({ item }: { item: SponsorLogoDraft }) {
  const recommendation = logoRecommendations[item.type];
  const isTooSmall =
    (item.imageWidth ?? 0) < recommendation.min[0] || (item.imageHeight ?? 0) < recommendation.min[1];

  if (!isTooSmall) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      Imagem abaixo do recomendado. Mínimo sugerido: {recommendation.min[0]} x {recommendation.min[1]} px.
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold transition",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

async function readFileMeta(file: File): Promise<FileMeta> {
  const url = URL.createObjectURL(file);
  const image = await loadImage(url);

  return {
    url,
    fileName: file.name,
    fileType: file.type || "image",
    fileSize: file.size,
    imageWidth: image.width,
    imageHeight: image.height,
  };
}

function loadImage(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = url;
  });
}

function formatDimensions(width?: number | null, height?: number | null) {
  if (!width || !height) return "—";
  return `${width} x ${height} px`;
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
