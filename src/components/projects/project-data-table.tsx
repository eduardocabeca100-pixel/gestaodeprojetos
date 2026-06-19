"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import type { Project } from "@/modules/projects/types";

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Projeto",
    cell: ({ row }) => (
      <div>
        <Link
          className="font-medium text-primary"
          href={`/projetos/${row.original.id}`}
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
];

export function ProjectDataTable({ projects }: { projects: Project[] }) {
  return (
    <DataTable
      columns={columns}
      data={projects}
      searchPlaceholder="Buscar por projeto, edital ou status"
    />
  );
}
