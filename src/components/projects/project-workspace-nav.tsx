import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FileSignature,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";

import type { Project } from "@/modules/projects/types";

const tabs = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documentos", href: "/documentos", icon: FileText },
  { label: "Documentos Oficiais", href: "/documentos-oficiais", icon: FileSignature },
  { label: "Cronograma", href: "/cronograma", icon: CalendarDays },
  { label: "Financeiro", href: "/financeiro", icon: Wallet },
  { label: "Equipe", href: "/equipe", icon: Users },
  { label: "Participantes", href: "/participantes", icon: Users },
  { label: "Mídia", href: "/midia", icon: ImageIcon },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
];

export function ProjectWorkspaceNav({ project }: { project: Project }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3 soft-shadow">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Projeto ativo
          </p>
          <p className="font-semibold">{project.name}</p>
        </div>
        <Link className="text-sm font-medium text-primary" href="/projetos/selecionar">
          Trocar projeto
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={`${tab.href}?project=${project.id}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
