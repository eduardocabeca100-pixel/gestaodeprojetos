"use client";

import { useEffect, useState } from "react";

import { applyRefensOfficialCostBreakdowns } from "@/components/refens/refens-cost-breakdown";
import { RefensCleanup } from "@/components/refens/refens-cleanup";
import { seedRefensTeamForProject } from "@/components/refens/refens-official-data";
import { LocalTeamWorkspace } from "@/components/team/local-team-workspace";

type RefensTeamWorkspaceProps = {
  initialTab?: "project" | "permanent";
  activeProject: {
    id: string;
    name: string;
  };
};

export function RefensTeamWorkspace({
  initialTab = "project",
  activeProject,
}: RefensTeamWorkspaceProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedRefensTeamForProject(activeProject.id);
    applyRefensOfficialCostBreakdowns(activeProject.id);
    setReady(true);
  }, [activeProject.id]);

  if (!ready) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando equipe oficial do projeto Reféns...
      </div>
    );
  }

  return (
    <>
      <RefensCleanup />

      <LocalTeamWorkspace
        key={`refens-team-${activeProject.id}-${initialTab}`}
        initialTab={initialTab}
        activeProject={activeProject}
      />
    </>
  );
}
