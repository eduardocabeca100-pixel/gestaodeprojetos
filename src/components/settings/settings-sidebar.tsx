import Link from "next/link";
import { FileArchive, Plug, ShieldCheck, Users } from "lucide-react";

const settingsLinks = [
  { href: "/configuracoes/usuarios", label: "Usuários", icon: Users },
  { href: "/configuracoes/seguranca", label: "Segurança", icon: ShieldCheck },
  { href: "/configuracoes/integracoes", label: "Integrações", icon: Plug },
  { href: "/configuracoes/exportar-projeto", label: "Exportar ZIP", icon: FileArchive },
];

export function SettingsSidebar() {
  return (
    <nav className="grid gap-1 rounded-2xl border border-border bg-white p-1.5 soft-shadow">
      {settingsLinks.map((link) => {
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[0.9rem] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
