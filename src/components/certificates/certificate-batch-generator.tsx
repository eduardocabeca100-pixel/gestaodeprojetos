"use client";

import { Download, ListFilter, PackageOpen } from "lucide-react";

export function CertificateBatchGenerator({
  selectedCount,
  totalCount,
  onGenerateSelected,
  onGenerateAll,
}: {
  selectedCount: number;
  totalCount: number;
  onGenerateSelected: () => void;
  onGenerateAll: () => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Geração em lote</p>
          <h3 className="mt-1 text-[1rem] font-semibold">Emitir certificados</h3>
        </div>
        <PackageOpen className="size-5 text-primary" />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Selecionados</p>
          <p className="mt-1 text-lg font-semibold">{selectedCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Total apto</p>
          <p className="mt-1 text-lg font-semibold">{totalCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Formato</p>
          <p className="mt-1 text-lg font-semibold">PDF</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary"
          onClick={onGenerateSelected}
        >
          <ListFilter className="size-4" />
          Gerar selecionados
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          onClick={onGenerateAll}
        >
          <Download className="size-4" />
          Gerar todos
        </button>
      </div>
    </section>
  );
}
