import { BarChart3, Folder, ReceiptText, Wallet } from "lucide-react";

import { BenefitsFooter } from "@/components/dashboard/benefits-footer";
import { DashboardDocuments } from "@/components/dashboard/dashboard-documents";
import { DashboardFinance } from "@/components/dashboard/dashboard-finance";
import { DashboardMedia } from "@/components/dashboard/dashboard-media";
import { DashboardReports } from "@/components/dashboard/dashboard-reports";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectDetailPanel } from "@/components/dashboard/project-detail-panel";
import { ProjectMiniCard } from "@/components/dashboard/project-mini-card";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { listDocuments } from "@/modules/documents/queries";
import { getFinancialSummary } from "@/modules/finance/queries";
import { listMediaItems } from "@/modules/media/queries";
import { getFeaturedProject, getProjectKpis, listProjects } from "@/modules/projects/queries";
import { listReports } from "@/modules/reports/queries";
import { listUpcomingActivities } from "@/modules/schedule/queries";

const kpiIcons = [Folder, Wallet, ReceiptText, BarChart3];

export default async function DashboardPage() {
  const [kpis, projects, featured, documents, activities, finance, media, reports] =
    await Promise.all([
      getProjectKpis(),
      listProjects(),
      getFeaturedProject(),
      listDocuments(),
      listUpcomingActivities(),
      getFinancialSummary(),
      listMediaItems(),
      listReports(),
    ]);

  return (
    <PageContainer
      title="Dashboard"
      description="Visão operacional dos projetos culturais, documentos, financeiro e prestação de contas."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpiIcons[index] ?? Folder;
          return <KpiCard key={kpi.label} {...kpi} icon={Icon} />;
        })}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Meus projetos" description="Projetos ativos e em planejamento.">
          <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-1">
            {projects.map((project, index) => (
              <ProjectMiniCard
                key={project.id}
                project={project}
                highlighted={index === 0}
              />
            ))}
          </div>
        </SectionCard>
        <ProjectDetailPanel project={featured} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-5">
        <DashboardDocuments documents={documents} />
        <RecentActivities activities={activities} />
        <DashboardFinance {...finance} />
        <DashboardMedia mediaItems={media} />
        <DashboardReports reports={reports} />
      </div>

      <BenefitsFooter />
    </PageContainer>
  );
}
