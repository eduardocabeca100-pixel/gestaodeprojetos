#!/usr/bin/env bash
set -e

echo "Verificando projeto Next..."
if [ ! -f "package.json" ] || [ ! -d "src/app" ]; then
  echo "ERRO: rode este script na raiz do projeto Next, onde existe package.json e src/app."
  exit 1
fi

echo "Criando backup rápido..."
tar -czf ".backup-antes-correcao-next-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

echo "Removendo arquivos errados criados para o projeto Vite/React Router..."
rm -rf src/admin
rm -f src/app/routes.tsx

mkdir -p src/components/team
mkdir -p src/components/projects
mkdir -p 'src/app/(protected)/equipe'
mkdir -p 'src/app/(protected)/equipe/global'
mkdir -p 'src/app/(protected)/equipe/projeto'
mkdir -p 'src/app/(protected)/projetos/novo'

cat > src/components/team/local-team-store.ts <<'EOF'
export type LocalPaymentStatus = "Previsto" | "Pendente" | "Parcial" | "Pago";

export type LocalTeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  document: string;
  rubric: string;
  defaultAmount: string;
  notes: string;
  active: boolean;
};

export type LocalProjectAssignment = {
  id: string;
  memberId: string;
  name: string;
  role: string;
  rubric: string;
  expectedAmount: string;
  paidAmount: string;
  paymentStatus: LocalPaymentStatus;
  notes: string;
};

export const TEAM_ROSTER_STORAGE_KEY = "viva:team-roster:v1";
export const PROJECT_ASSIGNMENTS_STORAGE_KEY = "viva:project-team-assignments:v1";
export const PROJECT_TEAM_DRAFT_STORAGE_KEY = "viva:project-team-draft:v1";

export const paymentStatusOptions: LocalPaymentStatus[] = ["Previsto", "Pendente", "Parcial", "Pago"];

export const defaultLocalTeamMembers: LocalTeamMember[] = [
  {
    id: "eduardo-cabeca",
    name: "Eduardo Cabeça",
    role: "Direção geral e produção executiva",
    email: "eduardocabeca100@gmail.com",
    phone: "",
    document: "",
    rubric: "Direção geral e executiva",
    defaultAmount: "",
    notes: "Responsável pela gestão artística e produção cultural.",
    active: true,
  },
  {
    id: "julia",
    name: "Júlia",
    role: "Atriz / Produção",
    email: "",
    phone: "",
    document: "",
    rubric: "Elenco",
    defaultAmount: "",
    notes: "",
    active: true,
  },
  {
    id: "reinaldo",
    name: "Reinaldo",
    role: "Ator / Apoio de produção",
    email: "",
    phone: "",
    document: "",
    rubric: "Elenco",
    defaultAmount: "",
    notes: "",
    active: true,
  },
];

export function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readLocalTeamRoster() {
  return readJson<LocalTeamMember[]>(TEAM_ROSTER_STORAGE_KEY, defaultLocalTeamMembers);
}

export function writeLocalTeamRoster(members: LocalTeamMember[]) {
  writeJson(TEAM_ROSTER_STORAGE_KEY, members);
}

export function readProjectAssignments() {
  return readJson<Record<string, LocalProjectAssignment[]>>(PROJECT_ASSIGNMENTS_STORAGE_KEY, {});
}

export function writeProjectAssignments(assignments: Record<string, LocalProjectAssignment[]>) {
  writeJson(PROJECT_ASSIGNMENTS_STORAGE_KEY, assignments);
}

export function makeAssignmentFromMember(member: LocalTeamMember): LocalProjectAssignment {
  return {
    id: createLocalId("assignment"),
    memberId: member.id,
    name: member.name,
    role: member.role,
    rubric: member.rubric,
    expectedAmount: member.defaultAmount,
    paidAmount: "",
    paymentStatus: "Previsto",
    notes: member.notes,
  };
}
EOF

cat > src/components/team/local-team-workspace.tsx <<'EOF'
"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, Pencil, UsersRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createLocalId,
  defaultLocalTeamMembers,
  makeAssignmentFromMember,
  paymentStatusOptions,
  readLocalTeamRoster,
  readProjectAssignments,
  writeLocalTeamRoster,
  writeProjectAssignments,
  type LocalProjectAssignment,
  type LocalTeamMember,
} from "@/components/team/local-team-store";

type Tab = "project" | "permanent";

type LocalTeamWorkspaceProps = {
  initialTab?: Tab;
  activeProject?: {
    id: string;
    name: string;
  };
};

