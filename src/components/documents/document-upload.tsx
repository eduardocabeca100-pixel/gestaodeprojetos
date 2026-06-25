"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isAllowedDocument, isBlockedVideo } from "@/lib/utils/file-validation";
import {
  documentCategories,
  type DocumentCategory,
  type ProjectDocument,
} from "@/modules/documents/types";
import type { Project } from "@/modules/projects/types";

export type UploadedDocumentDraft = Omit<ProjectDocument, "id">;

function buildStatus(expiresAt: string) {
  if (!expiresAt) return "Válido" as const;

  const target = new Date(`${expiresAt}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target.getTime() < today.getTime() ? "Vencido" : "Válido";
}

export function DocumentUpload({
  project,
  onUpload,
}: {
  project: Project;
  onUpload?: (documents: UploadedDocumentDraft[]) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("Habilitação");
  const [linkedTo, setLinkedTo] = useState("Upload manual");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();

        const input = event.currentTarget.elements.namedItem("document-file");

        if (!(input instanceof HTMLInputElement) || !input.files?.[0]) {
          setMessage("Selecione um arquivo para enviar.");
          return;
        }

        const file = input.files[0];

        if (isBlockedVideo(file.name)) {
          setMessage("Vídeos devem ser cadastrados como links externos.");
          input.value = "";
          setSelectedFileName("");
          return;
        }

        if (!isAllowedDocument(file.name)) {
          setMessage("Formato não permitido.");
          input.value = "";
          setSelectedFileName("");
          return;
        }

        onUpload?.([
          {
            fileName: file.name,
            category,
            projectId: project.id,
            linkedTo,
            uploadedAt: new Date().toISOString().slice(0, 10),
            uploadedBy: "Equipe do projeto",
            expiresAt: expiresAt || null,
            notes: notes || `Arquivo local enviado: ${file.name}.`,
            status: buildStatus(expiresAt),
          },
        ]);

        input.value = "";
        setSelectedFileName("");
        setCategory("Habilitação");
        setLinkedTo("Upload manual");
        setExpiresAt("");
        setNotes("");
        setMessage(`${file.name} enviado e salvo neste navegador.`);
      }}
    >
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">Arquivo</span>
        <input
          name="document-file"
          className="form-input mt-1"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              setSelectedFileName("");
              return;
            }
            if (isBlockedVideo(file.name)) {
              setMessage("Vídeos devem ser cadastrados como links externos.");
              event.target.value = "";
              setSelectedFileName("");
              return;
            }
            if (!isAllowedDocument(file.name)) {
              setMessage("Formato não permitido.");
              event.target.value = "";
              setSelectedFileName("");
              return;
            }
            setSelectedFileName(file.name);
            setMessage(`${file.name} pronto para upload.`);
          }}
        />
        {selectedFileName ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Arquivo selecionado: {selectedFileName}
          </p>
        ) : null}
      </label>
      <label className="block">
        <span className="text-sm font-medium">Categoria</span>
        <select
          className="form-input mt-1"
          value={category}
          onChange={(event) => setCategory(event.target.value as DocumentCategory)}
        >
          {documentCategories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Projeto vinculado</span>
        <select className="form-input mt-1" value={project.id} disabled>
          <option value={project.id}>{project.name}</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Vinculado a</span>
        <input
          className="form-input mt-1"
          value={linkedTo}
          onChange={(event) => setLinkedTo(event.target.value)}
          placeholder="Ex.: Habilitação documental, prestação, equipe..."
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Validade</span>
        <input
          className="form-input mt-1"
          type="date"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Observações</span>
        <textarea
          className="form-input mt-1 min-h-24"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Observações rápidas sobre este documento"
        />
      </label>
      <Button type="submit">
        <Upload className="size-4" />
        Enviar documento
      </Button>
    </form>
  );
}
