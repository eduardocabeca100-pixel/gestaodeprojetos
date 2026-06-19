import { BookOpen } from "lucide-react";

export function ClassPlanForm() {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <BookOpen className="mb-3 size-5 text-primary" />
      <p className="text-sm font-semibold">Plano de aula</p>
      <div className="mt-3 space-y-3">
        <input className="form-input" placeholder="Tema" />
        <textarea className="form-input min-h-20" placeholder="Objetivo" />
        <textarea className="form-input min-h-20" placeholder="Observações pedagógicas" />
      </div>
    </div>
  );
}
