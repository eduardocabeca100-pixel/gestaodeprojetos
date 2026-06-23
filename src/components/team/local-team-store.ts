import { notifyLocalFinancialDataChanged } from "@/lib/local-financial-sync";

export type LocalPaymentStatus = "Previsto" | "Pendente" | "Parcial" | "Pago";

export type LocalPersonType =
  | "Artista"
  | "Equipe técnica"
  | "Produção"
  | "Formação"
  | "Outros";

export type LocalCostBreakdownItem = {
  id: string;
  category: string;
  rubric: string;
  unit: string;
  quantity: string;
  unitAmount: string;
  totalAmount: string;
  paymentBasis: string;
  notes: string;
};

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
  avatarUrl: string | null;
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
  avatarUrl: string | null;
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
  costBreakdown: LocalCostBreakdownItem[];
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
    avatarUrl: null,
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
    avatarUrl: member.avatarUrl || null,
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

function normalizeCostBreakdown(items: unknown): LocalCostBreakdownItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const current = item as Partial<LocalCostBreakdownItem>;

    return {
      id: current.id || createLocalId("cost"),
      category: current.category || "",
      rubric: current.rubric || "",
      unit: current.unit || "",
      quantity: current.quantity || "",
      unitAmount: current.unitAmount || "",
      totalAmount: current.totalAmount || "",
      paymentBasis: current.paymentBasis || "",
      notes: current.notes || "",
    };
  });
}

export function normalizeAssignment(assignment: Partial<LocalProjectAssignment>): LocalProjectAssignment {
  const name = assignment.name || assignment.fullName || "";

  return {
    id: assignment.id || createLocalId("assignment"),
    memberId: assignment.memberId || createLocalId("project-person"),
    name,
    fullName: assignment.fullName || name,
    avatarUrl: assignment.avatarUrl || null,
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
    costBreakdown: normalizeCostBreakdown(assignment.costBreakdown),
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
  notifyLocalFinancialDataChanged();
}

export function makeAssignmentFromMember(member: LocalTeamMember): LocalProjectAssignment {
  return normalizeAssignment({
    id: createLocalId("assignment"),
    memberId: member.id,
    name: member.name,
    fullName: member.fullName,
    avatarUrl: member.avatarUrl,
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
    avatarUrl: assignment.avatarUrl,
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
