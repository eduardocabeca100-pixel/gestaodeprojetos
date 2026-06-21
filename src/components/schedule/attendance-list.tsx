import { CheckCircle2, FileText } from "lucide-react";

export function AttendanceList() {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-primary" />
        <p className="text-sm font-semibold">Lista de presença</p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
        Nenhum participante cadastrado ainda. Assim que os alunos forem adicionados, a chamada aparece aqui.
      </div>
    </div>
  );
}
