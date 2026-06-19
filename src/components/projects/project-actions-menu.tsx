"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, Copy, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProjectActionsMenu() {
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      <Button asChild variant="outline">
        <Link href="#editar-projeto">
          <Edit className="size-4" />
          Editar
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/projetos/novo">
          <Copy className="size-4" />
          Duplicar
        </Link>
      </Button>
      <Button
        type="button"
        variant="destructive"
        onClick={() => setMessage("Projeto marcado para arquivamento.")}
      >
        <Archive className="size-4" />
        Arquivar
      </Button>
    </div>
  );
}
