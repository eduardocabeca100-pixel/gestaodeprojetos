import { Bell, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CurrentProfile } from "@/lib/auth/require-role";

export function Topbar({ profile }: { profile: CurrentProfile }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/92 backdrop-blur">
      <div className="flex h-16 w-full min-w-0 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="ml-11 flex flex-1 items-center gap-3 lg:ml-0">
          <label className="relative hidden w-full max-w-lg sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-9 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm shadow-sm transition focus:border-primary focus:ring-3 focus:ring-primary/15"
              placeholder="Buscar projetos, documentos e relatórios"
            />
          </label>
          <div className="hidden items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 md:flex">
            <ShieldCheck className="size-4" />
            Rotas protegidas
          </div>
        </div>
        <Button variant="outline" size="icon" aria-label="Notificações">
          <Bell className="size-4 text-amber-600" />
        </Button>
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-medium">{profile.name}</p>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
        </div>
      </div>
    </header>
  );
}
