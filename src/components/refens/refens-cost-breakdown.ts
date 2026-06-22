export type RefensOfficialCost = {
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

type AssignmentLike = {
  id: string;
  memberId?: string;
  name?: string;
  fullName?: string;
  role?: string;
  rubric?: string;
  expectedAmount?: string;
  paidAmount?: string;
  paymentStatus?: string;
  costBreakdown?: RefensOfficialCost[];
  [key: string]: unknown;
};

const ASSIGNMENTS_STORAGE_KEY = "viva:project-team-assignments:v1";

const refensProjectAliases = [
  "projeto-refens",
  "refens",
  "p-refens",
  "formacao-de-artistas-de-rua-e-montagem-do-espetaculo-refens",
];

function parseCurrency(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "");
}

function cost(
  id: string,
  category: string,
  rubric: string,
  unit: string,
  quantity: string,
  unitAmount: string,
  totalAmount: string,
  paymentBasis: string,
  notes: string,
): RefensOfficialCost {
  return {
    id,
    category,
    rubric,
    unit,
    quantity,
    unitAmount,
    totalAmount,
    paymentBasis,
    notes,
  };
}

function officialCostsForAssignment(assignment: AssignmentLike): RefensOfficialCost[] {
  const key = normalize([
    assignment.memberId,
    assignment.name,
    assignment.fullName,
    assignment.role,
    assignment.rubric,
  ].join(" "));

  if (key.includes("marcel") || key.includes("eduardo cabeca")) {
    return [
      cost(
        "refens-cost-marcel-diretor-produtor",
        "Pré-produção",
        "Diretor geral + produtor",
        "01 projeto",
        "01",
        "R$ 6.000,00",
        "R$ 6.000,00",
        "Por projeto",
        "Rubrica aprovada para direção geral e produção cultural do projeto.",
      ),
      cost(
        "refens-cost-marcel-professor-formador",
        "Pré-produção",
        "Professor / Formador",
        "01 projeto",
        "01",
        "R$ 2.000,00",
        "R$ 2.000,00",
        "Por projeto",
        "Rubrica aprovada para formação teatral e acompanhamento pedagógico.",
      ),
      cost(
        "refens-cost-marcel-ator-experiente",
        "Produção/Execução",
        "Ator experiente",
        "03 apresentações",
        "01 ator",
        "R$ 300,00",
        "R$ 900,00",
        "R$ 300,00 por apresentação",
        "Cachê de ator experiente em 3 apresentações.",
      ),
    ];
  }

  if (key.includes("kaique")) {
    return [
      cost(
        "refens-cost-kaique-producao-executiva",
        "Pré-produção",
        "Produção executiva",
        "01 projeto",
        "01",
        "R$ 6.000,00",
        "R$ 6.000,00",
        "Por projeto",
        "Rubrica aprovada para produção executiva, planejamento, acompanhamento e organização do projeto.",
      ),
    ];
  }

  if (key.includes("jones") || key.includes("tecnico de som") || key.includes("técnico de som")) {
    return [
      cost(
        "refens-cost-jones-som",
        "Produção/Execução",
        "Técnico de som",
        "03 apresentações",
        "01 profissional",
        "R$ 500,00",
        "R$ 1.500,00",
        "R$ 500,00 por apresentação",
        "Rubrica aprovada para operação técnica de som nas 3 apresentações.",
      ),
    ];
  }

  if (key.includes("cassius") || key.includes("iluminacao") || key.includes("iluminação") || key.includes("luz")) {
    return [
      cost(
        "refens-cost-cassius-iluminacao",
        "Produção/Execução",
        "Técnico de iluminação",
        "01 serviço",
        "01 profissional",
        "R$ 500,00",
        "R$ 500,00",
        "Por serviço",
        "Rubrica aprovada para operação/apoio técnico de iluminação.",
      ),
    ];
  }

  if (key.includes("andre") || key.includes("brito") || key.includes("registro") || key.includes("fotograf")) {
    return [
      cost(
        "refens-cost-andre-registro",
        "Produção/Execução",
        "Registro fotográfico",
        "01 projeto",
        "01 profissional",
        "R$ 2.000,00",
        "R$ 2.000,00",
        "Por projeto",
        "Rubrica aprovada para registro fotográfico/audiovisual da execução.",
      ),
    ];
  }

  if (key.includes("suzi") || key.includes("libras") || key.includes("acessibilidade") || key.includes("inclusao") || key.includes("inclusão")) {
    return [
      cost(
        "refens-cost-suzi-libras",
        "Acessibilidade",
        "Intérprete de LIBRAS",
        "03 apresentações",
        "01 intérprete",
        "R$ 400,00",
        "R$ 1.200,00",
        "R$ 400,00 por apresentação",
        "Rubrica aprovada para intérprete de LIBRAS nas 3 apresentações.",
      ),
      cost(
        "refens-cost-suzi-capacitacao",
        "Acessibilidade",
        "Capacitação de equipe",
        "01 capacitação",
        "01 profissional",
        "R$ 1.000,00",
        "R$ 1.000,00",
        "Por capacitação",
        "Rubrica aprovada para workshop/capacitação de equipe em inclusão e acessibilidade.",
      ),
    ];
  }

  if (key.includes("katiana") || key.includes("katy") || key.includes("tecladista") || key.includes("musico") || key.includes("músico") || key.includes("vocal")) {
    return [
      cost(
        "refens-cost-katiana-tecladista",
        "Produção/Execução",
        "Tecladista / Músico",
        "03 apresentações",
        "01 profissional",
        "R$ 1.000,00",
        "R$ 1.000,00",
        "Por projeto/apresentações",
        "Rubrica aprovada para apoio musical/teclado no projeto.",
      ),
      cost(
        "refens-cost-katiana-tecnica-vocal",
        "Produção/Execução",
        "Técnica vocal",
        "01 projeto",
        "01 profissional",
        "R$ 1.300,00",
        "R$ 1.300,00",
        "Por projeto",
        "Rubrica aprovada para preparação/técnica vocal.",
      ),
    ];
  }

  if (
    key.includes("renaldo") ||
    key.includes("bruna") ||
    key.includes("wemerson") ||
    key.includes("julia") ||
    key.includes("karim") ||
    key.includes("karin") ||
    key.includes("ator experiente") ||
    key.includes("atriz experiente")
  ) {
    return [
      cost(
        `refens-cost-${assignment.memberId || assignment.id}-ator-experiente`,
        "Produção/Execução",
        "Ator experiente",
        "03 apresentações",
        "01 ator/atriz",
        "R$ 300,00",
        "R$ 900,00",
        "R$ 300,00 por apresentação",
        "Cachê de ator/atriz experiente em 3 apresentações.",
      ),
    ];
  }

  if (key.includes("aluno novo") || key.includes("artista em formacao") || key.includes("artista em formação") || key.includes("alunos novos")) {
    return [
      cost(
        `refens-cost-${assignment.memberId || assignment.id}-aluno-novo`,
        "Produção/Execução",
        "Alunos novos",
        "03 apresentações",
        "01 aluno/artista em formação",
        "R$ 50,00",
        "R$ 150,00",
        "R$ 50,00 por apresentação",
        "Cachê simbólico para aluno novo integrado ao elenco em 3 apresentações.",
      ),
    ];
  }

  return [];
}

