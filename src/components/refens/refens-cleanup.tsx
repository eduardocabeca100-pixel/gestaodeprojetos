"use client";

import { useEffect } from "react";

const TEAM_KEY = "viva:team-roster:v1";
const ASSIGNMENTS_KEY = "viva:project-team-assignments:v1";

function isAlunoNovo(item: Record<string, unknown>) {
  const id = String(item.id ?? item.memberId ?? "");
  const name = String(item.name ?? item.fullName ?? "").toLowerCase();

  return id.startsWith("refens-aluno-") || name.startsWith("aluno novo");
}

function cleanupRefensStudents() {
  try {
    const teamRaw = window.localStorage.getItem(TEAM_KEY);
    if (teamRaw) {
      const team = JSON.parse(teamRaw);
      if (Array.isArray(team)) {
        const cleaned = team.filter((item) => !isAlunoNovo(item));
        window.localStorage.setItem(TEAM_KEY, JSON.stringify(cleaned));
      }
    }

    const assignmentsRaw = window.localStorage.getItem(ASSIGNMENTS_KEY);
    if (assignmentsRaw) {
      const assignmentsByProject = JSON.parse(assignmentsRaw) as Record<string, Record<string, unknown>[]>;

      Object.keys(assignmentsByProject).forEach((projectId) => {
        if (Array.isArray(assignmentsByProject[projectId])) {
          assignmentsByProject[projectId] = assignmentsByProject[projectId].filter((item) => !isAlunoNovo(item));
        }
      });

      window.localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignmentsByProject));
    }
  } catch {
    // não quebra a tela se algum dado local antigo estiver corrompido
  }
}

export function RefensCleanup() {
  useEffect(() => {
    cleanupRefensStudents();
  }, []);

  return null;
}
