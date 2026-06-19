"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/format-date";
import type { ProjectDocument } from "@/modules/documents/types";

const columns: ColumnDef<ProjectDocument>[] = [
  {
    accessorKey: "fileName",
    header: "Arquivo",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.fileName}</p>
        <p className="mt-1 text-xs text-muted-foreground">{row.original.notes}</p>
      </div>
    ),
  },
  { accessorKey: "category", header: "Categoria" },
  {
    accessorKey: "uploadedAt",
    header: "Envio",
    cell: ({ row }) => formatDate(row.original.uploadedAt),
  },
  {
    accessorKey: "expiresAt",
    header: "Validade",
    cell: ({ row }) => (row.original.expiresAt ? formatDate(row.original.expiresAt) : "Sem validade"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge value={row.original.status} />,
  },
];

export function DocumentList({ documents }: { documents: ProjectDocument[] }) {
  return <DataTable columns={columns} data={documents} searchPlaceholder="Buscar documentos" />;
}
