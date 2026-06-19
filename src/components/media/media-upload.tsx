import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mediaCategories, mediaTypes } from "@/modules/media/types";

export function MediaUpload() {
  return (
    <form className="grid gap-3">
      <input className="form-input" placeholder="Título" />
      <select className="form-input" defaultValue="Foto">
        {mediaTypes.filter((type) => !type.includes("Link")).map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <select className="form-input" defaultValue="Aulas">
        {mediaCategories.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
      <input className="form-input" type="file" accept="image/*,.png,.jpg,.jpeg" />
      <textarea className="form-input min-h-20" placeholder="Descrição" />
      <Button type="button">
        <Upload className="size-4" />
        Enviar imagem
      </Button>
    </form>
  );
}
