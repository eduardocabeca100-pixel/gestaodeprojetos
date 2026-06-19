import { DossierGenerator } from "@/components/reports/dossier-generator";
import { ReportCard } from "@/components/reports/report-card";
import { ReportPreview } from "@/components/reports/report-preview";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { getFeaturedProject } from "@/modules/projects/queries";
import { listReports } from "@/modules/reports/queries";
import { listActivities } from "@/modules/schedule/queries";

export default async function ReportsPage() {
  const [project, activities, reports] = await Promise.all([
    getFeaturedProject(),
    listActivities(),
    listReports(),
  ]);

  return (
    <PageContainer
      title="Relatórios e dossiê PDF"
      description="Geração de relatórios institucionais, financeiros, fotográficos e dossiês completos."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DossierGenerator project={project} activities={activities} />
        <ReportPreview />
      </div>
      <SectionCard title="Relatórios gerados">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
