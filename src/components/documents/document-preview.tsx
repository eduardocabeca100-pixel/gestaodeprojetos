import { Download, Eye, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DocumentPreview() {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="mb-4 flex h-36 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Eye className="size-8" />
      </div>
      <p className="text-sm font-medium">Pré-visualização</p>
      <p className="mt-1 text-sm text-muted-foreground">
        PDFs e imagens podem ser exibidos aqui antes do download.
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="size-3.5" />
          Baixar
        </Button>
        <Button variant="outline" size="sm">
          <RefreshCcw className="size-3.5" />
          Substituir
        </Button>
      </div>
    </div>
  );
}
