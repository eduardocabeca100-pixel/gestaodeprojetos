"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mediaCategories, mediaTypes } from "@/modules/media/types";

export function MediaUpload() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("Foto");
  const [category, setCategory] = useState<string>("Aulas");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState("Pronto para enviar mídia.");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setFeedback("Informe um título para a mídia.");
      return;
    }

    setFeedback(`${type} de ${category} preparada: ${title}.`);
    setTitle("");
    setType("Foto");
    setCategory("Aulas");
    setDescription("");
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <input className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título" />
      <select className="form-input" value={type} onChange={(event) => setType(event.target.value)}>
        {mediaTypes.filter((type) => !type.includes("Link")).map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <select className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}>
        {mediaCategories.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
      <input className="form-input" type="file" accept="image/*,.png,.jpg,.jpeg" />
      <textarea className="form-input min-h-20" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição" />
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        {feedback}
      </div>
      <Button type="submit">
        <Upload className="size-4" />
        Enviar imagem
      </Button>
    </form>
  );
}
