"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Trash2 } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { setActiveProjectScope } from "@/lib/project-scope";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { deleteProject } from "@/modules/projects/actions";
import type { Project } from "@/modules/projects/types";

export function ProjectDataTable({
  projects,
  canDelete = false,
}: {
  projects: Project[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(project: Project) {
    const first = window.confirm(
      `Excluir definitivamente o projeto "${project.name}"? Essa ação apaga dados vinculados e não deve ser usada sem backup.`,
    );

    if (!first) return;

    const typed = window.prompt('Para confirmar, digite exatamente: EXCLUIR');

    if (typed !== "EXCLUIR") {
      window.alert("Exclusão cancelada.");
      return;
    }

    startTransition(async () => {
      const result = await deleteProject(project.id);
      window.alert(result.message);
      router.refresh();
    });
  }

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: "Projeto",
      cell: ({ row }) => (
        <div>
          <Link
            className="font-medium text-primary"
            href={`/dashboard?project=${row.original.id}`}
            onClick={() =>
              setActiveProjectScope({
                id: row.original.id,
                name: row.original.name,
                slug: row.original.slug,
              })
            }
          >
            {row.original.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{row.original.edital}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
    },
    {
      accessorKey: "approvedAmount",
      header: "Aprovado",
      cell: ({ row }) => formatCurrency(row.original.approvedAmount),
    },
    {
      accessorKey: "executedAmount",
      header: "Executado",
      cell: ({ row }) => formatCurrency(row.original.executedAmount),
    },
    {
      accessorKey: "endDate",
      header: "Prazo",
      cell: ({ row }) => formatDate(row.original.endDate),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link
              href={`/projetos/${row.original.id}`}
              onClick={() =>
                setActiveProjectScope({
                  id: row.original.id,
                  name: row.original.name,
                  slug: row.original.slug,
                })
              }
            >
              <ExternalLink className="size-3.5" />
              Abrir
            </Link>
          </Button>

          {canDelete ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => handleDelete(row.original)}
            >
              <Trash2 className="size-3.5" />
              Excluir
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={projects}
      searchPlaceholder="Buscar por projeto, edital ou status"
    />
  );
}
