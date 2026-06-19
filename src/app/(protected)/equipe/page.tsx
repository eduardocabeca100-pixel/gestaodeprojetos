import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { TeamMemberForm } from "@/components/team/team-member-form";
import { getProjectId, type PageSearchParams } from "@/lib/utils/search-params";
import { listTeamMembers } from "@/modules/team/queries";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const projectId = await getProjectId(searchParams);
  const members = await listTeamMembers();

  return (
    <PageContainer
      title="Equipe"
      description="Equipe técnica e artística, contratos, comprovantes e status de pagamento."
    >
      <ProjectScopeBanner projectId={projectId} />
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
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
