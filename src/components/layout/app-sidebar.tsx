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
  Database,
  FileArchive,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CurrentProfile } from "@/lib/auth/require-role";
import { can } from "@/lib/auth/permissions";
import { logout } from "@/modules/users/actions";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home, projectScoped: true },
  { label: "Projetos", href: "/projetos", icon: Folder },
  { label: "Documentos", href: "/documentos", icon: FileText, projectScoped: true }, { label: "Anexos", href: "/anexos", icon: FileArchive, projectScoped: true }, 
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
  { label: "Gestão", href: "/gestao", icon: ClipboardList, projectScoped: true }, { label: "Relatórios", href: "/relatorios", icon: BarChart3, projectScoped: true },
  { label: "Notificações", href: "/notificacoes", icon: Bell, badge: "3" },
  { label: "Modelo de PDF", href: "/configuracoes/pdf", icon: FileText }, { label: "Importar Reféns", href: "/configuracoes/importar-refens", icon: Database },  { label: "Configurações", href: "/configuracoes/geral", icon: Settings },
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
  const visibleNavigation = navigation.filter(
    (item) =>
      item.href !== "/configuracoes/geral" || can(profile.role, "change_settings"),
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSearchProjectId(new URLSearchParams(window.location.search).get("project"));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <aside
      className="flex h-[100dvh] w-[var(--viva-sidebar-width)] flex-col overflow-hidden bg-sidebar text-sidebar-foreground"
      style={{ fontFamily: "var(--font-viva-heading)" }}
    >
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

      <div className="shrink-0 px-3 py-2.5">
        {can(profile.role, "create_project") ? (
          <Button asChild className="h-[var(--viva-button-height)] w-full justify-start bg-sidebar-primary px-3.5 text-[0.88rem] font-semibold">
            <Link href="/projetos/novo">
              <Plus className="size-4" />
              Novo Projeto
            </Link>
          </Button>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-sidebar-foreground/70">
            Acesso somente aos projetos liberados
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 pb-3 [scrollbar-width:thin]">
        <nav className="space-y-1">
          {visibleNavigation.map((item) => {
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
                  "flex h-[var(--viva-sidebar-item-height)] items-center gap-2 rounded-lg px-3 text-[0.86rem] font-semibold text-sidebar-foreground/78 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
              <Icon className="viva-sidebar-icon size-[15px] shrink-0" />
              <span className="viva-sidebar-label">{item.label}</span>
                {"badge" in item ? (
                  <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-[10px] text-sidebar-primary-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <div className="mt-2 border-t border-sidebar-border pt-2.5">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-[0.78rem] font-semibold">
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
                className="h-[var(--viva-button-height)] w-full justify-start border-sidebar-border bg-transparent text-[0.86rem] text-sidebar-foreground hover:bg-sidebar-accent"
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
