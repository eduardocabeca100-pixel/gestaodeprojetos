import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  Classificado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Em habilitação": "bg-amber-50 text-amber-700 ring-amber-200",
  "Em execução": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Planejamento: "bg-violet-50 text-violet-700 ring-violet-200",
  Válido: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Vencido: "bg-red-50 text-red-700 ring-red-200",
  Pendente: "bg-amber-50 text-amber-700 ring-amber-200",
  Pago: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Previsto: "bg-violet-50 text-violet-700 ring-violet-200",
  Ativo: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Gerado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rascunho: "bg-slate-50 text-slate-700 ring-slate-200",
};

export function StatusBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ring-1 ring-inset",
        toneMap[value] ?? "bg-slate-50 text-slate-700 ring-slate-200",
        className,
      )}
    >
      {value}
    </span>
  );
}
