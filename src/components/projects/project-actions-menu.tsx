"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Copy, Edit, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { archiveProject, deleteProject } from "@/modules/projects/actions";

export function ProjectActionsMenu({
  projectId,
  canDuplicate,
  canArchive,
}: {
  projectId: string;
  canDuplicate: boolean;
  canArchive: boolean;
}) {
  const router = useRouter();
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
      router.refresh();
    });
  }

  function handleDelete() {
    const first = window.confirm(
      "Excluir este projeto definitivamente? Isso apaga documentos, financeiro, equipe, cronograma e relatórios vinculados a ele.",
    );

    if (!first) return;

    const typed = window.prompt('Para confirmar, digite exatamente: EXCLUIR');

    if (typed !== "EXCLUIR") {
      setMessage("Exclusão cancelada. A confirmação não foi digitada.");
      return;
    }

    setMessage("");

    startTransition(async () => {
      const result = await deleteProject(projectId);
      setMessage(result.message);

      if (result.ok) {
        router.push("/projetos");
        router.refresh();
      }
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
        <Button type="button" variant="outline" onClick={handleArchive} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
          {pending ? "Processando..." : "Arquivar"}
        </Button>
      ) : null}

      {canArchive ? (
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Excluir projeto
        </Button>
      ) : null}
    </div>
  );
}
