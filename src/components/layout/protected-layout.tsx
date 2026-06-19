import type { ReactNode } from "react";

import { requireAuthorizedProfile } from "@/lib/auth/require-role";

import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";

export async function ProtectedLayout({ children }: { children: ReactNode }) {
  const profile = await requireAuthorizedProfile();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar profile={profile} />
      <div className="flex min-h-screen flex-col lg:pl-72">
        <Topbar profile={profile} />
        {children}
      </div>
    </div>
  );
}
