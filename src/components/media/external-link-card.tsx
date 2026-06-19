"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/modules/media/types";

export function ExternalLinkCard({ item }: { item: MediaItem }) {
  const [feedback, setFeedback] = useState("Link pronto para copiar.");

  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <ExternalLink className="mb-3 size-5 text-cyan-600" />
      <h3 className="font-semibold">{item.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      <Button
        className="mt-4 w-full"
        variant="outline"
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(item.url ?? "");
          setFeedback("Link copiado para a área de transferência.");
        }}
      >
        <Copy className="size-4" />
        Copiar link
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">{feedback}</p>
    </article>
  );
}
