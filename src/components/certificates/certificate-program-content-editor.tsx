"use client";

import { useMemo } from "react";

export function CertificateProgramContentEditor({
  value,
  columns,
  onChange,
  onColumnsChange,
}: {
  value: string;
  columns: 1 | 2;
  onChange: (value: string) => void;
  onColumnsChange: (value: 1 | 2) => void;
}) {
  const paragraphCount = useMemo(
    () => value.split("\n").map((line) => line.trim()).filter(Boolean).length,
    [value],
  );

  return (
    <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Conteúdo programático</p>
          <h3 className="mt-1 text-[1rem] font-semibold">Verso do certificado</h3>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          {[1, 2].map((column) => (
            <button
              key={column}
              type="button"
              className={
                columns === column
                  ? "rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm"
                  : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground"
              }
              onClick={() => onColumnsChange(column as 1 | 2)}
            >
              {column} coluna{column === 2 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="form-input mt-4 min-h-40"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {paragraphCount} bloco(s) de conteúdo. Use quebras de linha para separar itens do verso.
      </p>
    </section>
  );
}
