import { Archive, Copy, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProjectActionsMenu() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline">
        <Edit className="size-4" />
        Editar
      </Button>
      <Button variant="outline">
        <Copy className="size-4" />
        Duplicar
      </Button>
      <Button variant="destructive">
        <Archive className="size-4" />
        Arquivar
      </Button>
    </div>
  );
}