const emptyMemberDraft: Omit<LocalTeamMember, "id"> = {
  name: "",
  role: "",
  email: "",
  phone: "",
  document: "",
  rubric: "",
  defaultAmount: "",
  notes: "",
  active: true,
};

const fallbackProject = {
  id: "projeto-refens",
  name: "Reféns",
};

export function LocalTeamWorkspace({
  initialTab = "project",
  activeProject = fallbackProject,
}: LocalTeamWorkspaceProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [members, setMembers] = useState<LocalTeamMember[]>(defaultLocalTeamMembers);
  const [assignmentsByProject, setAssignmentsByProject] = useState<Record<string, LocalProjectAssignment[]>>({});
  const [memberDraft, setMemberDraft] = useState(emptyMemberDraft);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [message, setMessage] = useState("Equipe carregada em modo local. Depois podemos ligar no Supabase.");

  const projectId = activeProject.id || fallbackProject.id;
  const projectAssignments = assignmentsByProject[projectId] ?? [];
  const activeMembers = useMemo(() => members.filter((member) => member.active), [members]);

  const availableMembers = activeMembers.filter(
    (member) => !projectAssignments.some((assignment) => assignment.memberId === member.id),
  );

  useEffect(() => {
    setMembers(readLocalTeamRoster());
    setAssignmentsByProject(readProjectAssignments());
  }, []);

  function persistMembers(nextMembers: LocalTeamMember[]) {
    setMembers(nextMembers);
    writeLocalTeamRoster(nextMembers);
  }

  function persistAssignments(nextAssignments: Record<string, LocalProjectAssignment[]>) {
    setAssignmentsByProject(nextAssignments);
    writeProjectAssignments(nextAssignments);
  }

  function resetMemberForm() {
    setMemberDraft(emptyMemberDraft);
    setEditingMemberId(null);
  }

  function saveMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!memberDraft.name.trim() || !memberDraft.role.trim()) {
      setMessage("Preencha pelo menos nome e função para salvar a equipe permanente.");
      return;
    }

    if (editingMemberId) {
      const nextMembers = members.map((member) =>
        member.id === editingMemberId ? { ...member, ...memberDraft } : member,
      );

      const nextAssignments = Object.fromEntries(
        Object.entries(assignmentsByProject).map(([currentProjectId, assignments]) => [
          currentProjectId,
          assignments.map((assignment) =>
            assignment.memberId === editingMemberId
              ? {
                  ...assignment,
                  name: memberDraft.name,
                  role: memberDraft.role,
                  rubric: assignment.rubric || memberDraft.rubric,
                  expectedAmount: assignment.expectedAmount || memberDraft.defaultAmount,
                }
              : assignment,
          ),
        ]),
      );

      persistMembers(nextMembers);
      persistAssignments(nextAssignments);
      resetMemberForm();
      setMessage("Equipe permanente atualizada e sincronizada com os projetos.");
      return;
    }

    const nextMember: LocalTeamMember = {
      id: createLocalId("member"),
      ...memberDraft,
    };

    persistMembers([nextMember, ...members]);
    resetMemberForm();
    setMessage("Pessoa adicionada à equipe permanente.");
  }

  function editMember(member: LocalTeamMember) {
    setTab("permanent");
    setEditingMemberId(member.id);
    setMemberDraft({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      document: member.document,
      rubric: member.rubric,
      defaultAmount: member.defaultAmount,
      notes: member.notes,
      active: member.active,
    });
    setMessage("Editando equipe permanente.");
  }

  function removeMember(memberId: string) {
    const nextMembers = members.filter((member) => member.id !== memberId);

    const nextAssignments = Object.fromEntries(
      Object.entries(assignmentsByProject).map(([currentProjectId, assignments]) => [
        currentProjectId,
        assignments.filter((assignment) => assignment.memberId !== memberId),
      ]),
    );

    persistMembers(nextMembers);
    persistAssignments(nextAssignments);
    if (editingMemberId === memberId) resetMemberForm();
    setMessage("Pessoa removida da equipe permanente e dos projetos.");
  }

  function toggleMemberStatus(memberId: string) {
    const nextMembers = members.map((member) =>
      member.id === memberId ? { ...member, active: !member.active } : member,
    );

    persistMembers(nextMembers);
    setMessage("Status da equipe permanente atualizado.");
  }

  function addMemberToProject(memberId: string) {
    const member = activeMembers.find((item) => item.id === memberId);
    if (!member) return;

    const currentAssignments = assignmentsByProject[projectId] ?? [];
    if (currentAssignments.some((assignment) => assignment.memberId === member.id)) return;

    const nextAssignments = {
      ...assignmentsByProject,
      [projectId]: [...currentAssignments, makeAssignmentFromMember(member)],
    };

    persistAssignments(nextAssignments);
    setMessage(`${member.name} foi adicionado(a) à equipe do projeto ${activeProject.name}.`);
  }

  function updateAssignment(assignmentId: string, field: keyof LocalProjectAssignment, value: string) {
    const nextProjectAssignments = projectAssignments.map((assignment) =>
      assignment.id === assignmentId ? { ...assignment, [field]: value } : assignment,
    );

    persistAssignments({
      ...assignmentsByProject,
      [projectId]: nextProjectAssignments,
    });
  }

  function removeAssignment(assignmentId: string) {
    persistAssignments({
      ...assignmentsByProject,
      [projectId]: projectAssignments.filter((assignment) => assignment.id !== assignmentId),
    });

    setMessage("Pessoa removida da equipe deste projeto.");
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Gestão e produção</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Equipe</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Controle a equipe permanente e selecione quem entra em cada projeto. A mesma pessoa pode participar de várias produções.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
                <strong className="block text-2xl">{members.length}</strong>
                <span className="text-xs text-slate-300">permanentes</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
                <strong className="block text-2xl">{projectAssignments.length}</strong>
                <span className="text-xs text-slate-300">no projeto</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <button
            type="button"
            onClick={() => setTab("project")}
            className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
              tab === "project" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Equipe do projeto
          </button>

          <button
            type="button"
            onClick={() => setTab("permanent")}
            className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
              tab === "permanent" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Equipe permanente
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {message}
          </div>
        </div>
      </section>

      {tab === "project" ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-red-600">Equipe do projeto</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{activeProject.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Selecione pessoas da equipe permanente e edite rubrica, valor e status.
              </p>
            </div>

            <label className="w-full max-w-md">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Adicionar equipe permanente
              </span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) {
                    addMemberToProject(event.target.value);
                    event.currentTarget.value = "";
                  }
                }}
              >
                <option value="">Selecionar pessoa</option>
                {availableMembers.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name} — {member.role}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[1.1fr_1.1fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-3 px-3 pb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                <span>Nome</span>
                <span>Função</span>
                <span>Rubrica</span>
                <span>Previsto</span>
                <span>Pago</span>
                <span>Status</span>
                <span>Ações</span>
              </div>

              {projectAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Nenhuma pessoa vinculada a este projeto ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {projectAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="grid grid-cols-[1.1fr_1.1fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <input
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={assignment.name}
                        onChange={(event) => updateAssignment(assignment.id, "name", event.target.value)}
                      />
                      <input
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={assignment.role}
                        onChange={(event) => updateAssignment(assignment.id, "role", event.target.value)}
                      />
                      <input
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={assignment.rubric}
                        onChange={(event) => updateAssignment(assignment.id, "rubric", event.target.value)}
                        placeholder="Rubrica"
                      />
                      <input
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={assignment.expectedAmount}
                        onChange={(event) => updateAssignment(assignment.id, "expectedAmount", event.target.value)}
                        placeholder="R$ 0,00"
                      />
                      <input
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={assignment.paidAmount}
                        onChange={(event) => updateAssignment(assignment.id, "paidAmount", event.target.value)}
                        placeholder="R$ 0,00"
                      />
                      <select
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={assignment.paymentStatus}
                        onChange={(event) => updateAssignment(assignment.id, "paymentStatus", event.target.value)}
                      >
                        {paymentStatusOptions.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeAssignment(assignment.id)}
                        className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[430px_1fr]">
          <form onSubmit={saveMember} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-600">
                  {editingMemberId ? "Editar" : "Adicionar"}
                </p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Equipe permanente
                </h3>
              </div>

              {editingMemberId ? (
                <Button type="button" variant="outline" onClick={resetMemberForm}>
                  Cancelar
                </Button>
              ) : null}
            </div>

            <div className="space-y-4">
              <InputLine label="Nome">
                <input
                  value={memberDraft.name}
                  onChange={(event) => setMemberDraft({ ...memberDraft, name: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
                  placeholder="Nome completo"
                />
              </InputLine>

              <InputLine label="Função">
                <input
                  value={memberDraft.role}
                  onChange={(event) => setMemberDraft({ ...memberDraft, role: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
                  placeholder="Ator, direção, produção..."
                />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="E-mail">
                  <input
                    value={memberDraft.email}
                    onChange={(event) => setMemberDraft({ ...memberDraft, email: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
                    placeholder="email@exemplo.com"
                  />
                </InputLine>

                <InputLine label="Telefone">
                  <input
                    value={memberDraft.phone}
                    onChange={(event) => setMemberDraft({ ...memberDraft, phone: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
                    placeholder="(47) 99999-9999"
                  />
                </InputLine>
              </div>

              <InputLine label="CPF/CNPJ ou documento">
                <input
                  value={memberDraft.document}
                  onChange={(event) => setMemberDraft({ ...memberDraft, document: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
                  placeholder="Documento"
                />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="Rubrica padrão">
                  <input
                    value={memberDraft.rubric}
                    onChange={(event) => setMemberDraft({ ...memberDraft, rubric: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
                    placeholder="Elenco, direção..."
                  />
                </InputLine>

                <InputLine label="Valor padrão">
                  <input
                    value={memberDraft.defaultAmount}
                    onChange={(event) => setMemberDraft({ ...memberDraft, defaultAmount: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
                    placeholder="R$ 0,00"
                  />
                </InputLine>
              </div>

              <InputLine label="Notas">
                <textarea
                  value={memberDraft.notes}
                  onChange={(event) => setMemberDraft({ ...memberDraft, notes: event.target.value })}
                  className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
                  placeholder="Observações sobre a pessoa..."
                />
              </InputLine>

              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={memberDraft.active}
                  onChange={(event) => setMemberDraft({ ...memberDraft, active: event.target.checked })}
                />
                Pessoa ativa para seleção nos projetos
              </label>

              <Button type="submit" className="w-full">
                <Save className="mr-2 size-4" />
                {editingMemberId ? "Salvar edição" : "Adicionar pessoa"}
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            {members.map((member) => (
              <article key={member.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-black text-slate-950">{member.name}</h4>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                          member.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {member.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{member.role}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {member.rubric || "Sem rubrica"} {member.defaultAmount ? `• ${member.defaultAmount}` : ""}
                    </p>
                    {member.email || member.phone ? (
                      <p className="mt-2 text-xs text-slate-400">
                        {[member.email, member.phone].filter(Boolean).join(" • ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => editMember(member)}>
                      <Pencil className="mr-2 size-4" />
                      Editar
                    </Button>
                    <Button type="button" variant="outline" onClick={() => toggleMemberStatus(member.id)}>
                      <CheckCircle2 className="mr-2 size-4" />
                      {member.active ? "Inativar" : "Ativar"}
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => removeMember(member.id)}>
                      <Trash2 className="mr-2 size-4" />
                      Apagar
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InputLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
EOF

cat > src/components/projects/project-team-picker.tsx <<'EOF'
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
EOF

cat > src/app/login/page.tsx <<'EOF'
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen overflow-hidden bg-[#07080d] text-white lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-white/10 px-12 py-12 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(229,9,20,0.35),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.22),transparent_34%),linear-gradient(135deg,#11131c,#07080d_58%,#030408)]" />
        <div className="absolute inset-8 rounded-[2.3rem] border border-white/10 bg-white/[0.03]" />
        <div className="absolute right-[8%] top-[18%] size-[390px] rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_12%),radial-gradient(circle_at_center,rgba(229,9,20,0.36),transparent_48%)] shadow-[0_40px_120px_rgba(0,0,0,0.45)]" />
        <div className="absolute right-[14%] top-[28%] text-[8rem] font-black leading-none text-white/90 drop-shadow-[0_25px_80px_rgba(229,9,20,0.65)]">
          ✦
        </div>

        <div className="relative z-10">
          <p className="text-[6rem] font-black leading-[0.78] tracking-[-0.12em] text-white">
            VIVA
          </p>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.32em] text-red-300">
            Gestão e produção
          </p>
        </div>

        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
            Painel privado
          </p>
          <h1 className="mt-4 max-w-3xl text-[clamp(3.2rem,6vw,6.8rem)] font-black leading-[0.85] tracking-[-0.085em]">
            Gestão cultural com cara de sistema profissional.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
            Organize projetos, equipe, documentos, financeiro, relatórios e produção da Cia Viva em um painel único.
          </p>

          <div className="mt-9 grid max-w-3xl grid-cols-3 gap-4">
            {[
              ["Projetos", "produção e execução"],
              ["Equipe", "permanente e por obra"],
              ["Gestão", "rubricas e relatórios"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                <strong className="block text-sm">{title}</strong>
                <span className="mt-2 block text-xs leading-5 text-slate-400">{description}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm text-slate-400">www.ciaviva.com</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-white/[0.04] px-6 py-10 backdrop-blur-2xl">
        <div className="w-full max-w-[520px] rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="mb-8">
            <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-red-600 to-red-950 text-sm font-black text-white shadow-lg shadow-red-950/30">
              V
            </div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Companhia de Artes Viva
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.06em]">
              Entrar no painel
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Acesse a plataforma para gerir projetos, equipe, financeiro, documentos e prestação de contas.
            </p>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
EOF

cat > 'src/app/(protected)/projetos/novo/page.tsx' <<'EOF'
import { PageContainer } from "@/components/layout/page-container";
import { ProjectBannerUpload } from "@/components/projects/project-banner-upload";
import { ProjectCoverUpload } from "@/components/projects/project-cover-upload";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectTeamPicker } from "@/components/projects/project-team-picker";
import { requireAuthorizedProfile } from "@/lib/auth/require-role";

export default async function NewProjectPage() {
  await requireAuthorizedProfile(["admin", "super_admin"]);

  return (
    <PageContainer
      title="Novo projeto"
      description="Cadastre os dados principais do projeto e selecione a equipe permanente que fará parte da produção."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <ProjectForm />
          <ProjectTeamPicker />
        </div>

        <div className="space-y-6">
          <ProjectCoverUpload />
          <ProjectBannerUpload />
        </div>
      </div>
    </PageContainer>
  );
}
EOF

cat > 'src/app/(protected)/equipe/page.tsx' <<'EOF'
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { LocalTeamWorkspace } from "@/components/team/local-team-workspace";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);

  return (
    <PageContainer
      title="Equipe"
      description="Gerencie equipe do projeto e equipe permanente em uma tela organizada."
    >
      <div className="space-y-6">
        <ProjectScopeBanner project={project} />
        <LocalTeamWorkspace
          initialTab="project"
          activeProject={{ id: project.id, name: project.name }}
        />
      </div>
    </PageContainer>
  );
}
EOF

cat > 'src/app/(protected)/equipe/global/page.tsx' <<'EOF'
import { PageContainer } from "@/components/layout/page-container";
import { LocalTeamWorkspace } from "@/components/team/local-team-workspace";

export default function TeamRosterPage() {
  return (
    <PageContainer
      title="Equipe permanente"
      description="Cadastre, edite, ative, inative ou apague pessoas que poderão participar de vários projetos."
    >
      <LocalTeamWorkspace initialTab="permanent" />
    </PageContainer>
  );
}
EOF

cat > 'src/app/(protected)/equipe/projeto/page.tsx' <<'EOF'
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { LocalTeamWorkspace } from "@/components/team/local-team-workspace";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";

export default async function ProjectTeamPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);

  return (
    <PageContainer
      title="Equipe do projeto"
      description="Selecione a equipe permanente e ajuste rubrica, valor e status por projeto."
    >
      <div className="space-y-6">
        <ProjectScopeBanner project={project} />
        <LocalTeamWorkspace
          initialTab="project"
          activeProject={{ id: project.id, name: project.name }}
        />
      </div>
    </PageContainer>
  );
}
EOF

echo "Garantindo que arquivos sensíveis não subam..."
touch .gitignore
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF "node_modules" .gitignore || echo "node_modules" >> .gitignore
grep -qxF ".next" .gitignore || echo ".next" >> .gitignore
grep -qxF "dist" .gitignore || echo "dist" >> .gitignore

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  git rm --cached .env
fi

if git ls-files --error-unmatch .env.local >/dev/null 2>&1; then
  git rm --cached .env.local
fi

echo "Verificando se o erro antigo saiu..."
if grep -R "firebase/auth" -n src 2>/dev/null; then
  echo "ERRO: ainda existe firebase/auth dentro de src. Remova antes de buildar."
  exit 1
else
  echo "OK: firebase/auth removido."
fi

echo "Rodando build..."
npm run build

echo "Conferindo alterações principais..."
grep -R "Gestão e produção" -n src/app/login/page.tsx
grep -R "Adicionar equipe" -n src/components/projects/project-team-picker.tsx
grep -R "Equipe permanente" -n src/components/team/local-team-workspace.tsx

echo "Status do Git:"
git status --short

git add src .gitignore package.json package-lock.json
git commit -m "Corrige login equipe permanente e seleção de equipe por projeto" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. O Vercel deve iniciar o deploy automaticamente."
