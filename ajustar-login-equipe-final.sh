#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-login-equipe-final-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

echo "Removendo arquivos antigos errados, caso ainda existam..."
rm -rf src/admin
rm -f src/app/routes.tsx

mkdir -p src/components/team
mkdir -p src/app/login

cat > src/app/login/page.tsx <<'EOF'
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#06070b] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden min-h-screen overflow-hidden border-r border-white/10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(124,58,237,0.25),transparent_30%),radial-gradient(circle_at_70%_55%,rgba(229,9,20,0.24),transparent_28%),linear-gradient(140deg,#080a12_0%,#10121b_45%,#05060a_100%)]" />
          <div className="absolute inset-6 rounded-[2.2rem] border border-white/10 bg-white/[0.025] shadow-[inset_0_0_80px_rgba(255,255,255,0.025)]" />

          <div className="absolute left-0 top-0 h-56 w-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent)]" />
          <div className="absolute left-[12%] top-0 h-[42%] w-px bg-gradient-to-b from-white/35 to-transparent" />
          <div className="absolute left-[24%] top-0 h-[38%] w-px bg-gradient-to-b from-white/25 to-transparent" />
          <div className="absolute left-[36%] top-0 h-[42%] w-px bg-gradient-to-b from-white/20 to-transparent" />
          <div className="absolute left-[58%] top-0 h-[38%] w-px bg-gradient-to-b from-white/20 to-transparent" />
          <div className="absolute left-[72%] top-0 h-[42%] w-px bg-gradient-to-b from-white/25 to-transparent" />

          <div className="absolute bottom-0 left-0 h-[42%] w-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.18),transparent_38%),linear-gradient(to_top,#030407_8%,transparent)]" />
          <div className="absolute bottom-[13%] left-[14%] flex items-end gap-7 opacity-80">
            {[72, 92, 82, 105, 78, 96].map((height, index) => (
              <div key={index} className="relative w-8">
                <div className="mx-auto size-7 rounded-full bg-black/80 shadow-[0_0_30px_rgba(255,255,255,0.15)]" />
                <div
                  className="mx-auto mt-1 w-5 rounded-t-full bg-black/85"
                  style={{ height }}
                />
              </div>
            ))}
          </div>

          <div className="relative z-10 flex min-h-screen flex-col justify-between px-14 py-12">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-serif text-4xl font-black leading-none tracking-tight">
                  GESTÃO E
                  <br />
                  PRODUÇÃO
                </p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.38em] text-violet-300">
                  Teatro • Cultura • Projetos
                </p>
              </div>
            </div>

            <div className="max-w-xl pb-10">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-violet-300">
                Painel privado
              </p>
              <h1 className="mt-5 font-serif text-[clamp(3.2rem,5.7vw,6.5rem)] font-black leading-[0.9] tracking-[-0.055em]">
                Gestão cultural da Companhia Viva.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
                Acesse projetos, equipe, documentos, financeiro e produção em um painel organizado para a gestão da companhia.
              </p>
            </div>

            <p className="text-sm text-slate-500">© Gestão e Produção Cultural</p>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-5 py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(124,58,237,0.14),transparent_34%),linear-gradient(135deg,#0a0b10,#121419)]" />

          <div className="relative w-full max-w-[520px] rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-[0_35px_130px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8 lg:p-10">
            <div className="mb-8">
              <p className="font-serif text-3xl font-black leading-none tracking-tight">
                GESTÃO E PRODUÇÃO
              </p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.32em] text-violet-300">
                Companhia Viva
              </p>

              <h2 className="mt-8 text-3xl font-black tracking-[-0.04em]">
                Entrar no painel
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Faça login para acessar sua área administrativa.
              </p>
            </div>

            <LoginForm />

            <div className="mt-8 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-white/10" />
              <span>Acesso restrito a usuários autorizados</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
EOF

cat > src/components/team/local-team-store.ts <<'EOF'
export type LocalPaymentStatus = "Previsto" | "Pendente" | "Parcial" | "Pago";

