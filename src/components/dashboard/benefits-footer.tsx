import { Bell, BriefcaseBusiness, Cloud, MapPinned, Smartphone } from "lucide-react";

const benefits = [
  {
    title: "Tudo em um só lugar",
    text: "Documentos, fotos, cronograma e finanças.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Prestação de contas",
    text: "Relatórios automáticos e exportação.",
    icon: MapPinned,
  },
  {
    title: "Acompanhe prazos",
    text: "Alertas por etapa do edital.",
    icon: Bell,
  },
  {
    title: "Acesso seguro",
    text: "Dados protegidos em nuvem.",
    icon: Cloud,
  },
  {
    title: "Qualquer lugar",
    text: "Desktop, tablet e celular.",
    icon: Smartphone,
  },
];

export function BenefitsFooter() {
  return (
    <footer className="grid gap-4 rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(242,247,255,0.96))] p-5 soft-shadow md:grid-cols-5">
      {benefits.map((benefit) => {
        const Icon = benefit.icon;
        return (
          <div key={benefit.title} className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-primary-foreground shadow-[0_18px_34px_-26px_rgba(79,70,229,0.62)]">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{benefit.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {benefit.text}
              </p>
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-end bg-[linear-gradient(135deg,#2563eb,#7c3aed)] bg-clip-text text-3xl font-black tracking-normal text-transparent md:col-start-5">
        VIVA
      </div>
    </footer>
  );
}
