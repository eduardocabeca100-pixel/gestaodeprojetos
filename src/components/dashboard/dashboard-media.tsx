import { Copy, ImageIcon, LinkIcon } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/modules/media/types";

export function DashboardMedia({ mediaItems }: { mediaItems: MediaItem[] }) {
  return (
    <SectionCard
      title="Fotos e comprovações"
      description="Registros selecionados para relatório."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {mediaItems.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-white p-3">
            <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {item.type.includes("Link") ? (
                <LinkIcon className="size-6 text-cyan-600" />
              ) : (
                <ImageIcon className="size-6 text-primary" />
              )}
            </div>
            <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
            {item.type.includes("Link") ? (
              <Button className="mt-3 w-full" variant="outline" size="sm">
                <Copy className="size-3.5" />
                Copiar link
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
