export const LOCAL_FINANCIAL_DATA_CHANGED_EVENT = "viva:financial-data-changed";

const PROJECT_ASSIGNMENTS_STORAGE_KEY = "viva:project-team-assignments:v1";
const ADVANCED_MANAGEMENT_STORAGE_PREFIX = "viva:gestao-avancada:";
const AUTO_SUMMARY_RUBRIC_ID = "rub-auto-pagamentos-equipe";

type StoredAssignment = {
  rubric?: string;
  expectedAmount?: string;
  paidAmount?: string;
};

type StoredRubric = Record<string, string>;
type AdvancedManagementDraft = {
  pending?: unknown[];
  tasks?: unknown[];
  rubrics?: StoredRubric[];
};

function parseCurrency(value: string | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return 0;
  }

  return Number(digits) / 100;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function normalizeFinancialKey(value: string | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function buildAdvancedManagementKey(projectId: string) {
  return `${ADVANCED_MANAGEMENT_STORAGE_PREFIX}${projectId}`;
}

function readAdvancedManagementDraft(storage: Storage, projectId: string) {
  const saved = storage.getItem(buildAdvancedManagementKey(projectId));

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as AdvancedManagementDraft;
  } catch {
    return null;
  }
}

function buildRubricAggregates(assignments: StoredAssignment[]) {
  const byRubric = new Map<
    string,
    {
      name: string;
      expected: number;
      paid: number;
      count: number;
    }
  >();

  let totalExpected = 0;
  let totalPaid = 0;

  assignments.forEach((assignment) => {
    const expected = parseCurrency(assignment.expectedAmount);
    const paid = parseCurrency(assignment.paidAmount);

    totalExpected += expected;
    totalPaid += paid;

    const rubricName = assignment.rubric?.trim() || "Equipe sem rubrica";
    const rubricKey = normalizeFinancialKey(rubricName);
    const current = byRubric.get(rubricKey) ?? {
      name: rubricName,
      expected: 0,
      paid: 0,
      count: 0,
    };

    current.expected += expected;
    current.paid += paid;
    current.count += 1;

    byRubric.set(rubricKey, current);
  });

  return {
    byRubric,
    totalExpected,
    totalPaid,
  };
}

export function notifyLocalFinancialDataChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(LOCAL_FINANCIAL_DATA_CHANGED_EVENT));
}

export function syncProjectFinancialDraft(
  projectId: string,
  assignments: StoredAssignment[],
  storage: Storage = window.localStorage,
) {
  const data = readAdvancedManagementDraft(storage, projectId);

  if (!data) {
    return false;
  }

  const currentRubrics = Array.isArray(data.rubrics) ? data.rubrics : [];
  const { byRubric, totalExpected, totalPaid } = buildRubricAggregates(assignments);
  const matchedKeys = new Set<string>();

  const updatedRubrics = currentRubrics.map((rubric) => {
    const rubricName = rubric.name || "";
    const rubricKey = normalizeFinancialKey(rubricName);
    const match = byRubric.get(rubricKey);

    if (!match) {
      return rubric;
    }

    matchedKeys.add(rubricKey);

    const currentApproved = rubric.approved || rubric.planned || "";
    const approved =
      parseCurrency(currentApproved) > 0
        ? currentApproved
        : formatBRL(match.expected);
    const executed = formatBRL(match.paid);

    return {
      ...rubric,
      approved,
      planned: approved,
      executed,
      paid: executed,
      quantity: rubric.quantity || `${match.count} pessoa(s)`,
      unit: rubric.unit || "Equipe",
      paymentBasis:
        rubric.paymentBasis || "Conforme pagamentos lançados na equipe",
    };
  });

  const missingRubrics = Array.from(byRubric.entries())
    .filter(([rubricKey]) => !matchedKeys.has(rubricKey))
    .map(([rubricKey, rubric]) => {
      const approved = formatBRL(rubric.expected);
      const executed = formatBRL(rubric.paid);

      return {
        id: `rub-auto-${rubricKey.replace(/[^a-z0-9]+/g, "-")}`,
        category: "Equipe do projeto",
        name: rubric.name,
        unit: "Equipe",
        quantity: `${rubric.count} pessoa(s)`,
        paymentBasis: "Conforme pagamentos lançados na equipe",
        approved,
        planned: approved,
        executed,
        paid: executed,
        notes:
          "Rubrica criada automaticamente a partir dos pagamentos da equipe.",
      };
    });

  const withoutOldSummary = updatedRubrics.filter(
    (rubric) => rubric.id !== AUTO_SUMMARY_RUBRIC_ID,
  );
  const hasAssignments = assignments.length > 0;
  const hasExistingSummary = currentRubrics.some(
    (rubric) => rubric.id === AUTO_SUMMARY_RUBRIC_ID,
  );

  const nextRubrics =
    hasAssignments || hasExistingSummary
      ? [
          {
            id: AUTO_SUMMARY_RUBRIC_ID,
            category: "Resumo automático",
            name: "Pagamentos da equipe",
            unit: "Equipe",
            quantity: `${assignments.length} pessoa(s)`,
            paymentBasis:
              "Somatório dos valores previstos e pagos na equipe do projeto",
            approved: formatBRL(totalExpected),
            planned: formatBRL(totalExpected),
            executed: formatBRL(totalPaid),
            paid: formatBRL(totalPaid),
            notes:
              "Resumo automático. Atualiza sempre que pagamentos da equipe são alterados.",
          },
          ...withoutOldSummary,
          ...missingRubrics,
        ]
      : [...withoutOldSummary, ...missingRubrics];

  const currentSerialized = JSON.stringify({
    ...data,
    rubrics: currentRubrics,
  });
  const nextSerialized = JSON.stringify({
    ...data,
    rubrics: nextRubrics,
  });

  if (currentSerialized === nextSerialized) {
    return false;
  }

  storage.setItem(buildAdvancedManagementKey(projectId), nextSerialized);
  return true;
}

export function syncAllProjectFinancialDrafts(
  storage: Storage = window.localStorage,
) {
  const rawAssignments = storage.getItem(PROJECT_ASSIGNMENTS_STORAGE_KEY);

  if (!rawAssignments) {
    return false;
  }

  let assignmentsByProject: Record<string, StoredAssignment[]>;

  try {
    assignmentsByProject = JSON.parse(rawAssignments) as Record<
      string,
      StoredAssignment[]
    >;
  } catch {
    return false;
  }

  let changed = false;

  for (const [projectId, assignments] of Object.entries(assignmentsByProject)) {
    changed =
      syncProjectFinancialDraft(
        projectId,
        Array.isArray(assignments) ? assignments : [],
        storage,
      ) || changed;
  }

  return changed;
}
