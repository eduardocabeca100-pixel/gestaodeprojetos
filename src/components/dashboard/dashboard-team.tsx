import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { TeamMember } from "@/modules/team/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "VC";
}

export function DashboardTeam({
  projectId,
  members,
}: {
  projectId: string;
  members: TeamMember[];
}) {
  return (
    <SectionCard
      title="Equipe do projeto"
      description="Pessoas com lançamento ativo neste projeto."
      actions={
        <Button asChild className="rounded-2xl" variant="outline">
          <Link href={`/equipe?project=${projectId}`}>
            Ver equipe
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-3">
        {members.slice(0, 4).map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-[1.1rem] border border-white/80 bg-white/86 p-3 shadow-[0_18px_36px_-32px_rgba(37,99,235,0.28)]"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-sm font-black text-white">
              {getInitials(member.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950">
                {member.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {member.role}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-950">
                {formatCurrency(member.paidAmount)}
              </p>
              <p className="text-xs text-muted-foreground">{member.paymentStatus}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
