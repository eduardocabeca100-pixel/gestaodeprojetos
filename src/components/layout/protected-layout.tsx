import type { ReactNode } from "react";

import { requireAuthorizedProfile } from "@/lib/auth/require-role";

import { AppSidebar } from "./app-sidebar";
import { AppearanceSync } from "./appearance-sync";
import { Topbar } from "./topbar";
import { PasswordResetGate } from "./password-reset-gate";

export async function ProtectedLayout({ children }: { children: ReactNode }) {
  const profile = await requireAuthorizedProfile();

  return (
    <PasswordResetGate profile={profile}>
      <div className="min-h-screen bg-background">
        <AppearanceSync />
        <AppSidebar profile={profile} />
        <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden lg:pl-[var(--viva-sidebar-width)]">
          <Topbar profile={profile} />
          {children}
        </div>
      </div>
    </PasswordResetGate>
  );
}