export type LocalPaymentHistoryEntry = {
  id: string;
  date: string;
  amount: string;
  note: string;
};

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
  paymentHistory: LocalPaymentHistoryEntry[];
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
    paymentHistory: [],
  };
}
EOF

cat > src/components/team/local-team-workspace.tsx <<'EOF'
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  CheckCircle2,
  DollarSign,
  History,
  Pencil,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";
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
  type LocalPaymentHistoryEntry,
  type LocalPaymentStatus,
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

type PaymentDraft = {
  amount: string;
  note: string;
};

type EditableAssignmentField =
  | "name"
  | "role"
  | "rubric"
  | "expectedAmount"
  | "paidAmount"
  | "paymentStatus"
  | "notes";

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

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

function formatBRLFromNumber(value: number) {
  return brlFormatter.format(value);
}

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return brlFormatter.format(Number(digits) / 100);
}

function normalizeAssignment(assignment: LocalProjectAssignment): LocalProjectAssignment {
  return {
    ...assignment,
    paymentHistory: Array.isArray(assignment.paymentHistory) ? assignment.paymentHistory : [],
    expectedAmount: assignment.expectedAmount ?? "",
    paidAmount: assignment.paidAmount ?? "",
    paymentStatus: assignment.paymentStatus ?? "Previsto",
    notes: assignment.notes ?? "",
  };
}

function normalizeAssignments(input: Record<string, LocalProjectAssignment[]>) {
  const normalized: Record<string, LocalProjectAssignment[]> = {};

  for (const [projectId, assignments] of Object.entries(input)) {
    normalized[projectId] = assignments.map(normalizeAssignment);
  }

  return normalized;
}

