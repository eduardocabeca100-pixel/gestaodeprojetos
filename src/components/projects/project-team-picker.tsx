"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Plus, RefreshCw, Trash2, UsersRound } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { useClientReady } from "@/lib/use-client-ready";
import {
  PROJECT_TEAM_DRAFT_STORAGE_KEY,
  readLocalTeamRoster,
  type LocalTeamMember,
} from "@/components/team/local-team-store";

export function ProjectTeamPicker() {
  const isClient = useClientReady();

  if (!isClient) {
    return (
      <SectionCard
        title="Equipe do projeto"
        description="Selecione a equipe permanente que fará parte deste novo projeto."
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">
          Carregando equipe cadastrada...
        </div>
      </SectionCard>
    );
  }

  return <ProjectTeamPickerContent />;
}

function readSelectedProjectTeamIds() {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(PROJECT_TEAM_DRAFT_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as string[]) : [];
  } catch {
    return [];
  }
}

function saveSelectedProjectTeamIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECT_TEAM_DRAFT_STORAGE_KEY, JSON.stringify(ids));
}

function ProjectTeamPickerContent() {
  const [open, setOpen] = useState(true);
  const [members, setMembers] = useState<LocalTeamMember[]>(() => readLocalTeamRoster());
  const [selectedIds, setSelectedIds] = useState<string[]>(() => readSelectedProjectTeamIds());
  const [message, setMessage] = useState("");

  const activeMembers = useMemo(
    () => members.filter((member) => member.active),
    [members],
  );

  const selectedMembers = useMemo(
    () => activeMembers.filter((member) => selectedIds.includes(member.id)),
    [activeMembers, selectedIds],
  );

  function refreshList() {
    setMembers(readLocalTeamRoster());
    setSelectedIds(readSelectedProjectTeamIds());
    setMessage("Lista da equipe atualizada.");
  }

  function updateSelected(nextIds: string[]) {
    setSelectedIds(nextIds);
    saveSelectedProjectTeamIds(nextIds);
  }

  function toggleMember(memberId: string) {
    const next = selectedIds.includes(memberId)
      ? selectedIds.filter((id) => id !== memberId)
      : [...selectedIds, memberId];

    updateSelected(next);
    setMessage("");
  }

  function selectAllMembers() {
    const next = activeMembers.map((member) => member.id);
    updateSelected(next);
    setOpen(true);
    setMessage(`${next.length} pessoa(s) selecionada(s).`);
  }

  function clearSelectedMembers() {
    updateSelected([]);
    setMessage("Seleção de equipe limpa.");
  }

  return (
    <SectionCard
      title="Equipe do projeto"
      description="Selecione a equipe permanente que fará parte deste novo projeto."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={refreshList}>
            <RefreshCw className="mr-2 size-4" />
            Atualizar lista
          </Button>

          <Button type="button" onClick={() => setOpen((current) => !current)}>
            <Plus className="mr-2 size-4" />
            {open ? "Ocultar equipe" : "Adicionar equipe"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>{selectedIds.length}</strong> pessoa(s) selecionada(s) para este projeto.
          Depois de clicar em <strong>Salvar projeto</strong>, elas entram na aba <strong>Equipe</strong> do projeto.
        </div>

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        ) : null}

        {selectedMembers.length > 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-800">
              <CheckCircle2 className="size-4" />
              Pessoas selecionadas
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {selectedMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-emerald-100 bg-white p-3"
                >
                  <p className="text-sm font-black text-slate-950">{member.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {member.role || "Função não informada"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {member.rubric || "Sem rubrica"}
                    {member.defaultAmount ? ` • ${member.defaultAmount}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={selectAllMembers}>
            Selecionar todos
          </Button>

          <Button type="button" variant="outline" onClick={clearSelectedMembers}>
            <Trash2 className="mr-2 size-4" />
            Limpar seleção
          </Button>
        </div>

        {open ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-950">
                  Equipe permanente cadastrada
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Marque quem fará parte deste novo projeto.
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                {activeMembers.length} ativo(s)
              </span>
            </div>

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
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeMembers.map((member) => {
                  const checked = selectedIds.includes(member.id);

                  return (
                    <label
                      key={member.id}
                      className={
                        checked
                          ? "flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition"
                          : "flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-red-200 hover:bg-red-50/40"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(member.id)}
                        className="mt-1 size-4"
                      />

                      <span>
                        <strong className="block text-sm text-slate-950">
                          {member.name}
                        </strong>

                        <span className="mt-1 block text-sm text-slate-600">
                          {member.role || "Função não informada"}
                        </span>

                        <span className="mt-1 block text-xs text-slate-400">
                          {member.rubric || "Sem rubrica"}
                          {member.defaultAmount ? ` • ${member.defaultAmount}` : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
