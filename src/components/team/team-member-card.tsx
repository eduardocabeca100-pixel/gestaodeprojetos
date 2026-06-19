import { Mail, Phone, Wallet } from "lucide-react";

import { PaymentStatus } from "@/components/team/payment-status";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { TeamMember } from "@/modules/team/types";

export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{member.name}</h3>
          <p className="mt-1 text-sm text-primary">{member.role}</p>
        </div>
        <PaymentStatus value={member.paymentStatus} />
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Phone className="size-4" />
          {member.phone}
        </p>
        <p className="flex items-center gap-2">
          <Mail className="size-4" />
          {member.email}
        </p>
        <p className="flex items-center gap-2">
          <Wallet className="size-4" />
          {formatCurrency(member.paidAmount)} de {formatCurrency(member.expectedAmount)}
        </p>
      </div>
    </article>
  );
}
