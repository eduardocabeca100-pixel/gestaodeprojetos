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
    <footer className="grid gap-4 rounded-lg border border-border bg-white p-5 soft-shadow md:grid-cols-5">
      {benefits.map((benefit) => {
        const Icon = benefit.icon;
        return (
          <div key={benefit.title} className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
      <div className="flex items-center justify-end text-3xl font-black tracking-normal md:col-start-5">
        VIVA
      </div>
    </footer>
  );
}
