import type { ReactNode } from "react";

import { TeamCastingFinancialFieldsCleanup } from "@/components/team/team-casting-financial-fields-cleanup";

export default function EquipeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TeamCastingFinancialFieldsCleanup />
      {children}
    </>
  );
}
