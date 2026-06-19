import { AlertTriangle, Bell, CalendarDays, FileText } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";

const notifications = [
  {
    title: "Certidão próxima do vencimento",
    description: "certidao-negativa-estadual.pdf vence em breve.",
    icon: AlertTriangle,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Habilitação documental",
    description: "Enviar documentação complementar do projeto Reféns.",
    icon: FileText,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Próxima aula agendada",
    description: "Leitura do roteiro Reféns no cronograma.",
    icon: CalendarDays,
    tone: "bg-cyan-50 text-cyan-700",
  },
];

export default function NotificationsPage() {
  return (
    <PageContainer
      title="Notificações"
      description="Alertas de prazos, documentos, cronograma e prestação de contas."
    >
      <SectionCard title="Alertas ativos">
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-white p-4"
              >
                <div className={`flex size-10 items-center justify-center rounded-lg ${notification.tone}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
      <SectionCard title="Preferências">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 text-sm">
          <Bell className="size-5 text-primary" />
          Notificações internas preparadas para alertas por e-mail e WhatsApp.
        </div>
      </SectionCard>
    </PageContainer>
  );
}
