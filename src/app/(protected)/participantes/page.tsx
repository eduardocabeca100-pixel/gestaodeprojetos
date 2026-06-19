import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ParticipantCard } from "@/components/participants/participant-card";
import { ParticipantForm } from "@/components/participants/participant-form";
import { listParticipants } from "@/modules/participants/queries";

export default async function ParticipantsPage() {
  const participants = await listParticipants();

  return (
    <PageContainer
      title="Participantes"
      description="Cadastro, autorizações, presença e relatório de participantes."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
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
