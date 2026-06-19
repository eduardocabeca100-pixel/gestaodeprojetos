"use client";

import { useState } from "react";
import { LinkIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VideoLinkForm() {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<string>("Link de vídeo");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState("Pronto para cadastrar um link externo.");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !url.trim()) {
      setFeedback("Preencha título e link para cadastrar.");
      return;
    }

    setFeedback(`${kind} cadastrado: ${title}.`);
    setTitle("");
    setKind("Link de vídeo");
    setUrl("");
    setDescription("");
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <LinkIcon className="size-4 text-cyan-600" />
        Link externo
      </div>
      <input className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título" />
      <select className="form-input" value={kind} onChange={(event) => setKind(event.target.value)}>
        <option>Link de vídeo</option>
        <option>Link de pasta externa</option>
      </select>
      <input className="form-input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://drive.google.com/..." />
      <textarea className="form-input min-h-20" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição" />
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        {feedback}
      </div>
      <Button type="submit" variant="outline">
        <Plus className="size-4" />
        Cadastrar link
      </Button>
    </form>
  );
}
