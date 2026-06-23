import { Bell, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CurrentProfile } from "@/lib/auth/require-role";

export function Topbar({ profile }: { profile: CurrentProfile }) {
  const roleLabel =
    profile.role === "super_admin"
      ? "Super Admin"
      : profile.role === "admin"
        ? "Administrador Geral"
        : profile.role === "diretor_executivo"
          ? "Direção Executiva"
          : profile.role === "editor_projeto"
            ? "Produtor"
            : "Equipe do projeto";

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/78 backdrop-blur-xl">
      <div className="flex h-[calc(var(--viva-topbar-height)+0.5rem)] w-full min-w-0 items-center gap-3 px-4 sm:px-5 lg:px-6">
        <div className="ml-11 flex flex-1 items-center gap-3 lg:ml-0">
          <div className="hidden items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3 py-1.5 text-[11px] font-semibold text-violet-700 xl:flex">
            <span className="inline-flex size-2 rounded-full bg-emerald-500" />
            Projeto ativo
          </div>
          <label className="relative hidden w-full max-w-lg sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-2xl border border-white bg-white/92 pl-9 pr-3 text-[13px] shadow-[0_18px_34px_-28px_rgba(37,99,235,0.4)] transition focus:border-primary focus:ring-3 focus:ring-primary/15"
              placeholder="Buscar projetos, documentos e relatórios"
            />
          </label>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 md:flex">
            <ShieldCheck className="size-4" />
            Rotas protegidas
          </div>
        </div>
        <Button className="rounded-2xl border-white/80 bg-white/90 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.45)]" variant="outline" size="icon" aria-label="Notificações">
          <Bell className="size-4 text-amber-600" />
        </Button>
        <div className="hidden items-center gap-3 rounded-[1.25rem] border border-white/80 bg-white/90 px-3 py-2 shadow-[0_18px_36px_-28px_rgba(37,99,235,0.35)] sm:flex">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-sm font-black text-white">
            {profile.name.slice(0, 1)}
          </div>
          <div className="min-w-0 text-right">
            <p className="truncate text-[13px] font-semibold">{profile.name}</p>
            <p className="text-[11px] text-muted-foreground">{roleLabel} - {profile.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
