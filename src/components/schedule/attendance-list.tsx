import { CheckCircle2, FileText } from "lucide-react";

export function AttendanceList() {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-primary" />
        <p className="text-sm font-semibold">Lista de presença</p>
      </div>
      {["Participante 01", "Participante 02", "Participante 03"].map((name) => (
        <div key={name} className="flex items-center justify-between text-sm">
          <span>{name}</span>
          <CheckCircle2 className="size-4 text-emerald-600" />
        </div>
      ))}
    </div>
  );
}
