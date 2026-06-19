import { Eye } from "lucide-react";

export function ReportPreview() {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="mb-4 flex h-64 items-center justify-center rounded-lg bg-muted">
        <Eye className="size-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">Prévia institucional</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Capa, dados do projeto, cronograma, financeiro, equipe e anexos.
      </p>
    </div>
  );
}
