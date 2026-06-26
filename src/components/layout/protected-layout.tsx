import type { ReactNode } from "react";

import { requireAuthorizedProfile } from "@/lib/auth/require-role";

import { AppSidebar } from "./app-sidebar";
import { AppearanceSync } from "./appearance-sync";
import { PasswordResetGate } from "./password-reset-gate";
import { ProjectRouteGuard } from "./project-route-guard";
import { ProtectedEnhancers } from "./protected-enhancers";
import { Topbar } from "./topbar";

export async function ProtectedLayout({ children }: { children: ReactNode }) {
  const profile = await requireAuthorizedProfile();

  return (
    <PasswordResetGate profile={profile}>
      <div className="min-h-screen lg:pl-64 bg-background">
        <AppearanceSync />
        <ProjectRouteGuard />
        <AppSidebar profile={profile} />
        <div className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden lg:pl-[var(--viva-sidebar-width)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(99,102,241,0.12),transparent_24%),radial-gradient(circle_at_100%_8%,rgba(45,212,191,0.12),transparent_18%)]" />
          <Topbar profile={profile} />
          <ProtectedEnhancers />
          <div className="relative">{children}</div>
        </div>
      </div>
    </PasswordResetGate>
  );
}
