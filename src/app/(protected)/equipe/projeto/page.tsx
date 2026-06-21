import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { TeamRosterSelector } from "@/components/team/team-roster-selector";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import {
  listTeamRoster,
  listTeamRosterAssignments,
} from "@/modules/team/queries";
import { removeTeamAssignment } from "@/modules/team/actions";
import type { Project } from "@/modules/projects/types";
import type { TeamRosterMember, TeamRosterAssignment } from "@/modules/team/types";

export default async function ProjectTeamPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const [allRosterMembers, projectAssignments] = await Promise.all([
    listTeamRoster(),
    listTeamRosterAssignments(project.id),
  ]);

  const availableMembers = allRosterMembers.filter(
    (member) => !projectAssignments.some((assignment) => assignment.teamRosterId === member.id),
  );

  async function handleRemoveAssignment(assignmentId: string) {
    "use server";
    await removeTeamAssignment(assignmentId);
  }

  return (
    <PageContainer
      title="Equipe do projeto"
      description="Gerencie os membros da equipe fixa e adicione participantes específicos ao projeto."
    >
      <ProjectScopeBanner projectId={project.id} />

      <div className="space-y-6">
        <SectionCard
          title={`Equipe atribuída (${projectAssignments.length})`}
          description="Membros da equipe fixa que estão trabalhando neste projeto"
        >
          {projectAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-8">
              <p className="text-sm text-slate-500">Nenhum membro da equipe atribuído ainda</p>
              <p className="mt-1 text-xs text-slate-400">Use o formulário abaixo para adicionar membros</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {projectAssignments.map((assignment) => (
                <div key={assignment.id} className="relative rounded-lg border border-slate-200 bg-white p-4">
                  {assignment.rosterMember && (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900">{assignment.rosterMember.name}</h3>
                          <p className="text-sm text-slate-500">{assignment.rosterMember.role}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleRemoveAssignment(assignment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {assignment.expectedAmount > 0 && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <p className="text-xs text-slate-600"><span className="font-medium">Valor previsto:</span> R${" "}{assignment.expectedAmount.toFixed(2)}</p>
                          <p className="mt-1 text-xs text-slate-600"><span className="font-medium">Status:</span> {assignment.paymentStatus}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {availableMembers.length > 0 && (
          <SectionCard title="Adicionar membros da equipe" description="Escolha membros da sua equipe fixa para adicionar a este projeto">
            <TeamRosterSelector rosterMembers={availableMembers} projectId={project.id} onSuccess={() => {}} />
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
