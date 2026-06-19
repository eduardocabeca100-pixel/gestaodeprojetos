import { Mail, Phone } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { AuthorizationStatus } from "@/components/participants/authorization-status";
import { AttendanceStatus } from "@/components/participants/attendance-status";
import type { Participant } from "@/modules/participants/types";

export function ParticipantCard({ participant }: { participant: Participant }) {
  const isAtRisk = participant.attendanceRate < 75;

  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{participant.fullName}</h3>
            <span className={isAtRisk ? "rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700" : "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"}>
              {participant.attendanceRate}%
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {participant.city} - {participant.neighborhood}
          </p>
        </div>
        <StatusBadge value={participant.status} />
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Phone className="size-4" />
          {participant.phone}
        </p>
        {participant.email ? (
          <p className="flex items-center gap-2">
            <Mail className="size-4" />
            {participant.email}
          </p>
        ) : null}
        {participant.address ? <p className="text-xs">{participant.address}</p> : null}
        <AuthorizationStatus authorized={participant.imageAuthorization} />
        <p className="text-xs text-muted-foreground">
          {participant.imageAuthorizationFileName ?? "Sem arquivo de imagem"}
        </p>
        <p className="text-xs text-muted-foreground">
          {participant.participationAuthorizationFileName ?? "Sem termo de participação"}
        </p>
      </div>
      <div className="mt-4">
        <AttendanceStatus rate={participant.attendanceRate} />
      </div>
    </article>
  );
}
