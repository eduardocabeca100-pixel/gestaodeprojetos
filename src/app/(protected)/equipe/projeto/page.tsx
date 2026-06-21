"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { TeamRosterSelector } from "@/components/team/team-roster-selector";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  listTeamRoster,
  listTeamRosterAssignments,
  getActiveProject,
} from "@/modules/team/queries";
import { removeTeamAssignment } from "@/modules/team/actions";
import type { Project } from "@/modules/projects/types";
import type { TeamRosterMember, TeamRosterAssignment } from "@/modules/team/types";

export default function ProjectTeamPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [project, setProject] = useState<Project | null>(null);
  const [allRosterMembers, setAllRosterMembers] = useState<TeamRosterMember[]>(
    []
  );
  const [projectAssignments, setProjectAssignments] = useState<
    TeamRosterAssignment[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // This would need to be an API call since we're in client component
        const assignmentsResponse = await fetch(
          `/api/team-roster/assignments?projectId=${projectId}`
        );
        const membersResponse = await fetch("/api/team-roster");

        const assignments = await assignmentsResponse.json();
        const members = await membersResponse.json();

        setProjectAssignments(assignments || []);
        setAllRosterMembers(members || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (projectId) {
      loadData();
    }
  }, [projectId]);

  async function handleRemoveAssignment(assignmentId: string) {
    if (!confirm("Remover este membro do projeto?")) return;

    try {
      const result = await removeTeamAssignment(assignmentId);
      if (result.ok) {
        setProjectAssignments((prev) =>
          prev.filter((a) => a.id !== assignmentId)
        );
      } else {
        alert(result.message || "Erro ao remover");
      }
    } catch (error) {
      alert("Erro ao remover membro");
      console.error(error);
    }
  }

  function handleMemberAssigned() {
    // Reload assignments
    if (projectId) {
      fetch(`/api/team-roster/assignments?projectId=${projectId}`)
        .then((r) => r.json())
        .then((assignments) => setProjectAssignments(assignments || []))
        .catch(console.error);
    }
  }

  const availableMembers = allRosterMembers.filter(
    (member) =>
      !projectAssignments.some(
        (assignment) => assignment.teamRosterId === member.id
      )
  );

  if (!projectId) {
    return (
      <PageContainer title="Equipe do projeto">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Selecione um projeto para gerenciar a equipe.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer title="Equipe do projeto">
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500">Carregando...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Equipe do projeto"
      description="Gerencie os membros da equipe fixa e adicione participantes específicos ao projeto."
    >
      <ProjectScopeBanner projectId={projectId} />

      <div className="space-y-6">
        {/* Assigned team members */}
        <SectionCard
          title={`Equipe atribuída (${projectAssignments.length})`}
          description="Membros da equipe fixa que estão trabalhando neste projeto"
        >
          {projectAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-8">
              <p className="text-sm text-slate-500">
                Nenhum membro da equipe atribuído ainda
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Use o formulário abaixo para adicionar membros
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {projectAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="relative rounded-lg border border-slate-200 bg-white p-4"
                >
                  {assignment.rosterMember && (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {assignment.rosterMember.name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {assignment.rosterMember.role}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {assignment.expectedAmount > 0 && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <p className="text-xs text-slate-600">
                            <span className="font-medium">Valor previsto:</span> R${" "}
                            {assignment.expectedAmount.toFixed(2)}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            <span className="font-medium">Status:</span>{" "}
                            {assignment.paymentStatus}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Selector for adding team members */}
        {availableMembers.length > 0 && (
          <SectionCard
            title="Adicionar membros da equipe"
            description="Escolha membros da sua equipe fixa para adicionar a este projeto"
          >
            <TeamRosterSelector
              rosterMembers={availableMembers}
              projectId={projectId}
              onSuccess={handleMemberAssigned}
            />
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
