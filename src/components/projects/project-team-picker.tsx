"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/layout/section-card";
import {
  PROJECT_TEAM_DRAFT_STORAGE_KEY,
  readLocalTeamRoster,
  type LocalTeamMember,
} from "@/components/team/local-team-store";

export function ProjectTeamPicker() {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<LocalTeamMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const activeMembers = useMemo(() => members.filter((member) => member.active), [members]);

  useEffect(() => {
    setMembers(readLocalTeamRoster());

    try {
      const saved = window.localStorage.getItem(PROJECT_TEAM_DRAFT_STORAGE_KEY);
      if (saved) setSelectedIds(JSON.parse(saved));
    } catch {
      setSelectedIds([]);
    }
  }, []);

  function toggleMember(memberId: string) {
    setSelectedIds((current) => {
      const next = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId];

      window.localStorage.setItem(PROJECT_TEAM_DRAFT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <SectionCard
      title="Equipe do projeto"
      description="Selecione a equipe permanente que fará parte deste novo projeto."
      actions={
        <Button type="button" onClick={() => setOpen((current) => !current)}>
          <Plus className="mr-2 size-4" />
          Adicionar equipe
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>{selectedIds.length}</strong> pessoa(s) selecionada(s) para este projeto.
          Depois, na aba <strong>Equipe</strong>, você consegue editar rubrica, valor e status de pagamento.
        </div>

        {open ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {activeMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                <UsersRound className="mx-auto mb-3 size-8 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">
                  Nenhuma pessoa ativa cadastrada na equipe permanente.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/equipe/global">Cadastrar equipe permanente</Link>
                </Button>
              </div>
            ) : (
              activeMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-red-200 hover:bg-red-50/40"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="mt-1 size-4"
                  />
                  <span>
                    <strong className="block text-sm text-slate-950">{member.name}</strong>
                    <span className="mt-1 block text-sm text-slate-600">{member.role}</span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {member.rubric || "Sem rubrica"} {member.defaultAmount ? `• ${member.defaultAmount}` : ""}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
