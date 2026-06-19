import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ParticipantCard } from "@/components/participants/participant-card";
import { ParticipantForm } from "@/components/participants/participant-form";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getProjectId, type PageSearchParams } from "@/lib/utils/search-params";
import { listParticipants } from "@/modules/participants/queries";

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const projectId = await getProjectId(searchParams);
  const participants = await listParticipants();

  return (
    <PageContainer
      title="Participantes"
      description="Cadastro, autorizações, presença e relatório de participantes."
    >
      <ProjectScopeBanner projectId={projectId} />
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <SectionCard title="Participantes do Reféns">
          <div className="grid gap-4 lg:grid-cols-3">
            {participants.map((participant) => (
              <ParticipantCard key={participant.id} participant={participant} />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Novo participante">
          <ParticipantForm />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
