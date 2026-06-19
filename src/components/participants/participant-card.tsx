import { Mail, Phone } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { AuthorizationStatus } from "@/components/participants/authorization-status";
import { AttendanceStatus } from "@/components/participants/attendance-status";
import type { Participant } from "@/modules/participants/types";

export function ParticipantCard({ participant }: { participant: Participant }) {
  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{participant.fullName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{participant.neighborhood}</p>
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
        <AuthorizationStatus authorized={participant.imageAuthorization} />
      </div>
      <div className="mt-4">
        <AttendanceStatus rate={participant.attendanceRate} />
      </div>
    </article>
  );
}
