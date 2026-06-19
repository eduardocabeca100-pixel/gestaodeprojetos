import { CheckCircle2, XCircle } from "lucide-react";

export function AuthorizationStatus({ authorized }: { authorized: boolean }) {
  return (
    <span className={authorized ? "inline-flex items-center gap-1 text-emerald-700" : "inline-flex items-center gap-1 text-amber-700"}>
      {authorized ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
      {authorized ? "Autorizado" : "Pendente"}
    </span>
  );
}
