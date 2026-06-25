#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-casting-equipe-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

mkdir -p src/components/team

cat > src/components/team/local-team-store.ts <<'EOF'
export type LocalPaymentStatus = "Previsto" | "Pendente" | "Parcial" | "Pago";

export type LocalPersonType =
  | "Artista"
  | "Equipe técnica"
  | "Produção"
  | "Formação"
  | "Outros";

export type LocalPaymentHistoryEntry = {
  id: string;
  date: string;
  amount: string;
  note: string;
};

export type LocalTeamMember = {
  id: string;
  name: string;
  fullName: string;
  profileType: LocalPersonType;
  role: string;
  email: string;
  phone: string;
  document: string;
  cpf: string;
  rg: string;
  birthDate: string;
  age: string;
  address: string;
  cityUf: string;
  pixKey: string;
  bankInfo: string;
  portfolioUrl: string;
  rubric: string;
  defaultAmount: string;
  notes: string;
  active: boolean;
};

export type LocalProjectAssignment = {
  id: string;
  memberId: string;
  name: string;
  fullName: string;
  profileType: LocalPersonType;
  role: string;
  email: string;
  phone: string;
  document: string;
  cpf: string;
  rg: string;
  birthDate: string;
  age: string;
  address: string;
  cityUf: string;
  pixKey: string;
  bankInfo: string;
  portfolioUrl: string;
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

export const personTypeOptions: LocalPersonType[] = [
  "Artista",
  "Equipe técnica",
  "Produção",
  "Formação",
  "Outros",
];

export const defaultLocalTeamMembers: LocalTeamMember[] = [
  {
    id: "eduardo-cabeca",
    name: "Eduardo Cabeça",
    fullName: "Eduardo Cabeça",
    profileType: "Produção",
    role: "Direção geral e produção executiva",
    email: "eduardocabeca100@gmail.com",
    phone: "",
    document: "",
    cpf: "",
    rg: "",
    birthDate: "",
    age: "",
    address: "",
    cityUf: "Jaraguá do Sul | SC",
    pixKey: "",
    bankInfo: "",
    portfolioUrl: "",
    rubric: "Direção geral e executiva",
    defaultAmount: "",
    notes: "Responsável pela gestão artística e produção cultural.",
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

function normalizePersonType(value: unknown): LocalPersonType {
  return personTypeOptions.includes(value as LocalPersonType)
    ? (value as LocalPersonType)
    : "Artista";
}

export function calculateAgeFromBirthDate(birthDate: string) {
  if (!birthDate) return "";

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
}

export function normalizeTeamMember(member: Partial<LocalTeamMember>): LocalTeamMember {
  const name = member.name || member.fullName || "";

  return {
    id: member.id || createLocalId("member"),
    name,
    fullName: member.fullName || name,
    profileType: normalizePersonType(member.profileType),
    role: member.role || "",
    email: member.email || "",
    phone: member.phone || "",
    document: member.document || "",
    cpf: member.cpf || member.document || "",
    rg: member.rg || "",
    birthDate: member.birthDate || "",
    age: member.age || calculateAgeFromBirthDate(member.birthDate || ""),
    address: member.address || "",
    cityUf: member.cityUf || "Jaraguá do Sul | SC",
    pixKey: member.pixKey || "",
    bankInfo: member.bankInfo || "",
    portfolioUrl: member.portfolioUrl || "",
    rubric: member.rubric || "",
    defaultAmount: member.defaultAmount || "",
    notes: member.notes || "",
    active: member.active ?? true,
  };
}

export function normalizeAssignment(assignment: Partial<LocalProjectAssignment>): LocalProjectAssignment {
  const name = assignment.name || assignment.fullName || "";

  return {
    id: assignment.id || createLocalId("assignment"),
    memberId: assignment.memberId || createLocalId("project-person"),
    name,
    fullName: assignment.fullName || name,
    profileType: normalizePersonType(assignment.profileType),
    role: assignment.role || "",
    email: assignment.email || "",
    phone: assignment.phone || "",
    document: assignment.document || "",
    cpf: assignment.cpf || assignment.document || "",
    rg: assignment.rg || "",
    birthDate: assignment.birthDate || "",
    age: assignment.age || calculateAgeFromBirthDate(assignment.birthDate || ""),
    address: assignment.address || "",
    cityUf: assignment.cityUf || "Jaraguá do Sul | SC",
    pixKey: assignment.pixKey || "",
    bankInfo: assignment.bankInfo || "",
    portfolioUrl: assignment.portfolioUrl || "",
    rubric: assignment.rubric || "",
    expectedAmount: assignment.expectedAmount || "",
    paidAmount: assignment.paidAmount || "",
    paymentStatus: assignment.paymentStatus || "Previsto",
    notes: assignment.notes || "",
    paymentHistory: Array.isArray(assignment.paymentHistory) ? assignment.paymentHistory : [],
  };
}

export function readLocalTeamRoster() {
  return readJson<Partial<LocalTeamMember>[]>(TEAM_ROSTER_STORAGE_KEY, defaultLocalTeamMembers)
    .map(normalizeTeamMember);
}

export function writeLocalTeamRoster(members: LocalTeamMember[]) {
  writeJson(TEAM_ROSTER_STORAGE_KEY, members.map(normalizeTeamMember));
}

export function readProjectAssignments() {
  const current = readJson<Record<string, Partial<LocalProjectAssignment>[]>>(PROJECT_ASSIGNMENTS_STORAGE_KEY, {});
  const normalized: Record<string, LocalProjectAssignment[]> = {};

  for (const [projectId, assignments] of Object.entries(current)) {
    normalized[projectId] = assignments.map(normalizeAssignment);
  }

  return normalized;
}

export function writeProjectAssignments(assignments: Record<string, LocalProjectAssignment[]>) {
  const normalized: Record<string, LocalProjectAssignment[]> = {};

  for (const [projectId, projectAssignments] of Object.entries(assignments)) {
    normalized[projectId] = projectAssignments.map(normalizeAssignment);
  }

  writeJson(PROJECT_ASSIGNMENTS_STORAGE_KEY, normalized);
}

export function makeAssignmentFromMember(member: LocalTeamMember): LocalProjectAssignment {
  return normalizeAssignment({
    id: createLocalId("assignment"),
    memberId: member.id,
    name: member.name,
    fullName: member.fullName,
    profileType: member.profileType,
    role: member.role,
    email: member.email,
    phone: member.phone,
    document: member.document,
    cpf: member.cpf,
    rg: member.rg,
    birthDate: member.birthDate,
    age: member.age,
    address: member.address,
    cityUf: member.cityUf,
    pixKey: member.pixKey,
    bankInfo: member.bankInfo,
    portfolioUrl: member.portfolioUrl,
    rubric: member.rubric,
    expectedAmount: member.defaultAmount,
    paidAmount: "",
    paymentStatus: "Previsto",
    notes: member.notes,
    paymentHistory: [],
  });
}

export function makeMemberFromAssignment(assignment: LocalProjectAssignment): LocalTeamMember {
  return normalizeTeamMember({
    id: assignment.memberId || createLocalId("member"),
    name: assignment.name,
    fullName: assignment.fullName,
    profileType: assignment.profileType,
    role: assignment.role,
    email: assignment.email,
    phone: assignment.phone,
    document: assignment.document,
    cpf: assignment.cpf,
    rg: assignment.rg,
    birthDate: assignment.birthDate,
    age: assignment.age,
    address: assignment.address,
    cityUf: assignment.cityUf,
    pixKey: assignment.pixKey,
    bankInfo: assignment.bankInfo,
    portfolioUrl: assignment.portfolioUrl,
    rubric: assignment.rubric,
    defaultAmount: assignment.expectedAmount,
    notes: assignment.notes,
    active: true,
  });
}
EOF

cat > src/components/team/local-team-workspace.tsx <<'EOF'
"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CheckCircle2,
  DollarSign,
  History,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateAgeFromBirthDate,
  createLocalId,
  defaultLocalTeamMembers,
  makeAssignmentFromMember,
  makeMemberFromAssignment,
  normalizeAssignment,
  normalizeTeamMember,
  paymentStatusOptions,
  personTypeOptions,
  readLocalTeamRoster,
  readProjectAssignments,
  writeLocalTeamRoster,
  writeProjectAssignments,
  type LocalPaymentHistoryEntry,
  type LocalPaymentStatus,
  type LocalPersonType,
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

type AssignmentDraft = Omit<LocalProjectAssignment, "id" | "memberId" | "paymentHistory"> & {
  memberId: string;
};

type EditableAssignmentField = keyof AssignmentDraft;

const fallbackProject = {
  id: "projeto-refens",
  name: "Reféns",
};

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const emptyMemberDraft: Omit<LocalTeamMember, "id"> = {
  name: "",
  fullName: "",
  profileType: "Artista",
  role: "",
  email: "",
  phone: "",
  document: "",
  cpf: "",
  rg: "",
  birthDate: "",
  age: "",
  address: "",
  cityUf: "Jaraguá do Sul | SC",
  pixKey: "",
  bankInfo: "",
  portfolioUrl: "",
  rubric: "",
  defaultAmount: "",
  notes: "",
  active: true,
};

const emptyAssignmentDraft: AssignmentDraft = {
  memberId: "",
  name: "",
  fullName: "",
  profileType: "Artista",
  role: "",
  email: "",
  phone: "",
  document: "",
  cpf: "",
  rg: "",
  birthDate: "",
  age: "",
  address: "",
  cityUf: "Jaraguá do Sul | SC",
  pixKey: "",
  bankInfo: "",
  portfolioUrl: "",
  rubric: "",
  expectedAmount: "",
  paidAmount: "",
  paymentStatus: "Previsto",
  notes: "",
};

function parseCurrency(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

function formatBRLFromNumber(value: number) {
  return brlFormatter.format(value);
}

function formatCurrencyInput(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return brlFormatter.format(Number(digits) / 100);
}

function tagClass(profileType: LocalPersonType) {
  if (profileType === "Artista") return "bg-violet-100 text-violet-700";
  if (profileType === "Equipe técnica") return "bg-blue-100 text-blue-700";
  if (profileType === "Produção") return "bg-emerald-100 text-emerald-700";
  if (profileType === "Formação") return "bg-amber-100 text-amber-700";
  return "bg-slate-200 text-slate-600";
}

export function LocalTeamWorkspace({
  initialTab = "project",
  activeProject = fallbackProject,
}: LocalTeamWorkspaceProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [members, setMembers] = useState<LocalTeamMember[]>(defaultLocalTeamMembers);
  const [assignmentsByProject, setAssignmentsByProject] = useState<Record<string, LocalProjectAssignment[]>>({});
  const [memberDraft, setMemberDraft] = useState(emptyMemberDraft);
  const [projectDraft, setProjectDraft] = useState<AssignmentDraft>(emptyAssignmentDraft);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [saveProjectPersonToPermanent, setSaveProjectPersonToPermanent] = useState(false);
  const [openHistory, setOpenHistory] = useState<string[]>([]);
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, PaymentDraft>>({});
  const [message, setMessage] = useState("Equipe carregada. Cadastre artistas, equipe técnica e produção por projeto.");

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

  const projectArtistCount = projectAssignments.filter((item) => item.profileType === "Artista").length;
  const projectTechnicalCount = projectAssignments.filter((item) => item.profileType === "Equipe técnica").length;

  useEffect(() => {
    setMembers(readLocalTeamRoster());
    setAssignmentsByProject(readProjectAssignments());
  }, []);

  function persistMembers(nextMembers: LocalTeamMember[]) {
    const normalized = nextMembers.map(normalizeTeamMember);
    setMembers(normalized);
    writeLocalTeamRoster(normalized);
  }

  function persistAssignments(nextAssignments: Record<string, LocalProjectAssignment[]>) {
    const normalized: Record<string, LocalProjectAssignment[]> = {};

    for (const [currentProjectId, assignments] of Object.entries(nextAssignments)) {
      normalized[currentProjectId] = assignments.map(normalizeAssignment);
    }

    setAssignmentsByProject(normalized);
    writeProjectAssignments(normalized);
  }

  function resetMemberForm() {
    setMemberDraft(emptyMemberDraft);
    setEditingMemberId(null);
  }

  function resetProjectForm() {
    setProjectDraft(emptyAssignmentDraft);
    setEditingAssignmentId(null);
    setSaveProjectPersonToPermanent(false);
    setShowProjectForm(false);
  }

  function handleMemberBirthDate(value: string) {
    setMemberDraft({
      ...memberDraft,
      birthDate: value,
      age: calculateAgeFromBirthDate(value),
    });
  }

  function handleProjectBirthDate(value: string) {
    setProjectDraft({
      ...projectDraft,
      birthDate: value,
      age: calculateAgeFromBirthDate(value),
    });
  }

  function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!memberDraft.fullName.trim() && !memberDraft.name.trim()) {
      setMessage("Preencha pelo menos o nome completo.");
      return;
    }

    const normalizedDraft = normalizeTeamMember({
      ...memberDraft,
      name: memberDraft.name || memberDraft.fullName,
      fullName: memberDraft.fullName || memberDraft.name,
      document: memberDraft.cpf || memberDraft.document,
      defaultAmount: formatCurrencyInput(memberDraft.defaultAmount) || memberDraft.defaultAmount,
    });

    if (editingMemberId) {
      const nextMembers = members.map((member) =>
        member.id === editingMemberId ? { ...normalizedDraft, id: editingMemberId } : member,
      );

      const nextAssignments: Record<string, LocalProjectAssignment[]> = {};

      for (const [currentProjectId, assignments] of Object.entries(assignmentsByProject)) {
        nextAssignments[currentProjectId] = assignments.map((assignment) =>
          assignment.memberId === editingMemberId
            ? {
                ...assignment,
                name: normalizedDraft.name,
                fullName: normalizedDraft.fullName,
                profileType: normalizedDraft.profileType,
                role: normalizedDraft.role,
                email: normalizedDraft.email,
                phone: normalizedDraft.phone,
                document: normalizedDraft.document,
                cpf: normalizedDraft.cpf,
                rg: normalizedDraft.rg,
                birthDate: normalizedDraft.birthDate,
                age: normalizedDraft.age,
                address: normalizedDraft.address,
                cityUf: normalizedDraft.cityUf,
                pixKey: normalizedDraft.pixKey,
                bankInfo: normalizedDraft.bankInfo,
                portfolioUrl: normalizedDraft.portfolioUrl,
                rubric: assignment.rubric || normalizedDraft.rubric,
                expectedAmount: assignment.expectedAmount || normalizedDraft.defaultAmount,
                notes: assignment.notes || normalizedDraft.notes,
              }
            : assignment,
        );
      }

      persistMembers(nextMembers);
      persistAssignments(nextAssignments);
      resetMemberForm();
      setMessage("Cadastro permanente atualizado e sincronizado com os projetos.");
      return;
    }

    persistMembers([{ ...normalizedDraft, id: createLocalId("member") }, ...members]);
    resetMemberForm();
    setMessage("Pessoa adicionada ao cadastro permanente/casting.");
  }

  function editMember(member: LocalTeamMember) {
    setTab("permanent");
    setEditingMemberId(member.id);
    setMemberDraft({
      name: member.name,
      fullName: member.fullName,
      profileType: member.profileType,
      role: member.role,
      email: member.email,
      phone: member.phone,
      document: member.document,
      cpf: member.cpf,
      rg: member.rg,
      birthDate: member.birthDate,
      age: member.age,
      address: member.address,
      cityUf: member.cityUf,
      pixKey: member.pixKey,
      bankInfo: member.bankInfo,
      portfolioUrl: member.portfolioUrl,
      rubric: member.rubric,
      defaultAmount: member.defaultAmount,
      notes: member.notes,
      active: member.active,
    });
    setMessage("Editando cadastro permanente.");
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
    persistMembers(
      members.map((member) =>
        member.id === memberId ? { ...member, active: !member.active } : member,
      ),
    );

    setMessage("Status da pessoa atualizado.");
  }

  function addMemberToProject(memberId: string) {
    const member = activeMembers.find((item) => item.id === memberId);
    if (!member) return;

    const currentAssignments = assignmentsByProject[projectId] ?? [];
    if (currentAssignments.some((assignment) => assignment.memberId === member.id)) return;

    persistAssignments({
      ...assignmentsByProject,
      [projectId]: [...currentAssignments, makeAssignmentFromMember(member)],
    });

    setMessage(`${member.name} foi adicionado(a) à equipe do projeto ${activeProject.name}.`);
  }

  function saveProjectPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectDraft.fullName.trim() && !projectDraft.name.trim()) {
      setMessage("Preencha pelo menos o nome completo da pessoa.");
      return;
    }

    const normalized = normalizeAssignment({
      ...projectDraft,
      name: projectDraft.name || projectDraft.fullName,
      fullName: projectDraft.fullName || projectDraft.name,
      document: projectDraft.cpf || projectDraft.document,
      expectedAmount: formatCurrencyInput(projectDraft.expectedAmount) || projectDraft.expectedAmount,
      paidAmount: formatCurrencyInput(projectDraft.paidAmount) || projectDraft.paidAmount,
      paymentHistory: editingAssignmentId
        ? projectAssignments.find((assignment) => assignment.id === editingAssignmentId)?.paymentHistory ?? []
        : [],
    });

    if (editingAssignmentId) {
      persistAssignments({
        ...assignmentsByProject,
        [projectId]: projectAssignments.map((assignment) =>
          assignment.id === editingAssignmentId
            ? { ...normalized, id: editingAssignmentId, memberId: assignment.memberId }
            : assignment,
        ),
      });

      resetProjectForm();
      setMessage("Pessoa da equipe do projeto atualizada.");
      return;
    }

    const nextAssignment = {
      ...normalized,
      id: createLocalId("assignment"),
      memberId: normalized.memberId || createLocalId("project-person"),
    };

    persistAssignments({
      ...assignmentsByProject,
      [projectId]: [nextAssignment, ...projectAssignments],
    });

    if (saveProjectPersonToPermanent) {
      const newMember = makeMemberFromAssignment(nextAssignment);
      const exists = members.some((member) => member.id === newMember.id || member.cpf === newMember.cpf && newMember.cpf);

      if (!exists) {
        persistMembers([newMember, ...members]);
      }
    }

    resetProjectForm();
    setMessage("Pessoa adicionada à equipe do projeto.");
  }

  function editProjectAssignment(assignment: LocalProjectAssignment) {
    setTab("project");
    setShowProjectForm(true);
    setEditingAssignmentId(assignment.id);
    setProjectDraft({
      memberId: assignment.memberId,
      name: assignment.name,
      fullName: assignment.fullName,
      profileType: assignment.profileType,
      role: assignment.role,
      email: assignment.email,
      phone: assignment.phone,
      document: assignment.document,
      cpf: assignment.cpf,
      rg: assignment.rg,
      birthDate: assignment.birthDate,
      age: assignment.age,
      address: assignment.address,
      cityUf: assignment.cityUf,
      pixKey: assignment.pixKey,
      bankInfo: assignment.bankInfo,
      portfolioUrl: assignment.portfolioUrl,
      rubric: assignment.rubric,
      expectedAmount: assignment.expectedAmount,
      paidAmount: assignment.paidAmount,
      paymentStatus: assignment.paymentStatus,
      notes: assignment.notes,
    });
    setMessage("Editando pessoa da equipe do projeto.");
  }

  function updateAssignment(assignmentId: string, field: EditableAssignmentField, value: string) {
    const normalizedValue =
      field === "expectedAmount" || field === "paidAmount"
        ? formatCurrencyInput(value)
        : value;

    persistAssignments({
      ...assignmentsByProject,
      [projectId]: projectAssignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              [field]: field === "paymentStatus"
                ? (normalizedValue as LocalPaymentStatus)
                : field === "profileType"
                  ? (normalizedValue as LocalPersonType)
                  : normalizedValue,
            }
          : assignment,
      ),
    });
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

    if (editingAssignmentId === assignmentId) resetProjectForm();
    setMessage("Pessoa removida da equipe deste projeto.");
  }

  function promoteAssignmentToPermanent(assignment: LocalProjectAssignment) {
    const newMember = makeMemberFromAssignment(assignment);
    const alreadyExists = members.some((member) =>
      member.id === newMember.id || Boolean(newMember.cpf && member.cpf === newMember.cpf),
    );

    if (alreadyExists) {
      setMessage(`${assignment.name} já está na equipe permanente/casting.`);
      return;
    }

    persistMembers([newMember, ...members]);
    setMessage(`${assignment.name} foi adicionado(a) à equipe permanente/casting.`);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Gestão de equipe</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Equipe, casting e pagamentos</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Cadastre artistas, equipe técnica, produção e formação com dados completos por projeto ou no cadastro permanente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
              <SummaryCard title="Pessoas" value={String(projectAssignments.length)} />
              <SummaryCard title="Artistas" value={String(projectArtistCount)} />
              <SummaryCard title="Técnica" value={String(projectTechnicalCount)} />
              <SummaryCard title="Pago" value={formatBRLFromNumber(totalPaid)} />
              <SummaryCard title="Aberto" value={formatBRLFromNumber(totalOpen)} />
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
            Equipe permanente / casting
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {message}
          </div>
        </div>
      </section>

      {tab === "project" ? (
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-600">Equipe do projeto</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{activeProject.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Adicione pessoas da equipe permanente ou cadastre uma pessoa diretamente neste projeto.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="w-full min-w-[280px]">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Adicionar da equipe permanente
                  </span>
                  <select
                    className="viva-input"
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

                <Button type="button" onClick={() => {
                  resetProjectForm();
                  setShowProjectForm(true);
                  setTab("project");
                }}>
                  <UserPlus className="mr-2 size-4" />
                  Adicionar pessoa
                </Button>
              </div>
            </div>

            {showProjectForm ? (
              <form onSubmit={saveProjectPerson} className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-red-600">
                      {editingAssignmentId ? "Editar pessoa do projeto" : "Novo cadastro no projeto"}
                    </p>
                    <h4 className="mt-1 text-xl font-black text-slate-950">
                      Cadastro de casting/equipe
                    </h4>
                  </div>

                  <Button type="button" variant="outline" onClick={resetProjectForm}>
                    Cancelar
                  </Button>
                </div>

                <PersonFormFields
                  draft={projectDraft}
                  onChange={(field, value) => {
                    if (field === "birthDate") {
                      handleProjectBirthDate(value);
                      return;
                    }

                    setProjectDraft({
                      ...projectDraft,
                      [field]: field === "expectedAmount" || field === "paidAmount"
                        ? formatCurrencyInput(value)
                        : value,
                    });
                  }}
                  amountLabel="Valor previsto"
                  amountField="expectedAmount"
                />

                {!editingAssignmentId ? (
                  <label className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={saveProjectPersonToPermanent}
                      onChange={(event) => setSaveProjectPersonToPermanent(event.target.checked)}
                    />
                    Salvar também na equipe permanente / casting
                  </label>
                ) : null}

                <Button type="submit" className="mt-5">
                  <Save className="mr-2 size-4" />
                  {editingAssignmentId ? "Salvar edição" : "Adicionar ao projeto"}
                </Button>
              </form>
            ) : null}
          </div>

          <div className="space-y-4">
            {projectAssignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                <UsersRound className="mx-auto mb-3 size-8 text-slate-400" />
                Nenhuma pessoa vinculada a este projeto ainda.
              </div>
            ) : (
              projectAssignments.map((assignment) => {
                const historyIsOpen = openHistory.includes(assignment.id);
                const paymentDraft = paymentDrafts[assignment.id] ?? { amount: "", note: "" };
                const expected = parseCurrency(assignment.expectedAmount);
                const paid = parseCurrency(assignment.paidAmount);
                const open = Math.max(expected - paid, 0);

                return (
                  <article key={assignment.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-black text-slate-950">{assignment.fullName || assignment.name}</h4>
                          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${tagClass(assignment.profileType)}`}>
                            {assignment.profileType}
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-slate-600">{assignment.role || "Função não informada"}</p>

                        <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-2 xl:grid-cols-3">
                          <p><strong>CPF:</strong> {assignment.cpf || "Não informado"}</p>
                          <p><strong>RG:</strong> {assignment.rg || "Não informado"}</p>
                          <p><strong>Nascimento:</strong> {assignment.birthDate || "Não informado"} {assignment.age ? `• ${assignment.age} anos` : ""}</p>
                          <p><strong>Telefone:</strong> {assignment.phone || "Não informado"}</p>
                          <p><strong>E-mail:</strong> {assignment.email || "Não informado"}</p>
                          <p><strong>Cidade:</strong> {assignment.cityUf || "Não informado"}</p>
                          <p className="md:col-span-2 xl:col-span-3"><strong>Endereço:</strong> {assignment.address || "Não informado"}</p>
                          <p><strong>Rubrica:</strong> {assignment.rubric || "Sem rubrica"}</p>
                          <p><strong>Previsto:</strong> {assignment.expectedAmount || "R$ 0,00"}</p>
                          <p><strong>Pago:</strong> {assignment.paidAmount || "R$ 0,00"} • <strong>Aberto:</strong> {formatBRLFromNumber(open)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => editProjectAssignment(assignment)}>
                          <Pencil className="mr-2 size-4" />
                          Editar
                        </Button>
                        <Button type="button" variant="outline" onClick={() => toggleHistory(assignment.id)}>
                          <History className="mr-2 size-4" />
                          Histórico
                        </Button>
                        <Button type="button" variant="outline" onClick={() => promoteAssignmentToPermanent(assignment)}>
                          <UsersRound className="mr-2 size-4" />
                          Adicionar à permanente
                        </Button>
                        <Button type="button" variant="destructive" onClick={() => removeAssignment(assignment.id)}>
                          <Trash2 className="mr-2 size-4" />
                          Remover
                        </Button>
                      </div>
                    </div>

                    {historyIsOpen ? (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-4 grid gap-3 lg:grid-cols-[180px_1fr_auto]">
                          <input
                            className="viva-input"
                            value={paymentDraft.amount}
                            onChange={(event) => updatePaymentDraft(assignment.id, "amount", event.target.value)}
                            placeholder="R$ 0,00"
                          />
                          <input
                            className="viva-input"
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
                              <div key={payment.id} className="flex flex-col gap-1 rounded-xl bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
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
        <section className="grid gap-6 xl:grid-cols-[470px_1fr]">
          <form onSubmit={saveMember} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-600">
                  {editingMemberId ? "Editar" : "Adicionar"}
                </p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Equipe permanente / casting
                </h3>
              </div>

              {editingMemberId ? (
                <Button type="button" variant="outline" onClick={resetMemberForm}>
                  Cancelar
                </Button>
              ) : null}
            </div>

            <PersonFormFields
              draft={{
                memberId: "",
                name: memberDraft.name,
                fullName: memberDraft.fullName,
                profileType: memberDraft.profileType,
                role: memberDraft.role,
                email: memberDraft.email,
                phone: memberDraft.phone,
                document: memberDraft.document,
                cpf: memberDraft.cpf,
                rg: memberDraft.rg,
                birthDate: memberDraft.birthDate,
                age: memberDraft.age,
                address: memberDraft.address,
                cityUf: memberDraft.cityUf,
                pixKey: memberDraft.pixKey,
                bankInfo: memberDraft.bankInfo,
                portfolioUrl: memberDraft.portfolioUrl,
                rubric: memberDraft.rubric,
                expectedAmount: memberDraft.defaultAmount,
                paidAmount: "",
                paymentStatus: "Previsto",
                notes: memberDraft.notes,
              }}
              onChange={(field, value) => {
                if (field === "birthDate") {
                  handleMemberBirthDate(value);
                  return;
                }

                if (field === "expectedAmount") {
                  setMemberDraft({
                    ...memberDraft,
                    defaultAmount: formatCurrencyInput(value),
                  });
                  return;
                }

                if (field === "profileType") {
                  setMemberDraft({
                    ...memberDraft,
                    profileType: value as LocalPersonType,
                  });
                  return;
                }

                if (field in memberDraft) {
                  setMemberDraft({
                    ...memberDraft,
                    [field]: value,
                  });
                }
              }}
              amountLabel="Valor padrão"
              amountField="expectedAmount"
              hidePaid
            />

            <label className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={memberDraft.active}
                onChange={(event) => setMemberDraft({ ...memberDraft, active: event.target.checked })}
              />
              Pessoa ativa para seleção nos projetos
            </label>

            <Button type="submit" className="mt-5 w-full">
              <Save className="mr-2 size-4" />
              {editingMemberId ? "Salvar edição" : "Adicionar ao casting"}
            </Button>
          </form>

          <div className="space-y-4">
            {members.map((member) => (
              <article key={member.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-black text-slate-950">{member.fullName || member.name}</h4>
                      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${tagClass(member.profileType)}`}>
                        {member.profileType}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${member.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                        {member.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-slate-600">{member.role}</p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
                      <p><strong>CPF:</strong> {member.cpf || "Não informado"}</p>
                      <p><strong>Nascimento:</strong> {member.birthDate || "Não informado"} {member.age ? `• ${member.age} anos` : ""}</p>
                      <p><strong>Telefone:</strong> {member.phone || "Não informado"}</p>
                      <p><strong>E-mail:</strong> {member.email || "Não informado"}</p>
                      <p className="md:col-span-2"><strong>Endereço:</strong> {member.address || "Não informado"}</p>
                      <p><strong>Rubrica padrão:</strong> {member.rubric || "Sem rubrica"}</p>
                      <p><strong>Valor padrão:</strong> {member.defaultAmount || "R$ 0,00"}</p>
                    </div>
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

function PersonFormFields({
  draft,
  onChange,
  amountLabel,
  amountField,
  hidePaid = false,
}: {
  draft: AssignmentDraft;
  onChange: (field: EditableAssignmentField, value: string) => void;
  amountLabel: string;
  amountField: "expectedAmount";
  hidePaid?: boolean;
}) {
  return (
    <div className="space-y-4">
      <InputLine label="Nome completo">
        <input
          value={draft.fullName}
          onChange={(event) => onChange("fullName", event.target.value)}
          className="viva-input"
          placeholder="Nome completo"
        />
      </InputLine>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputLine label="Nome artístico / nome curto">
          <input
            value={draft.name}
            onChange={(event) => onChange("name", event.target.value)}
            className="viva-input"
            placeholder="Como aparecerá no sistema"
          />
        </InputLine>

        <InputLine label="Tipo de cadastro">
          <select
            value={draft.profileType}
            onChange={(event) => onChange("profileType", event.target.value)}
            className="viva-input"
          >
            {personTypeOptions.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </InputLine>
      </div>

      <InputLine label="Função no projeto / casting">
        <input
          value={draft.role}
          onChange={(event) => onChange("role", event.target.value)}
          className="viva-input"
          placeholder="Ator, atriz, técnico de som, produção..."
        />
      </InputLine>

      <div className="grid gap-4 sm:grid-cols-3">
        <InputLine label="CPF">
          <input
            value={draft.cpf}
            onChange={(event) => onChange("cpf", event.target.value)}
            className="viva-input"
            placeholder="000.000.000-00"
          />
        </InputLine>

        <InputLine label="RG">
          <input
            value={draft.rg}
            onChange={(event) => onChange("rg", event.target.value)}
            className="viva-input"
            placeholder="RG"
          />
        </InputLine>

        <InputLine label="Documento/CNPJ">
          <input
            value={draft.document}
            onChange={(event) => onChange("document", event.target.value)}
            className="viva-input"
            placeholder="Opcional"
          />
        </InputLine>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <InputLine label="Data de nascimento">
          <input
            type="date"
            value={draft.birthDate}
            onChange={(event) => onChange("birthDate", event.target.value)}
            className="viva-input"
          />
        </InputLine>

        <InputLine label="Idade">
          <input
            value={draft.age}
            onChange={(event) => onChange("age", event.target.value)}
            className="viva-input"
            placeholder="Automático"
          />
        </InputLine>

        <InputLine label="Cidade/UF">
          <input
            value={draft.cityUf}
            onChange={(event) => onChange("cityUf", event.target.value)}
            className="viva-input"
            placeholder="Jaraguá do Sul | SC"
          />
        </InputLine>
      </div>

      <InputLine label="Endereço">
        <input
          value={draft.address}
          onChange={(event) => onChange("address", event.target.value)}
          className="viva-input"
          placeholder="Rua, número, bairro, cidade"
        />
      </InputLine>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputLine label="Telefone">
          <input
            value={draft.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            className="viva-input"
            placeholder="(47) 99999-9999"
          />
        </InputLine>

        <InputLine label="E-mail">
          <input
            value={draft.email}
            onChange={(event) => onChange("email", event.target.value)}
            className="viva-input"
            placeholder="email@exemplo.com"
          />
        </InputLine>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputLine label="Chave PIX">
          <input
            value={draft.pixKey}
            onChange={(event) => onChange("pixKey", event.target.value)}
            className="viva-input"
            placeholder="CPF, e-mail, celular..."
          />
        </InputLine>

        <InputLine label="Dados bancários">
          <input
            value={draft.bankInfo}
            onChange={(event) => onChange("bankInfo", event.target.value)}
            className="viva-input"
            placeholder="Banco, agência, conta..."
          />
        </InputLine>
      </div>

      <InputLine label="Portfólio / link">
        <input
          value={draft.portfolioUrl}
          onChange={(event) => onChange("portfolioUrl", event.target.value)}
          className="viva-input"
          placeholder="Instagram, site, portfólio..."
        />
      </InputLine>

      <div className="grid gap-4 sm:grid-cols-3">
        <InputLine label="Rubrica">
          <input
            value={draft.rubric}
            onChange={(event) => onChange("rubric", event.target.value)}
            className="viva-input"
            placeholder="Elenco, som, produção..."
          />
        </InputLine>

        <InputLine label={amountLabel}>
          <input
            value={draft[amountField]}
            onChange={(event) => onChange(amountField, event.target.value)}
            className="viva-input"
            placeholder="R$ 0,00"
          />
        </InputLine>

        {!hidePaid ? (
          <InputLine label="Valor pago">
            <input
              value={draft.paidAmount}
              onChange={(event) => onChange("paidAmount", event.target.value)}
              className="viva-input"
              placeholder="R$ 0,00"
            />
          </InputLine>
        ) : null}
      </div>

      {!hidePaid ? (
        <InputLine label="Status de pagamento">
          <select
            value={draft.paymentStatus}
            onChange={(event) => onChange("paymentStatus", event.target.value)}
            className="viva-input"
          >
            {paymentStatusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </InputLine>
      ) : null}

      <InputLine label="Observações">
        <textarea
          value={draft.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          className="viva-input min-h-24"
          placeholder="Observações, disponibilidade, detalhes artísticos/técnicos..."
        />
      </InputLine>
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

echo "Ajustando seed do Reféns para NÃO sobrescrever edições manuais..."
python3 - <<'PY'
from pathlib import Path
import re

path = Path("src/components/refens/refens-official-data.ts")
if not path.exists():
    raise SystemExit(0)

text = path.read_text()

new_tail = '''function readJson<T>(key: string, fallback: T): T {
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

function mergeTeam(existing: RefensTeamMember[]) {
  const current = Array.isArray(existing) ? existing : [];
  const byId = new Map<string, RefensTeamMember>();

  current.forEach((member) => {
    byId.set(member.id, member);
  });

  refensKnownTeam.forEach((officialMember) => {
    if (!byId.has(officialMember.id)) {
      byId.set(officialMember.id, officialMember);
    }
  });

  return Array.from(byId.values());
}

function mergeAssignments(existing: RefensProjectAssignment[]) {
  const current = Array.isArray(existing) ? existing : [];
  const byMemberId = new Map<string, RefensProjectAssignment>();

  current.forEach((assignment) => {
    byMemberId.set(assignment.memberId, assignment);
  });

  refensProjectAssignments.forEach((officialAssignment) => {
    if (!byMemberId.has(officialAssignment.memberId)) {
      byMemberId.set(officialAssignment.memberId, officialAssignment);
    }
  });

  return Array.from(byMemberId.values());
}

export function seedRefensTeamForProject(projectId: string) {
  if (typeof window === "undefined") return;

  const safeProjectId = projectId || "projeto-refens";
  const currentTeam = readJson<RefensTeamMember[]>(TEAM_ROSTER_STORAGE_KEY, []);
  const currentAssignments = readJson<Record<string, RefensProjectAssignment[]>>(PROJECT_ASSIGNMENTS_STORAGE_KEY, {});

  const nextTeam = mergeTeam(currentTeam);

  const projectAliases = [
    safeProjectId,
    "projeto-refens",
    "refens",
    "formacao-de-artistas-de-rua-e-montagem-do-espetaculo-refens",
  ];

  const nextAssignments = {
    ...currentAssignments,
  };

  projectAliases.forEach((alias) => {
    nextAssignments[alias] = mergeAssignments(nextAssignments[alias] ?? []);
  });

  writeJson(TEAM_ROSTER_STORAGE_KEY, nextTeam);
  writeJson(PROJECT_ASSIGNMENTS_STORAGE_KEY, nextAssignments);
  writeJson(PROJECT_TEAM_DRAFT_STORAGE_KEY, nextTeam.map((member) => member.id));
}
'''

text = re.sub(
    r"function readJson<T>[\s\S]*?export function seedRefensTeamForProject\(projectId: string\) \{[\s\S]*?\n\}",
    new_tail,
    text,
)

path.write_text(text)
PY

echo "Protegendo arquivos sensíveis..."
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

echo "Verificando erros conhecidos..."
if grep -R "firebase/auth" -n src 2>/dev/null; then
  echo "ERRO: ainda existe firebase/auth dentro de src."
  exit 1
fi

if grep -R "style jsx" -n src 2>/dev/null; then
  echo "ERRO: ainda existe style jsx dentro de src."
  exit 1
fi

echo "Rodando build..."
npm run build

echo "Conferindo ajuste..."
grep -R "Adicionar pessoa" -n src/components/team/local-team-workspace.tsx
grep -R "Tipo de cadastro" -n src/components/team/local-team-workspace.tsx
grep -R "Equipe técnica" -n src/components/team/local-team-store.ts src/components/team/local-team-workspace.tsx
grep -R "CPF" -n src/components/team/local-team-workspace.tsx

echo "Status:"
git status --short

git add src/components/team src/components/refens/refens-official-data.ts .gitignore package.json package-lock.json
git commit -m "Aprimora cadastro de equipe e casting por projeto" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Abra /equipe e faça Command + Shift + R."
