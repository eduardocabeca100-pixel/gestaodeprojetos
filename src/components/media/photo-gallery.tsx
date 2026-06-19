import { ImageIcon } from "lucide-react";

import type { MediaItem } from "@/modules/media/types";

export function PhotoGallery({ items }: { items: MediaItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-white">
          <div className="flex h-32 items-center justify-center bg-muted">
            <ImageIcon className="size-8 text-primary" />
          </div>
          <div className="p-4">
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.category}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
