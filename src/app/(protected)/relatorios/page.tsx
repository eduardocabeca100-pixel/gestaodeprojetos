import { DossierGenerator } from "@/components/reports/dossier-generator";
import { ReportCard } from "@/components/reports/report-card";
import { ReportPreview } from "@/components/reports/report-preview";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getProjectId, type PageSearchParams } from "@/lib/utils/search-params";
import { getFeaturedProject } from "@/modules/projects/queries";
import { listReports } from "@/modules/reports/queries";
import { listActivities } from "@/modules/schedule/queries";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const projectId = await getProjectId(searchParams);
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
      <ProjectScopeBanner projectId={projectId} />
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
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
