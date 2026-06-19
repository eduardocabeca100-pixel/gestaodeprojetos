"use client";

import { FileUp } from "lucide-react";

export function CertificateSignatureUpload({
  title,
  name,
  role,
  onNameChange,
  onRoleChange,
  onFileChange,
  fileName,
}: {
  title: string;
  name: string;
  role: string;
  fileName?: string | null;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Nome</span>
          <input className="form-input mt-1" value={name} onChange={(event) => onNameChange(event.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Cargo</span>
          <input className="form-input mt-1" value={role} onChange={(event) => onRoleChange(event.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Assinatura</span>
          <div className="form-input mt-1 flex items-center gap-2">
            <FileUp className="size-4 text-muted-foreground" />
            <input
              className="w-full border-0 bg-transparent p-0 text-sm outline-none"
              type="file"
              accept="image/*"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{fileName ?? "Nenhum arquivo selecionado"}</p>
        </label>
      </div>
    </section>
  );
}
