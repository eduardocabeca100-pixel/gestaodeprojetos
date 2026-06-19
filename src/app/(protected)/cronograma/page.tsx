import { ActivityCard } from "@/components/schedule/activity-card";
import { ActivityForm } from "@/components/schedule/activity-form";
import { AttendanceList } from "@/components/schedule/attendance-list";
import { CalendarView } from "@/components/schedule/calendar-view";
import { ClassPlanForm } from "@/components/schedule/class-plan-form";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { listActivities } from "@/modules/schedule/queries";

export default async function SchedulePage() {
  const activities = await listActivities();

  return (
    <PageContainer
      title="Cronograma e aulas"
      description="Atividades, calendário, aulas, listas de presença, fotos e documentos vinculados."
    >
      <SectionCard title="Calendário">
        <CalendarView activities={activities} />
      </SectionCard>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
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