function isStudentPlaceholder(assignment: AssignmentLike) {
  const memberId = normalize(assignment.memberId);
  const name = normalize(`${assignment.name ?? ""} ${assignment.fullName ?? ""}`);

  return memberId.startsWith("refens-aluno-") || name.startsWith("aluno novo");
}

function shouldApplyOfficialCosts(assignment: AssignmentLike) {
  const existing = assignment.costBreakdown;

  if (!Array.isArray(existing) || existing.length === 0) {
    return true;
  }

  return existing.every((item) => String(item.id ?? "").startsWith("refens-cost-"));
}

function applyCostsToAssignment(assignment: AssignmentLike) {
  const officialCosts = officialCostsForAssignment(assignment);

  if (officialCosts.length === 0 || !shouldApplyOfficialCosts(assignment)) {
    return assignment;
  }

  const expectedTotal = officialCosts.reduce((sum, item) => sum + parseCurrency(item.totalAmount), 0);
  const paidAmount = assignment.paidAmount || "R$ 0,00";
  const paidValue = parseCurrency(paidAmount);

  return {
    ...assignment,
    costBreakdown: officialCosts,
    expectedAmount: formatBRL(expectedTotal),
    paymentStatus:
      paidValue <= 0
        ? "Previsto"
        : paidValue >= expectedTotal
          ? "Pago"
          : "Parcial",
  };
}

export function applyRefensOfficialCostBreakdowns(projectId?: string) {
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
  const assignmentsByProject = raw ? JSON.parse(raw) as Record<string, AssignmentLike[]> : {};
  const projectKeys = Array.from(new Set([projectId, ...refensProjectAliases].filter(Boolean))) as string[];

  let changed = false;

  projectKeys.forEach((key) => {
    const assignments = assignmentsByProject[key];

    if (!Array.isArray(assignments)) return;

    const nextAssignments = assignments.filter((assignment) => !isStudentPlaceholder(assignment)).map((assignment) => {
      const nextAssignment = applyCostsToAssignment(assignment);

      if (nextAssignment !== assignment) changed = true;

      return nextAssignment;
    });

    assignmentsByProject[key] = nextAssignments;
  });

  if (changed) {
    window.localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignmentsByProject));
    window.dispatchEvent(new CustomEvent("viva:refens-costs-applied"));
  }
}
