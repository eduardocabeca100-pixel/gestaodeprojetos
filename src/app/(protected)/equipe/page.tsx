import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { TeamMemberForm } from "@/components/team/team-member-form";
import { Button } from "@/components/ui/button";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { listTeamMembers } from "@/modules/team/queries";
import Link from "next/link";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const members = await listTeamMembers(project.id);

  return (
    <PageContainer
      title="Equipe"
      description="Gerencie a equipe fixa e os membros específicos de cada projeto."
    >
      <div className="mb-6 flex gap-2">
        <Button asChild variant="default">
          <Link href="/equipe/projeto">Equipe do projeto</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/equipe/global">Equipe permanente</Link>
        </Button>
      </div>

      <ProjectScopeBanner projectId={project.id} />
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <SectionCard title={`Equipe do projeto ${project.name}`}>
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
