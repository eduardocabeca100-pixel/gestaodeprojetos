import { PageContainer } from "@/components/layout/page-container";
import { LocalTeamWorkspace } from "@/components/team/local-team-workspace";

export default function TeamRosterPage() {
  return (
    <PageContainer
      title="Equipe permanente"
      description="Cadastre, edite, ative, inative ou apague pessoas que poderão participar de vários projetos."
    >
      <LocalTeamWorkspace initialTab="permanent" />
    </PageContainer>
  );
}
