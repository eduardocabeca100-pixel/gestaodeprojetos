"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { TeamRosterCard } from "@/components/team/team-roster-card";
import { TeamRosterForm } from "@/components/team/team-roster-form";
import { removeTeamRoster } from "@/modules/team/actions";
import type { TeamRosterMember } from "@/modules/team/types";

interface TeamRosterPageProps {
  initialMembers: TeamRosterMember[];
}

export default function TeamRosterPage() {
  const [members, setMembers] = useState<TeamRosterMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load members on component mount
  React.useEffect(() => {
    async function loadMembers() {
      try {
        const response = await fetch("/api/team-roster");
        const data = await response.json();
        setMembers(data || []);
      } catch (error) {
        console.error("Error loading team roster:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMembers();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este membro?")) return;

    try {
      const result = await removeTeamRoster(id);
      if (result.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(result.message || "Erro ao remover membro");
      }
    } catch (error) {
      alert("Erro ao remover membro");
      console.error(error);
    }
  }

  function handleMemberAdded(member: TeamRosterMember) {
    setMembers((prev) => [...prev, member]);
  }

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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-slate-500">Carregando...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12">
              <p className="text-sm text-slate-500">
                Nenhum membro cadastrado ainda
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Adicione membros usando o formulário ao lado
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {members.map((member) => (
                <TeamRosterCard
                  key={member.id}
                  member={member}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Novo membro">
          <TeamRosterForm onSuccess={handleMemberAdded} />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