export function LocalTeamWorkspace({
  initialTab = "project",
  activeProject = fallbackProject,
}: LocalTeamWorkspaceProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [members, setMembers] = useState<LocalTeamMember[]>(defaultLocalTeamMembers);
  const [assignmentsByProject, setAssignmentsByProject] = useState<Record<string, LocalProjectAssignment[]>>({});
  const [memberDraft, setMemberDraft] = useState(emptyMemberDraft);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingAssignments, setEditingAssignments] = useState<string[]>([]);
  const [openHistory, setOpenHistory] = useState<string[]>([]);
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, PaymentDraft>>({});
  const [message, setMessage] = useState("Equipe carregada. Cadastre a equipe permanente e vincule aos projetos.");

  const projectId = activeProject.id || fallbackProject.id;
  const projectAssignments = assignmentsByProject[projectId] ?? [];
  const activeMembers = useMemo(() => members.filter((member) => member.active), [members]);

  const availableMembers = activeMembers.filter(
    (member) => !projectAssignments.some((assignment) => assignment.memberId === member.id),
  );

  const totalExpected = projectAssignments.reduce(
    (sum, assignment) => sum + parseCurrency(assignment.expectedAmount),
    0,
  );

  const totalPaid = projectAssignments.reduce(
    (sum, assignment) => sum + parseCurrency(assignment.paidAmount),
    0,
  );

  const totalOpen = Math.max(totalExpected - totalPaid, 0);

  useEffect(() => {
    setMembers(readLocalTeamRoster());
    setAssignmentsByProject(normalizeAssignments(readProjectAssignments()));
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

  function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!memberDraft.name.trim() || !memberDraft.role.trim()) {
      setMessage("Preencha pelo menos nome e função para salvar a equipe permanente.");
      return;
    }

    const normalizedDraft = {
      ...memberDraft,
      defaultAmount: formatCurrencyInput(memberDraft.defaultAmount),
    };

    if (editingMemberId) {
      const nextMembers = members.map((member) =>
        member.id === editingMemberId ? { ...member, ...normalizedDraft } : member,
      );

      const nextAssignments: Record<string, LocalProjectAssignment[]> = {};

      for (const [currentProjectId, assignments] of Object.entries(assignmentsByProject)) {
        nextAssignments[currentProjectId] = assignments.map((assignment) =>
          assignment.memberId === editingMemberId
            ? {
                ...assignment,
                name: normalizedDraft.name,
                role: normalizedDraft.role,
                rubric: assignment.rubric || normalizedDraft.rubric,
                expectedAmount: assignment.expectedAmount || normalizedDraft.defaultAmount,
              }
            : assignment,
        );
      }

      persistMembers(nextMembers);
      persistAssignments(nextAssignments);
      resetMemberForm();
      setMessage("Equipe permanente atualizada e sincronizada com os projetos.");
      return;
    }

    const nextMember: LocalTeamMember = {
      id: createLocalId("member"),
      ...normalizedDraft,
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
    const nextAssignments: Record<string, LocalProjectAssignment[]> = {};

    for (const [currentProjectId, assignments] of Object.entries(assignmentsByProject)) {
      nextAssignments[currentProjectId] = assignments.filter((assignment) => assignment.memberId !== memberId);
    }

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

  function updateAssignment(assignmentId: string, field: EditableAssignmentField, value: string) {
    const normalizedValue =
      field === "expectedAmount" || field === "paidAmount"
        ? formatCurrencyInput(value)
        : value;

    const nextProjectAssignments = projectAssignments.map((assignment) =>
      assignment.id === assignmentId
        ? {
            ...assignment,
            [field]: field === "paymentStatus" ? (normalizedValue as LocalPaymentStatus) : normalizedValue,
          }
        : assignment,
    );

    persistAssignments({
      ...assignmentsByProject,
      [projectId]: nextProjectAssignments,
    });
  }

  function toggleAssignmentEdit(assignmentId: string) {
    setEditingAssignments((current) =>
      current.includes(assignmentId)
        ? current.filter((id) => id !== assignmentId)
        : [...current, assignmentId],
    );
  }

  function toggleHistory(assignmentId: string) {
    setOpenHistory((current) =>
      current.includes(assignmentId)
        ? current.filter((id) => id !== assignmentId)
        : [...current, assignmentId],
    );
  }

  function updatePaymentDraft(assignmentId: string, field: keyof PaymentDraft, value: string) {
    setPaymentDrafts((current) => ({
      ...current,
      [assignmentId]: {
        amount: current[assignmentId]?.amount ?? "",
        note: current[assignmentId]?.note ?? "",
        [field]: field === "amount" ? formatCurrencyInput(value) : value,
      },
    }));
  }

  function addPaymentHistory(assignmentId: string) {
    const draft = paymentDrafts[assignmentId];

    if (!draft?.amount || parseCurrency(draft.amount) <= 0) {
      setMessage("Informe um valor em reais para registrar o pagamento.");
      return;
    }

    const nextProjectAssignments = projectAssignments.map((assignment) => {
      if (assignment.id !== assignmentId) return assignment;

      const currentPaid = parseCurrency(assignment.paidAmount);
      const newPayment = parseCurrency(draft.amount);
      const expected = parseCurrency(assignment.expectedAmount);
      const totalPaidNow = currentPaid + newPayment;

      const historyEntry: LocalPaymentHistoryEntry = {
        id: createLocalId("payment"),
        date: new Date().toISOString().slice(0, 10),
        amount: draft.amount,
        note: draft.note,
      };

      return {
        ...assignment,
        paidAmount: formatBRLFromNumber(totalPaidNow),
        paymentStatus:
          expected > 0 && totalPaidNow >= expected
            ? "Pago"
            : totalPaidNow > 0
              ? "Parcial"
              : assignment.paymentStatus,
        paymentHistory: [historyEntry, ...assignment.paymentHistory],
      };
    });

    persistAssignments({
      ...assignmentsByProject,
      [projectId]: nextProjectAssignments,
    });

    setPaymentDrafts((current) => ({
      ...current,
      [assignmentId]: { amount: "", note: "" },
    }));

    setMessage("Pagamento registrado no histórico.");
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
              <p className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Gestão de equipe</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Equipe e pagamentos</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Controle equipe permanente, equipe por projeto, valores previstos, pagamentos realizados e saldo em aberto.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <SummaryCard title="Previsto" value={formatBRLFromNumber(totalExpected)} />
              <SummaryCard title="Pago" value={formatBRLFromNumber(totalPaid)} />
              <SummaryCard title="Em aberto" value={formatBRLFromNumber(totalOpen)} />
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
                Adicione pessoas da equipe permanente e edite rubrica, valor previsto, valor pago e status.
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

          <div className="mt-5 space-y-4">
            {projectAssignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                <UsersRound className="mx-auto mb-3 size-8 text-slate-400" />
                Nenhuma pessoa vinculada a este projeto ainda.
              </div>
            ) : (
              projectAssignments.map((assignment) => {
                const isEditing = editingAssignments.includes(assignment.id);
                const historyIsOpen = openHistory.includes(assignment.id);
                const paymentDraft = paymentDrafts[assignment.id] ?? { amount: "", note: "" };
                const expected = parseCurrency(assignment.expectedAmount);
                const paid = parseCurrency(assignment.paidAmount);
                const open = Math.max(expected - paid, 0);

                return (
                  <article key={assignment.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h4 className="text-lg font-black text-slate-950">{assignment.name}</h4>
                        <p className="mt-1 text-sm font-semibold text-slate-600">{assignment.role}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          {assignment.rubric || "Sem rubrica"} • Previsto: {assignment.expectedAmount || "R$ 0,00"} • Pago: {assignment.paidAmount || "R$ 0,00"} • Aberto: {formatBRLFromNumber(open)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => toggleAssignmentEdit(assignment.id)}>
                          <Pencil className="mr-2 size-4" />
                          {isEditing ? "Salvar" : "Editar"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => toggleHistory(assignment.id)}>
                          <History className="mr-2 size-4" />
                          Histórico
                        </Button>
                        <Button type="button" variant="destructive" onClick={() => removeAssignment(assignment.id)}>
                          <Trash2 className="mr-2 size-4" />
                          Remover
                        </Button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-5 grid gap-3 lg:grid-cols-3">
                        <InputLine label="Nome">
                          <input className="input-team" value={assignment.name} onChange={(event) => updateAssignment(assignment.id, "name", event.target.value)} />
                        </InputLine>
                        <InputLine label="Função">
                          <input className="input-team" value={assignment.role} onChange={(event) => updateAssignment(assignment.id, "role", event.target.value)} />
                        </InputLine>
                        <InputLine label="Rubrica">
                          <input className="input-team" value={assignment.rubric} onChange={(event) => updateAssignment(assignment.id, "rubric", event.target.value)} />
                        </InputLine>
                        <InputLine label="Valor previsto">
                          <input className="input-team" value={assignment.expectedAmount} onChange={(event) => updateAssignment(assignment.id, "expectedAmount", event.target.value)} placeholder="R$ 0,00" />
                        </InputLine>
                        <InputLine label="Valor pago">
                          <input className="input-team" value={assignment.paidAmount} onChange={(event) => updateAssignment(assignment.id, "paidAmount", event.target.value)} placeholder="R$ 0,00" />
                        </InputLine>
                        <InputLine label="Status">
                          <select className="input-team" value={assignment.paymentStatus} onChange={(event) => updateAssignment(assignment.id, "paymentStatus", event.target.value)}>
                            {paymentStatusOptions.map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </InputLine>
                      </div>
                    ) : null}

                    {historyIsOpen ? (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-4 grid gap-3 lg:grid-cols-[180px_1fr_auto]">
                          <input
                            className="input-team"
                            value={paymentDraft.amount}
                            onChange={(event) => updatePaymentDraft(assignment.id, "amount", event.target.value)}
                            placeholder="R$ 0,00"
                          />
                          <input
                            className="input-team"
                            value={paymentDraft.note}
                            onChange={(event) => updatePaymentDraft(assignment.id, "note", event.target.value)}
                            placeholder="Observação do pagamento"
                          />
                          <Button type="button" onClick={() => addPaymentHistory(assignment.id)}>
                            <DollarSign className="mr-2 size-4" />
                            Registrar pagamento
                          </Button>
                        </div>

                        {assignment.paymentHistory.length === 0 ? (
                          <p className="text-sm text-slate-500">Nenhum pagamento registrado no histórico.</p>
                        ) : (
                          <div className="space-y-2">
                            {assignment.paymentHistory.map((payment) => (
                              <div key={payment.id} className="flex flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <span className="font-bold text-slate-800">{payment.amount}</span>
                                <span className="text-slate-500">{payment.date}</span>
                                <span className="text-slate-500">{payment.note || "Sem observação"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
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
                <input value={memberDraft.name} onChange={(event) => setMemberDraft({ ...memberDraft, name: event.target.value })} className="input-team" placeholder="Nome completo" />
              </InputLine>

              <InputLine label="Função">
                <input value={memberDraft.role} onChange={(event) => setMemberDraft({ ...memberDraft, role: event.target.value })} className="input-team" placeholder="Ator, direção, produção..." />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="E-mail">
                  <input value={memberDraft.email} onChange={(event) => setMemberDraft({ ...memberDraft, email: event.target.value })} className="input-team" placeholder="email@exemplo.com" />
                </InputLine>

                <InputLine label="Telefone">
                  <input value={memberDraft.phone} onChange={(event) => setMemberDraft({ ...memberDraft, phone: event.target.value })} className="input-team" placeholder="(47) 99999-9999" />
                </InputLine>
              </div>

              <InputLine label="CPF/CNPJ ou documento">
                <input value={memberDraft.document} onChange={(event) => setMemberDraft({ ...memberDraft, document: event.target.value })} className="input-team" placeholder="Documento" />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="Rubrica padrão">
                  <input value={memberDraft.rubric} onChange={(event) => setMemberDraft({ ...memberDraft, rubric: event.target.value })} className="input-team" placeholder="Elenco, direção..." />
                </InputLine>

                <InputLine label="Valor padrão">
                  <input value={memberDraft.defaultAmount} onChange={(event) => setMemberDraft({ ...memberDraft, defaultAmount: formatCurrencyInput(event.target.value) })} className="input-team" placeholder="R$ 0,00" />
                </InputLine>
              </div>

              <InputLine label="Notas">
                <textarea value={memberDraft.notes} onChange={(event) => setMemberDraft({ ...memberDraft, notes: event.target.value })} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500" placeholder="Observações sobre a pessoa..." />
              </InputLine>

              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={memberDraft.active} onChange={(event) => setMemberDraft({ ...memberDraft, active: event.target.checked })} />
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
                      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${member.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                        {member.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{member.role}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {member.rubric || "Sem rubrica"} {member.defaultAmount ? `• ${member.defaultAmount}` : ""}
                    </p>
                    {member.email || member.phone ? (
                      <p className="mt-2 text-xs text-slate-400">{[member.email, member.phone].filter(Boolean).join(" • ")}</p>
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

      <style jsx global>{`
        .input-team {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input-team:focus {
          border-color: rgb(239 68 68);
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      <strong className="block text-sm">{value}</strong>
      <span className="text-xs text-slate-300">{title}</span>
    </div>
  );
}

function InputLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
EOF

echo "Garantindo proteção de arquivos sensíveis..."
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

echo "Verificando se não existe firebase/auth..."
if grep -R "firebase/auth" -n src 2>/dev/null; then
  echo "ERRO: ainda existe firebase/auth dentro de src."
  exit 1
fi

echo "Rodando build..."
npm run build

echo "Conferindo ajustes..."
grep -R "Gestão cultural da Companhia Viva" -n src/app/login/page.tsx
grep -R "Registrar pagamento" -n src/components/team/local-team-workspace.tsx
grep -R "formatBRLFromNumber" -n src/components/team/local-team-workspace.tsx

echo "Status:"
git status --short

git add src .gitignore package.json package-lock.json
git commit -m "Refina login e adiciona historico financeiro da equipe" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. O Vercel deve iniciar novo deploy."
