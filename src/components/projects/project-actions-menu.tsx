"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Archive, Copy, Edit, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { archiveProject } from "@/modules/projects/actions";

export function ProjectActionsMenu({
  projectId,
  canDuplicate,
  canArchive,
}: {
  projectId: string;
  canDuplicate: boolean;
  canArchive: boolean;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    if (!window.confirm("Arquivar este projeto? Ele sairá da lista de projetos ativos.")) {
      return;
    }

    setMessage("");

    startTransition(async () => {
      const result = await archiveProject(projectId);
      setMessage(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}

      <Button asChild variant="outline">
        <Link href="#editar-projeto">
          <Edit className="size-4" />
          Editar
        </Link>
      </Button>

      {canDuplicate ? (
        <Button asChild variant="outline">
          <Link href="/projetos/novo">
            <Copy className="size-4" />
            Duplicar
          </Link>
        </Button>
      ) : null}

      {canArchive ? (
        <Button type="button" variant="destructive" onClick={handleArchive} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
          {pending ? "Arquivando..." : "Arquivar"}
        </Button>
      ) : null}
    </div>
  );
}
