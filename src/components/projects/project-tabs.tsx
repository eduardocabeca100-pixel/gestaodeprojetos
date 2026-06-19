"use client";

import { useState } from "react";

import { SectionCard } from "@/components/layout/section-card";

const tabs = [
  "Visão Geral",
  "Documentos",
  "Cronograma",
  "Orçamento",
  "Equipe",
  "Participantes",
  "Mídia",
  "Relatórios",
];

export function ProjectTabs({
  overview,
}: {
  overview: {
    summary: string;
    notes: string;
  };
}) {
  const [active, setActive] = useState(tabs[0]);

  return (
    <SectionCard>
      <div className="mb-5 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={
                active === tab
                  ? "border-b-2 border-primary px-3 py-2 text-sm font-semibold text-primary"
                  : "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              }
              type="button"
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {active === "Visão Geral" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Resumo</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {overview.summary}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Observações</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {overview.notes}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          {active} do projeto vinculados ao cadastro central.
        </div>
      )}
    </SectionCard>
  );
}
