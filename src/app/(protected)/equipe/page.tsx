import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { TeamMemberForm } from "@/components/team/team-member-form";
import { listTeamMembers } from "@/modules/team/queries";

export default async function TeamPage() {
  const members = await listTeamMembers();

  return (
    <PageContainer
      title="Equipe"
      description="Equipe técnica e artística, contratos, comprovantes e status de pagamento."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <SectionCard title="Equipe do projeto Reféns">
          <div className="grid gap-4 lg:grid-cols-3">
            {members.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Novo integrante">
          <TeamMemberForm />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
