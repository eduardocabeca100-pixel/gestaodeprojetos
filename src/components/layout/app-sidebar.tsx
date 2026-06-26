"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentType } from "react";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  Folder,
  Home,
  ImageIcon,
  LogOut,
  Newspaper,
  Plus,
  Settings,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

type CurrentProfile = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type SidebarItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  projectScoped?: boolean;
};

const navigation: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home, projectScoped: true },
  { label: "Central Cultural", href: "/central-cultural", icon: ClipboardList, projectScoped: true },
  { label: "Projetos", href: "/projetos", icon: Folder },
  { label: "Documentos do projeto", href: "/documentos", icon: FileText, projectScoped: true },
  { label: "Docs Oficiais", href: "/documentos-oficiais", icon: Newspaper, projectScoped: true },
  { label: "Cronograma", href: "/cronograma", icon: CalendarDays, projectScoped: true },
  { label: "Diário de classe", href: "/diario-de-classe", icon: ClipboardList, projectScoped: true },
  { label: "Financeiro", href: "/financeiro", icon: Wallet, projectScoped: true },
  { label: "Equipe", href: "/equipe", icon: Users, projectScoped: true },
  { label: "Banco de Currículos", href: "/banco-de-curriculos", icon: UsersRound, projectScoped: true },
  { label: "Participantes", href: "/participantes", icon: Users, projectScoped: true },
  { label: "Mídia", href: "/midia", icon: ImageIcon, projectScoped: true },
  { label: "Notificações", href: "/notificacoes", icon: Bell, projectScoped: true },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

function normalizeRole(role?: string | null) {
  if (!role) return "Usuário";
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "executive_director") return "Diretor Executivo";
  return role;
}

function getInitial(name?: string | null, email?: string | null) {
  const value = name || email || "U";
  return value.trim().slice(0, 1).toUpperCase();
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ profile }: { profile?: CurrentProfile | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeProjectId = searchParams.get("project");

  function buildHref(item: SidebarItem) {
    if (!item.projectScoped || !activeProjectId) return item.href;
    return `${item.href}?project=${activeProjectId}`;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#070b24] text-white shadow-2xl lg:flex lg:flex-col">
      <div className="flex h-full flex-col px-3 py-5">
        <Link href="/dashboard" className="mb-6 block px-2">
          <div className="text-3xl font-black tracking-tight">VIVA</div>
          <div className="mt-1 text-xs font-black uppercase tracking-[0.32em] text-white/55">
            Gestão Cultural
          </div>
        </Link>

        <Link
          href="/projetos/novo"
          className="mb-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110"
        >
          <Plus className="size-4" />
          Novo Projeto
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const href = buildHref(item);
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={href}
                className={
                  active
                    ? "flex items-center gap-3 rounded-2xl bg-white/12 px-3 py-3 text-sm font-black text-white shadow-inner"
                    : "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-white/72 transition hover:bg-white/10 hover:text-white"
                }
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-sm font-black text-white">
              {getInitial(profile?.name, profile?.email)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                {profile?.name || "Eduardo"}
              </p>
              <p className="truncate text-xs text-white/55">
                {normalizeRole(profile?.role)}
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            Sair
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;
