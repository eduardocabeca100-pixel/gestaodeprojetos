import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { TeamRosterCard } from "@/components/team/team-roster-card";
import { TeamRosterForm } from "@/components/team/team-roster-form";
import { listTeamRoster } from "@/modules/team/queries";

export default async function TeamRosterPage() {
  const members = await listTeamRoster();

  return (
    <PageContainer
      title="Equipe Permanente"
      description="Gerencie os membros da sua equipe fixa que podem ser reutilizados em múltiplos projetos."
    >
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <SectionCard
          title={`Equipe cadastrada (${members.length})`}
          description="Membros disponíveis para serem adicionados aos projetos"
        >
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12">
              <p className="text-sm text-slate-500">Nenhum membro cadastrado ainda</p>
              <p className="mt-1 text-xs text-slate-400">Adicione membros usando o formulário ao lado</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {members.map((member) => (
                <TeamRosterCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Novo membro">
          <TeamRosterForm />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
