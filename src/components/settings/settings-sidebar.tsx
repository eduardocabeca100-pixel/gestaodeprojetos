import Link from "next/link";
import {
  CalendarDays,
  Database,
  FileText,
  Folder,
  HardDrive,
  ImageIcon,
  Palette,
  Plug,
  Settings,
  SlidersHorizontal,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

const settingsLinks = [
  { href: "/configuracoes/geral", label: "Geral", icon: Settings },
  { href: "/configuracoes/aparencia", label: "Aparência", icon: Palette },
  { href: "/configuracoes/projetos", label: "Projetos", icon: Folder },
  { href: "/configuracoes/documentos", label: "Documentos", icon: FileText },
  { href: "/configuracoes/midia", label: "Mídia", icon: ImageIcon },
  { href: "/configuracoes/cronograma", label: "Cronograma", icon: CalendarDays },
  { href: "/configuracoes/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/configuracoes/relatorios", label: "Relatórios", icon: SlidersHorizontal },
  { href: "/configuracoes/usuarios", label: "Usuários", icon: Users },
  { href: "/configuracoes/seguranca", label: "Segurança de acesso", icon: ShieldCheck },
  { href: "/configuracoes/backup", label: "Backup", icon: HardDrive },
  { href: "/configuracoes/integracoes", label: "Integrações", icon: Plug },
  { href: "/configuracoes/campos-personalizados", label: "Campos personalizados", icon: Database },
];

export function SettingsSidebar() {
  return (
    <nav className="grid gap-1 rounded-lg border border-border bg-white p-1.5 soft-shadow">
      {settingsLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.9rem] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
