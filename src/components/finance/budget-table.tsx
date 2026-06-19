"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { BudgetItem } from "@/modules/finance/types";

const columns: ColumnDef<BudgetItem>[] = [
  { accessorKey: "category", header: "Categoria" },
  {
    accessorKey: "name",
    header: "Rubrica",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{row.original.notes}</p>
      </div>
    ),
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
    id: "remaining",
    header: "Saldo",
    cell: ({ row }) =>
      formatCurrency(row.original.approvedAmount - row.original.executedAmount),
  },
];

export function BudgetTable({ items }: { items: BudgetItem[] }) {
  return <DataTable columns={columns} data={items} searchPlaceholder="Buscar rubricas" />;
}
