"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Trash2 } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format-date";
import type { ProjectDocument } from "@/modules/documents/types";

type DocumentListProps = {
  documents: ProjectDocument[];
  onView: (document: ProjectDocument) => void;
  onDelete: (documentId: string) => void;
};

const columns = ({
  onView,
  onDelete,
}: Pick<DocumentListProps, "onView" | "onDelete">): ColumnDef<ProjectDocument>[] => [
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
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => onView(row.original)}>
          <Eye className="size-3.5" />
          Visualizar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => onDelete(row.original.id)}
        >
          <Trash2 className="size-3.5" />
          Excluir
        </Button>
      </div>
    ),
  },
];

export function DocumentList({ documents, onView, onDelete }: DocumentListProps) {
  return (
    <DataTable
      columns={columns({ onView, onDelete })}
      data={documents}
      searchPlaceholder="Buscar documentos"
    />
  );
}
