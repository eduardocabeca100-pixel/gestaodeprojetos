import { LinkIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VideoLinkForm() {
  return (
    <form className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <LinkIcon className="size-4 text-cyan-600" />
        Link externo
      </div>
      <input className="form-input" placeholder="Título" />
      <select className="form-input" defaultValue="Link de vídeo">
        <option>Link de vídeo</option>
        <option>Link de pasta externa</option>
      </select>
      <input className="form-input" placeholder="https://drive.google.com/..." />
      <textarea className="form-input min-h-20" placeholder="Descrição" />
      <Button type="button" variant="outline">
        <Plus className="size-4" />
        Cadastrar link
      </Button>
    </form>
  );
}
