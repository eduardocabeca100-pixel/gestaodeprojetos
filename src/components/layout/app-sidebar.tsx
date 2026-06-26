"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Folder,
  Home,
  ImageIcon,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { can } from "@/lib/auth/permissions";
import type { CurrentProfile } from "@/lib/auth/require-role";
import {
  ACTIVE_PROJECT_EVENT,
  getActiveProjectScope,
  type ActiveProjectScope,
} from "@/lib/project-scope";
import { cn } from "@/lib/utils";
import { logout } from "@/modules/users/actions";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home, projectScoped: true },
  { label: "Central Cultural", href: "/central-cultural", icon: ClipboardList, projectScoped: true },
  { label: "Projetos", href: "/projetos", icon: Folder },
  { label: "Documentos do projeto", href: "/documentos", icon: FileText, projectScoped: true },
  { label: "Docs Oficiais", href: "/documentos-oficiais", icon: FileText, projectScoped: true },
  { label: "Cronograma", href: "/cronograma", icon: CalendarDays, projectScoped: true },
  { label: "Diário de classe", href: "/diario-de-classe", icon: ClipboardList, projectScoped: true },
  { label: "Financeiro", href: "/financeiro", icon: Wallet, projectScoped: true },
  { label: "Equipe", href: "/equipe", icon: Users, projectScoped: true },
  { label: "Participantes", href: "/participantes", icon: Users, projectScoped: true },
  { label: "Mídia", href: "/midia", icon: ImageIcon, projectScoped: true },
  { label: "Configurações", href: "/configuracoes/usuarios", icon: Settings },
];

function getProjectIdFromPathname(pathname: string) {
  const [, section, projectId] = pathname.split("/");

  if (section !== "projetos" || !projectId) {
    return null;
  }

  if (projectId === "novo" || projectId === "selecionar") {
    return null;
  }

  return projectId;
}

function SidebarContent({ profile }: { profile: CurrentProfile }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [storedProject, setStoredProject] = useState<ActiveProjectScope | null>(null);

  useEffect(() => {
    const syncProject = () => {
      const scope = getActiveProjectScope();
      setStoredProject(scope.id === "sem-projeto" ? null : scope);
    };

    syncProject();
    window.addEventListener(ACTIVE_PROJECT_EVENT, syncProject as EventListener);
    window.addEventListener("storage", syncProject);

    return () => {
      window.removeEventListener(ACTIVE_PROJECT_EVENT, syncProject as EventListener);
      window.removeEventListener("storage", syncProject);
    };
  }, [pathname]);

  const activeProjectId =
    searchParams.get("project") ?? getProjectIdFromPathname(pathname) ?? storedProject?.id ?? null;

  const visibleNavigation = navigation.filter(
    (item) =>
      item.href !== "/configuracoes/usuarios" || can(profile.role, "change_settings"),
  );

  return (
    <aside
      className="relative flex h-[100dvh] w-[var(--viva-sidebar-width)] flex-col overflow-hidden border-r border-white/8 bg-[linear-gradient(180deg,#06112f_0%,#0a1332_20%,#12103e_52%,#090d22_100%)] text-sidebar-foreground shadow-[18px_0_60px_-42px_rgba(15,23,42,0.9)]"
      style={{ fontFamily: "var(--font-viva-heading)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(96,165,250,0.24),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(168,85,247,0.24),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.14),transparent_28%)]" />

      <div className="flex shrink-0 items-center border-b border-sidebar-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[1.9rem] font-black leading-none tracking-normal">
            VIVA
          </p>
          <p className="mt-1 truncate text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/70">
            Gestão Cultural
          </p>
        </div>
      </div>

      <div className="relative shrink-0 px-3 py-3">
        {can(profile.role, "create_project") ? (
          <Button asChild className="h-12 w-full justify-start rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#6d28d9_100%)] px-4 text-[0.9rem] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(99,102,241,0.88)] hover:opacity-95">
            <Link href="/projetos/novo">
              <Plus className="size-4" />
              Novo Projeto
            </Link>
          </Button>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-sidebar-foreground/70 backdrop-blur">
            Acesso somente aos projetos liberados
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-2.5 pb-3 [scrollbar-width:thin]">
        <nav className="space-y-1">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const href =
              item.projectScoped && activeProjectId
                ? `${item.href}?project=${activeProjectId}`
                : item.href;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/projetos" && pathname.startsWith("/projetos/")) ||
              (item.href === "/configuracoes/usuarios" && pathname.startsWith("/configuracoes"));

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-2xl px-3 text-[0.86rem] font-semibold text-sidebar-foreground/80 transition hover:bg-white/8 hover:text-sidebar-accent-foreground",
                  active &&
                    "bg-[linear-gradient(90deg,rgba(99,102,241,0.45),rgba(37,99,235,0.18))] text-sidebar-accent-foreground shadow-[0_16px_28px_-24px_rgba(96,165,250,0.85)] ring-1 ring-white/10",
                )}
              >
                <Icon className="viva-sidebar-icon size-[15px] shrink-0" />
                <span className="viva-sidebar-label">{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-3 backdrop-blur">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-[0.88rem] font-semibold text-white shadow-[0_12px_28px_-18px_rgba(99,102,241,0.95)]">
                {profile.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold leading-4">{profile.name}</p>
                <p className="truncate text-[10.5px] leading-4 text-sidebar-foreground/65">
                  {profile.role === "super_admin"
                    ? "Super Admin"
                    : profile.role === "admin"
                      ? "Administrador Geral"
                      : profile.role === "diretor_executivo"
                        ? "Diretor Executivo"
                        : profile.role === "editor_projeto"
                          ? "Produtor"
                          : "Equipe do projeto"}
                </p>
              </div>
            </div>

            <form action={logout}>
              <Button
                className="h-11 w-full justify-start rounded-2xl border-white/10 bg-transparent text-[0.86rem] text-sidebar-foreground hover:bg-white/8"
                variant="outline"
                type="submit"
              >
                <LogOut className="size-4" />
                Sair
              </Button>
            </form>
          </div>
        </nav>
      </div>
    </aside>
  );
}

export function AppSidebar({ profile }: { profile: CurrentProfile }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="fixed left-4 top-4 z-40 flex size-9 items-center justify-center rounded-lg border border-border bg-white shadow-sm lg:hidden"
        type="button"
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>

      <div className="fixed inset-y-0 left-0 z-30 hidden w-[var(--viva-sidebar-width)] lg:block">
        <SidebarContent profile={profile} />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar menu"
            type="button"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[var(--viva-sidebar-width)] max-w-[86vw]">
            <SidebarContent profile={profile} />
          </div>
          <button
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg bg-white text-foreground"
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>
      ) : null}
    </>
  );
}
