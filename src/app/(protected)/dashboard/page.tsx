import { CalendarClock, Folder, ReceiptText, Wallet } from "lucide-react";

import { DashboardDocuments } from "@/components/dashboard/dashboard-documents";
import { DashboardFinance } from "@/components/dashboard/dashboard-finance";
import { DashboardMedia } from "@/components/dashboard/dashboard-media";
import { DashboardTeam } from "@/components/dashboard/dashboard-team";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectDetailPanel } from "@/components/dashboard/project-detail-panel";
import { ProjectQuickEdit } from "@/components/dashboard/project-quick-edit";
import { ProjectStagesPanel } from "@/components/dashboard/project-stages-panel";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { PageContainer } from "@/components/layout/page-container";
import { ActiveProjectScope } from "@/components/projects/active-project-scope";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listDocuments } from "@/modules/documents/queries";
import { getFinancialSummary } from "@/modules/finance/queries";
import { listMediaItems } from "@/modules/media/queries";
import { listUpcomingActivities } from "@/modules/schedule/queries";
import { listTeamMembers } from "@/modules/team/queries";

const metricIcons = [Wallet, ReceiptText, Folder, CalendarClock];
const metricTones = ["green", "purple", "amber", "cyan"] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const activeProject = await getActiveProject(searchParams);
  const [featured, documents, activities, finance, media, teamMembers] =
    await Promise.all([
      activeProject,
      listDocuments(activeProject.id),
      listUpcomingActivities(activeProject.id),
      getFinancialSummary(activeProject.id),
      listMediaItems(activeProject.id),
      listTeamMembers(activeProject.id),
    ]);

  const metrics = [
    {
      label: "Valor aprovado",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(featured.approvedAmount),
      helper: "Total liberado para o projeto",
      tone: metricTones[0],
      icon: metricIcons[0],
    },
    {
      label: "Valor executado",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(finance.executed),
      helper: `${featured.approvedAmount > 0 ? Math.round((finance.executed / featured.approvedAmount) * 100) : 0}% do aprovado`,
      tone: metricTones[1],
      icon: metricIcons[1],
    },
    {
      label: "Saldo disponível",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(finance.remaining),
      helper: "Reserva restante para execução",
      tone: metricTones[2],
      icon: metricIcons[2],
    },
    {
      label: "Próximas entregas",
      value: String(activities.length),
      helper: "Prazos reais cadastrados",
      tone: metricTones[3],
      icon: metricIcons[3],
    },
  ];

  return (
    <PageContainer
      title={`Dashboard - ${featured.name}`}
      description="Visão operacional do projeto ativo, com documentos, financeiro e prestação de contas."
      headerless
    >
      <ActiveProjectScope project={featured} />

      <div className="grid gap-6 2xl:grid-cols-[1.35fr_1fr]">
        <ProjectDetailPanel project={featured} />
        <ProjectStagesPanel projectId={featured.id} current={featured.currentStage} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <KpiCard
                key={metric.label}
                helper={metric.helper}
                icon={metric.icon}
                label={metric.label}
                tone={metric.tone}
                value={metric.value}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardFinance {...finance} />
            <RecentActivities activities={activities} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardTeam members={teamMembers} projectId={featured.id} />
            <DashboardDocuments documents={documents} projectId={featured.id} />
          </div>

          <DashboardMedia mediaItems={media} />
        </div>

        <div className="space-y-6">
          <ProjectQuickEdit project={featured} />
        </div>
      </div>
    </PageContainer>
  );
}
