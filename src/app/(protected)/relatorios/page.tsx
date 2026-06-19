import { DossierGenerator } from "@/components/reports/dossier-generator";
import { ReportCard } from "@/components/reports/report-card";
import { ReportEditor } from "@/components/reports/report-editor";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listReports } from "@/modules/reports/queries";
import { listActivities } from "@/modules/schedule/queries";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const [activities, reports] = await Promise.all([
    listActivities(project.id),
    listReports(project.id),
  ]);

  return (
    <PageContainer
      title="Relatórios e dossiê PDF"
      description="Geração de relatórios institucionais, financeiros, fotográficos e dossiês completos."
    >
      <ProjectScopeBanner projectId={project.id} />
      <DossierGenerator project={project} activities={activities} />
      <ReportEditor project={project} />
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
