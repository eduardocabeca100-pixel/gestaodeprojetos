import { ActivityCard } from "@/components/schedule/activity-card";
import { ActivityForm } from "@/components/schedule/activity-form";
import { AttendanceList } from "@/components/schedule/attendance-list";
import { CalendarView } from "@/components/schedule/calendar-view";
import { ClassPlanForm } from "@/components/schedule/class-plan-form";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getProjectId, type PageSearchParams } from "@/lib/utils/search-params";
import { listActivities } from "@/modules/schedule/queries";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const projectId = await getProjectId(searchParams);
  const activities = await listActivities();

  return (
    <PageContainer
      title="Cronograma e aulas"
      description="Atividades, calendário, aulas, listas de presença, fotos e documentos vinculados."
    >
      <ProjectScopeBanner projectId={projectId} />
      <SectionCard title="Calendário">
        <CalendarView activities={activities} />
      </SectionCard>
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <SectionCard title="Atividades" description="Template inicial com 11 aulas do projeto Reféns.">
          <div className="space-y-3">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </SectionCard>
        <div className="space-y-4">
          <ActivityForm />
          <ClassPlanForm />
          <AttendanceList />
        </div>
      </div>
    </PageContainer>
  );
}
