"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isAllowedDocument, isBlockedVideo } from "@/lib/utils/file-validation";
import { documentCategories } from "@/modules/documents/types";

export function DocumentUpload() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("Documento validado para envio ao Supabase Storage.");
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
          className="form-input mt-1"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (isBlockedVideo(file.name)) {
              setMessage("Vídeos devem ser cadastrados como links externos.");
              event.target.value = "";
              return;
            }
            if (!isAllowedDocument(file.name)) {
              setMessage("Formato não permitido.");
              event.target.value = "";
              return;
            }
            setMessage(`${file.name} pronto para upload.`);
          }}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Categoria</span>
        <select className="form-input mt-1" defaultValue="Habilitação">
          {documentCategories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Projeto vinculado</span>
        <select className="form-input mt-1" defaultValue="refens">
          <option value="refens">Reféns</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Validade</span>
        <input className="form-input mt-1" type="date" />
      </label>
      <Button type="submit">
        <Upload className="size-4" />
        Enviar documento
      </Button>
    </form>
  );
}
