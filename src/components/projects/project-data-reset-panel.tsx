"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getActiveProjectScope,
  getProjectAliases,
  projectScopedKey,
} from "@/lib/project-scope";
import { useClientReady } from "@/lib/use-client-ready";

const scopedBases = [
  "viva:central-cultural:documents:v1",
  "viva:central-cultural:accountability-editor:v1",
  "viva:central-cultural:accountability-editor:v2",
  "viva:central-cultural:accountability-editor:v3",
  "viva:central-cultural:demonstratives:v3",
];

function removeProjectAssignment(projectId: string) {
  const key = "viva:project-team-assignments:v1";
  const saved = window.localStorage.getItem(key);

  if (!saved) return 0;

  try {
    const parsed = JSON.parse(saved) as Record<string, unknown>;
    const hadProject = Object.prototype.hasOwnProperty.call(parsed, projectId);

    delete parsed[projectId];

    window.localStorage.setItem(key, JSON.stringify(parsed));

    return hadProject ? 1 : 0;
  } catch {
    return 0;
  }
}

function clearCurrentProjectData() {
  const project = getActiveProjectScope();
  const aliases = getProjectAliases(project);
  let removed = 0;

  for (const base of scopedBases) {
    const key = projectScopedKey(base, project.id);

    if (window.localStorage.getItem(key) !== null) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  }

  const directKeys = [
    `viva:gestao-avancada:${project.id}`,
    `viva:project-media:cover:${project.id}`,
    `viva:project-media:banner:${project.id}`,
  ];

  for (const key of directKeys) {
    if (window.localStorage.getItem(key) !== null) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  }

  for (const key of Object.keys(window.localStorage)) {
    const isProjectKey = aliases.some((alias) => key.includes(alias));

    if (!isProjectKey) continue;

    const isSafeGlobalKey =
      key === "viva:team-roster:v1" ||
      key === "viva:active-project:v1" ||
      key === "viva:project-team-assignments:v1";

    if (isSafeGlobalKey) continue;

    const shouldRemove =
      key.includes("viva:schedule") ||
      key.includes("viva:central-cultural") ||
      key.includes("viva:gestao-avancada") ||
      key.includes("viva:project-media") ||
      key.includes("document") ||
      key.includes("finance") ||
      key.includes("rubric") ||
      key.includes("attendance") ||
      key.includes("participant") ||
      key.includes("diary") ||
      key.includes("prestacao") ||
      key.includes("demonstrative");

    if (shouldRemove) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  }

  removed += removeProjectAssignment(project.id);

  window.dispatchEvent(new Event("viva:financial-data-changed"));
  window.dispatchEvent(new Event("viva:schedule-updated"));
  window.dispatchEvent(new Event("storage"));

  return { project, removed };
}

export function ProjectDataResetPanel() {
  const isClient = useClientReady();
  const [message, setMessage] = useState("");
  const projectName = isClient ? getActiveProjectScope().name : "Projeto atual";

  function handleClear() {
    const project = getActiveProjectScope();

    if (
      !window.confirm(
        `Limpar todos os dados locais deste projeto?\n\nProjeto: ${project.name}\n\nIsso remove equipe selecionada do projeto, documentos, cronograma, diário, financeiro local, prestação, demonstrativos, alertas e mídias locais. A equipe permanente/casting será mantida.`,
      )
    ) {
      return;
    }

    const result = clearCurrentProjectData();

    setMessage(
      `Dados locais de "${result.project.name}" limpos. Itens removidos: ${result.removed}. Recarregue a página.`,
    );
  }

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Projeto único e isolado
            </p>
            <h3 className="mt-1 text-lg font-black">
              Limpar dados locais deste projeto
            </h3>
            <p className="mt-1 text-sm leading-6">
              Projeto ativo: <strong>{projectName}</strong>. Use este botão para zerar documentos, equipe selecionada, cronograma, diário, financeiro local, prestação, demonstrativos, alertas e mídias deste projeto. A equipe permanente/casting não será apagada.
            </p>
            {message ? <p className="mt-2 text-sm font-bold">{message}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" />
            Recarregar
          </Button>
          <Button type="button" variant="destructive" onClick={handleClear}>
            <Trash2 className="size-4" />
            Limpar este projeto
          </Button>
        </div>
      </div>
    </div>
  );
}
