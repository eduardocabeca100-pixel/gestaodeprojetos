"use client";

import { useState } from "react";

import { applyRefensOfficialCostBreakdowns } from "@/components/refens/refens-cost-breakdown";
import { RefensCleanup } from "@/components/refens/refens-cleanup";
import { seedRefensTeamForProject } from "@/components/refens/refens-official-data";
import { LocalTeamWorkspace } from "@/components/team/local-team-workspace";
import { useClientReady } from "@/lib/use-client-ready";

type RefensTeamWorkspaceProps = {
  initialTab?: "project" | "permanent";
  activeProject: {
    id: string;
    name: string;
  };
};

function isRefensProject(project: RefensTeamWorkspaceProps["activeProject"]) {
  const value = `${project.id} ${project.name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return value.includes("refens");
}

export function RefensTeamWorkspace({
  initialTab = "project",
  activeProject,
}: RefensTeamWorkspaceProps) {
  const isClient = useClientReady();

  if (!isClient) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando equipe do projeto...
      </div>
    );
  }

  return (
    <RefensTeamWorkspaceContent
      key={activeProject.id}
      initialTab={initialTab}
      activeProject={activeProject}
    />
  );
}

function RefensTeamWorkspaceContent({
  initialTab,
  activeProject,
}: RefensTeamWorkspaceProps) {
  const shouldSeedRefens = isRefensProject(activeProject);

  const [workspaceKey] = useState(() => {
    if (shouldSeedRefens) {
      seedRefensTeamForProject(activeProject.id);
      applyRefensOfficialCostBreakdowns(activeProject.id);
    }

    return `team-${activeProject.id}-${initialTab}`;
  });

  return (
    <>
      {shouldSeedRefens ? <RefensCleanup /> : null}

      <LocalTeamWorkspace
        key={workspaceKey}
        initialTab={initialTab}
        activeProject={activeProject}
      />
    </>
  );
}
