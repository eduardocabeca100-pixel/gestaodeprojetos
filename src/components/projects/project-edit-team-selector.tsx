"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Save, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  makeAssignmentFromMember,
  readLocalTeamRoster,
  readProjectAssignments,
  writeProjectAssignments,
  type LocalProjectAssignment,
  type LocalTeamMember,
} from "@/components/team/local-team-store";
import type { Project } from "@/modules/projects/types";

function makeCleanAssignment(member: LocalTeamMember): LocalProjectAssignment {
  const assignment = makeAssignmentFromMember(member);

  return {
    ...assignment,
    expectedAmount: "",
    paidAmount: "",
    paymentStatus: "Previsto",
    costBreakdown: [],
    paymentHistory: [],
  };
}

export function ProjectEditTeamSelector({ project }: { project: Project }) {
  const [members, setMembers] = useState<LocalTeamMember[]>([]);
  const [assignments, setAssignments] = useState<LocalProjectAssignment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const loadData = useCallback(() => {
    const roster = readLocalTeamRoster().filter((member) => member.active);
    const allProjectAssignments = readProjectAssignments();
    const projectAssignments = allProjectAssignments[project.id] ?? [];

    setMembers(roster);
    setAssignments(projectAssignments);
    setSelectedIds(projectAssignments.map((assignment) => assignment.memberId));
  }, [project.id]);

  useEffect(() => {
    const handle = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(handle);
  }, [loadData]);

  function toggleMember(memberId: string) {
    setSelectedIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
    setMessage("");
  }

  function saveTeam() {
    const allAssignments = readProjectAssignments();
    const currentProjectAssignments = allAssignments[project.id] ?? [];

    const nextAssignments = selectedIds
      .map((memberId) => {
        const existing = currentProjectAssignments.find(
          (assignment) => assignment.memberId === memberId,
        );

        if (existing) {
          return existing;
        }

        const member = members.find((item) => item.id === memberId);

        if (!member) {
          return null;
        }

        return makeCleanAssignment(member);
      })
      .filter(Boolean) as LocalProjectAssignment[];

    writeProjectAssignments({
      ...allAssignments,
      [project.id]: nextAssignments,
    });

    setAssignments(nextAssignments);
    setMessage("Equipe do projeto salva. Nenhum valor foi importado automaticamente.");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UsersRound className="size-5 text-primary" />
            <h3 className="text-base font-bold text-slate-950">Equipe do projeto</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Selecione manualmente pessoas da equipe permanente/casting. Este projeto começa sem equipe e não puxa elenco de outro projeto.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 size-4" />
            Atualizar lista
          </Button>

          <Button type="button" onClick={saveTeam}>
            <Save className="mr-2 size-4" />
            Salvar equipe
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Valores financeiros não aparecem aqui e não são copiados automaticamente. Cada projeto terá seus próprios valores depois.
      </div>

      {message ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">Equipe permanente / casting</p>
            <p className="mt-1 text-xs text-slate-500">
              Marque somente quem fará parte deste projeto.
            </p>
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
            {selectedIds.length} selecionado(s)
          </span>
        </div>

        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Nenhuma pessoa ativa encontrada na equipe permanente.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => {
              const checked = selectedIds.includes(member.id);

              return (
                <label
                  key={member.id}
                  className={
                    checked
                      ? "flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                      : "flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-primary/40 hover:bg-primary/5"
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(member.id)}
                    className="mt-1 size-4"
                  />

                  <span>
                    <strong className="flex items-center gap-2 text-sm text-slate-950">
                      {member.name}
                      {checked ? <CheckCircle2 className="size-4 text-emerald-600" /> : null}
                    </strong>

                    <span className="mt-1 block text-sm text-slate-600">
                      {member.role || "Função não informada"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {assignments.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-slate-950">
            Atualmente salvos neste projeto
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {assignments.map((assignment) => (
              <span
                key={assignment.id}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
              >
                {assignment.name || assignment.fullName} — {assignment.role || "Sem função"}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
