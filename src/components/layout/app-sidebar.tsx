"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
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
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CurrentProfile } from "@/lib/auth/require-role";
import { logout } from "@/modules/users/actions";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Projetos", href: "/projetos", icon: Folder },
  { label: "Documentos", href: "/documentos", icon: FileText },
  { label: "Cronograma", href: "/cronograma", icon: CalendarDays },
  { label: "Financeiro", href: "/financeiro", icon: Wallet },
  { label: "Equipe", href: "/equipe", icon: Users },
  { label: "Participantes", href: "/participantes", icon: Users },
  { label: "Mídia", href: "/midia", icon: ImageIcon },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Notificações", href: "/notificacoes", icon: Bell, badge: "3" },
  { label: "Configurações", href: "/configuracoes/geral", icon: Settings },
];

function SidebarContent({ profile }: { profile: CurrentProfile }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-24 items-center border-b border-sidebar-border px-6">
        <div className="min-w-0">
          <p className="truncate text-4xl font-black leading-none tracking-normal">
            VIVA
          </p>
          <p className="mt-1 truncate text-[0.66rem] font-semibold uppercase tracking-[0.25em] text-sidebar-foreground/70">
            Gestão Cultural
          </p>
        </div>
      </div>

      <div className="p-4">
        <Button asChild className="w-full justify-start bg-sidebar-primary">
          <Link href="/projetos/novo">
            <Plus className="size-4" />
            Novo Projeto
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href.split("/").slice(0, 2).join("/")));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/76 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
              {"badge" in item ? (
                <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs text-sidebar-primary-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold">
            {profile.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/65">
              {profile.role === "admin" ? "Administrador Geral" : "Diretor Executivo"}
            </p>
          </div>
        </div>
        <form action={logout}>
          <Button
            className="w-full justify-start border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
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

      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
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
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw]">
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
