"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  FileSignature,
  FileText,
  Folder,
  Home,
  ImageIcon,
  LogOut,
  Menu,
  Plus,
  Paperclip,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CurrentProfile } from "@/lib/auth/require-role";
import { logout } from "@/modules/users/actions";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home, projectScoped: true },
  { label: "Projetos", href: "/projetos", icon: Folder },
  { label: "Documentos", href: "/documentos", icon: FileText, projectScoped: true },
  {
    label: "Docs Oficiais",
    href: "/documentos-oficiais",
    icon: FileSignature,
    projectScoped: true,
  },
  { label: "Cronograma", href: "/cronograma", icon: CalendarDays, projectScoped: true },
  { label: "Diário de classe", href: "/diario-de-classe", icon: ClipboardList, projectScoped: true },
  { label: "Edital e anexos", href: "/edital", icon: Paperclip, projectScoped: true },
  { label: "Financeiro", href: "/financeiro", icon: Wallet, projectScoped: true },
  { label: "Equipe", href: "/equipe", icon: Users, projectScoped: true },
  { label: "Participantes", href: "/participantes", icon: Users, projectScoped: true },
  { label: "Mídia", href: "/midia", icon: ImageIcon, projectScoped: true },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3, projectScoped: true },
  { label: "Notificações", href: "/notificacoes", icon: Bell, badge: "3" },
  { label: "Configurações", href: "/configuracoes/geral", icon: Settings },
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
  const [searchProjectId, setSearchProjectId] = useState<string | null>(null);
  const activeProjectId = searchProjectId ?? getProjectIdFromPathname(pathname);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSearchProjectId(new URLSearchParams(window.location.search).get("project"));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <aside
      className="flex h-[100dvh] flex-col overflow-hidden bg-sidebar text-sidebar-foreground"
      style={{ fontFamily: '"Arial Black", Arial, Helvetica, sans-serif' }}
    >
      <div className="flex shrink-0 items-center border-b border-sidebar-border px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-[2.15rem] font-black leading-none tracking-normal">
            VIVA
          </p>
          <p className="mt-1 truncate text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/70">
            Gestão Cultural
          </p>
        </div>
      </div>

      <div className="shrink-0 px-4 py-3">
        <Button asChild className="h-10 w-full justify-start bg-sidebar-primary px-4 text-sm font-semibold">
          <Link href="/projetos/novo">
            <Plus className="size-4" />
            Novo Projeto
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">
        {navigation.map((item) => {
          const Icon = item.icon;
          const href =
            "projectScoped" in item && item.projectScoped && activeProjectId
              ? `${item.href}?project=${activeProjectId}`
              : item.href;
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.href === "/projetos" && pathname.startsWith("/projetos/")) ||
            (item.href === "/configuracoes/geral" &&
              pathname.startsWith("/configuracoes"));

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-lg px-3 text-[0.92rem] font-semibold text-sidebar-foreground/78 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-[15px] shrink-0" />
              <span>{item.label}</span>
              {"badge" in item ? (
                <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-[11px] text-sidebar-primary-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="mb-2.5 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold">
            {profile.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-4">{profile.name}</p>
            <p className="truncate text-[11px] leading-4 text-sidebar-foreground/65">
              {profile.role === "super_admin"
                ? "Super Admin"
                : profile.role === "admin"
                  ? "Administrador Geral"
                  : "Diretor Executivo"}
            </p>
          </div>
        </div>
        <form action={logout}>
          <Button
            className="h-10 w-full justify-start border-sidebar-border bg-transparent text-sm text-sidebar-foreground hover:bg-sidebar-accent"
            variant="outline"
            type="submit"
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </form>
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

      <div className="fixed inset-y-0 left-0 z-30 hidden w-[272px] lg:block">
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
          <div className="absolute inset-y-0 left-0 w-[272px] max-w-[86vw]">
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
