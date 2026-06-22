export type RefensTeamMember = {
  id: string;
  name: string;
  
  fullName?: string;role: string;
  email: string;
  phone: string;
  document: string;
  rubric: string;
  defaultAmount: string;
  notes: string;
  active: boolean;
};

export type RefensProjectAssignment = {
  id: string;
  memberId: string;
  name: string;
  
  fullName?: string;role: string;
  rubric: string;
  expectedAmount: string;
  paidAmount: string;
  paymentStatus: "Previsto" | "Pendente" | "Parcial" | "Pago";
  notes: string;
  costBreakdown?: Array<{
    id: string;
    category: string;
    rubric: string;
    unit: string;
    quantity: string;
    unitAmount: string;
    totalAmount: string;
    paymentBasis: string;
    notes: string;
  }>;
  paymentHistory: Array<{
    id: string;
    date: string;
    amount: string;
    note: string;
  }>;
};

const TEAM_ROSTER_STORAGE_KEY = "viva:team-roster:v1";
const PROJECT_ASSIGNMENTS_STORAGE_KEY = "viva:project-team-assignments:v1";
const PROJECT_TEAM_DRAFT_STORAGE_KEY = "viva:project-team-draft:v1";

export const refensKnownTeam: RefensTeamMember[] = [
  {
    id: "refens-marcel-eduardo",
    name: "Marcel Eduardo Cabeça Domingues",
    role: "Formador, diretor, ator e produtor",
    email: "eduardo@ciaviva.com",
    phone: "(47) 992747545",
    document: "CNPJ 59.053.899/0001-53",
    rubric: "Diretor geral + produtor / Professor formador / Ator experiente",
    defaultAmount: "R$ 8.900,00",
    notes: "Proponente, diretor geral, formador, produtor e ator do projeto Reféns.",
    active: true,
  },
  {
    id: "refens-kaique-varela",
    name: "Kaique Varela Zaluski",
    role: "Direção executiva / Produção executiva",
    email: "",
    phone: "",
    document: "CNPJ 55.069.179/0001-25",
    rubric: "Produção executiva",
    defaultAmount: "R$ 6.000,00",
    notes: "Planejamento, comunicação, orçamento, produção e acompanhamento executivo.",
    active: true,
  },
  {
    id: "refens-jones-andre",
    name: "Jones André Alves Pereira",
    role: "Técnico de som",
    email: "",
    phone: "",
    document: "",
    rubric: "Técnico de som",
    defaultAmount: "R$ 1.500,00",
    notes: "Técnico responsável pelo som nas apresentações.",
    active: true,
  },
  {
    id: "refens-cassius-venera",
    name: "Cassius Venera",
    role: "Técnico de iluminação",
    email: "",
    phone: "",
    document: "",
    rubric: "Técnico de iluminação",
    defaultAmount: "R$ 500,00",
    notes: "Técnico responsável pela iluminação.",
    active: true,
  },
  {
    id: "refens-andre-brito",
    name: "André Felipe de Mila Brito",
    role: "Registro audiovisual / fotográfico",
    email: "",
    phone: "",
    document: "",
    rubric: "Registro fotográfico",
    defaultAmount: "R$ 2.000,00",
    notes: "Registro audiovisual e fotográfico do projeto.",
    active: true,
  },
  {
    id: "refens-suzi-daiane",
    name: "Suzi Daiane",
    role: "Professora de inclusão, LIBRAS e acessibilidade",
    email: "",
    phone: "",
    document: "",
    rubric: "Capacitação de equipe / Acessibilidade / LIBRAS",
    defaultAmount: "R$ 2.200,00",
    notes: "Inclusão, LIBRAS, audiodescrição, acessibilidade teatral e formação da equipe.",
    active: true,
  },
  {
    id: "refens-katiana-souza",
    name: "Katiana de Souza Coelho",
    role: "Professora de técnica vocal / Tecladista / Música",
    email: "",
    phone: "",
    document: "",
    rubric: "Técnica vocal / Tecladista / Músico",
    defaultAmount: "R$ 2.300,00",
    notes: "Preparação vocal, música e teclado.",
    active: true,
  },
  {
    id: "refens-renaldo-boddemberg",
    name: "Renaldo Boddemberg",
    role: "Ator experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
  {
    id: "refens-bruna-lazzarotto",
    name: "Bruna Lazzarotto",
    role: "Atriz experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
  {
    id: "refens-wemerson-goncalves",
    name: "Wemerson Gonçalves",
    role: "Ator experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
  {
    id: "refens-julia-titz",
    name: "Julia Titz",
    role: "Atriz experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
  {
    id: "refens-karim-kamada",
    name: "Karim Kamada",
    role: "Artista / Atriz experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
];

export const refensKnownAssignments: RefensProjectAssignment[] = refensKnownTeam.map((member) => ({
  id: `assignment-${member.id}`,
  memberId: member.id,
  name: member.name,
  role: member.role,
  rubric: member.rubric,
  expectedAmount: member.defaultAmount,
  paidAmount: "R$ 0,00",
  paymentStatus: "Previsto",
  notes: member.notes,
  paymentHistory: [],
}));

export const refensProjectAssignments: RefensProjectAssignment[] = [
  ...refensKnownAssignments,
];

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

function mergeTeam(existing: RefensTeamMember[]) {
  const current = (Array.isArray(existing) ? existing : []).filter((member) => {
    const id = String(member.id ?? "");
    const name = String(member.name ?? member.fullName ?? "").toLowerCase();

    return !id.startsWith("refens-aluno-") && !name.startsWith("aluno novo");
  });
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
  const current = (Array.isArray(existing) ? existing : []).filter((assignment) => {
    const memberId = String(assignment.memberId ?? "");
    const name = String(assignment.name ?? assignment.fullName ?? "").toLowerCase();

    return !memberId.startsWith("refens-aluno-") && !name.startsWith("aluno novo");
  });
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

