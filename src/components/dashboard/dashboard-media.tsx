import { Copy, ImageIcon, LinkIcon } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/modules/media/types";

export function DashboardMedia({ mediaItems }: { mediaItems: MediaItem[] }) {
  return (
    <SectionCard
      title="Fotos e comprovações"
      description="Registros reais selecionados para comprovação."
    >
      {mediaItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-muted-foreground">
          Nenhuma mídia cadastrada para este projeto ainda.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {mediaItems.map((item) => (
            <div key={item.id} className="rounded-[1.2rem] border border-white/80 bg-white/86 p-3 shadow-[0_18px_36px_-32px_rgba(56,189,248,0.34)]">
              <div className="mb-3 flex h-20 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(238,242,255,0.92))] text-muted-foreground">
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
      )}
    </SectionCard>
  );
}
