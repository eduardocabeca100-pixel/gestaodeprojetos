import "server-only";

import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";

import {
  budgetCategories,
  expenseStatuses,
  receiptTypes,
  type BudgetCategory,
  type BudgetItem,
  type Expense,
  type ExpenseStatus,
  type ReceiptType,
} from "./types";

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

type BudgetRow = {
  id: string;
  project_id: string;
  category: string;
  name: string;
  approved_amount: number | string | null;
  executed_amount: number | string | null;
  notes: string | null;
};

type ExpenseRow = {
  id: string;
  project_id: string;
  budget_item_id: string;
  description: string;
  supplier: string | null;
  supplier_document: string | null;
  amount: number | string | null;
  paid_at: string | null;
  payment_method: string | null;
  status: string | null;
  notes: string | null;
};

const officialBudgetPlan = [
  {
    category: "Pré-produção",
    items: [
      ["DIRETOR GERAL + PRODUTOR", 6000],
      ["PROFESSOR / FORMADOR", 2000],
      ["PRODUÇÃO EXECUTIVA", 6000],
    ],
  },
  {
    category: "Produção/Execução",
    items: [
      ["ATOR EXPERIENTE", 5400],
      ["ALUNOS NOVOS", 1800],
      ["TÉCNICO DE SOM", 1500],
      ["TÉCNICO DE ILUMINAÇÃO", 500],
      ["TECLADISTA / MÚSICO", 1000],
      ["FIGURINO E MAQUIAGEM", 4500],
      ["CENOGRAFIA", 1500],
      ["MATERIAL DE DIVULGAÇÃO", 1800],
      ["TRANSPORTE E LOGÍSTICA", 1000],
      ["LANCHE / ALUNOS E EQUIPE", 3500],
      ["SONORIZAÇÃO", 3000],
      ["REGISTRO FOTOGRÁFICO", 2000],
      ["TÉCNICA VOCAL", 1300],
    ],
  },
  {
    category: "Acessibilidade",
    items: [
      ["INTÉRPRETE DE LIBRAS", 1200],
      ["CAPACITAÇÃO DE EQUIPE", 1000],
      ["ESPAÇO PARA A CAPACITAÇÃO", 500],
      ["MATERIAIS ACESSÍVEIS", 2300],
    ],
  },
  {
    category: "Pós-produção",
    items: [
      ["PRESTAÇÃO DE CONTAS", 1000],
      ["CONTINGÊNCIAS / IMPREVISTOS", 1200],
    ],
  },
] as const;

function normalizeBudgetCategory(category: string | null): BudgetCategory {
  const normalized = category === "Produção/Execução" ? "Produção / Execução" : category;

  return budgetCategories.includes(normalized as BudgetCategory)
    ? (normalized as BudgetCategory)
    : "Produção / Execução";
}

function normalizeExpenseStatus(status: string | null): ExpenseStatus {
  return expenseStatuses.includes(status as ExpenseStatus)
    ? (status as ExpenseStatus)
    : "Previsto";
}

function normalizeReceiptType(value: string | null): ReceiptType {
  return receiptTypes.includes(value as ReceiptType)
    ? (value as ReceiptType)
    : "Comprovante bancário";
}

function makeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildOfficialBudgetItems(projectId: string): BudgetItem[] {
  return officialBudgetPlan.flatMap((group) =>
    group.items.map(([name, approvedAmount]) => ({
      id: `${projectId}-rubrica-${makeSlug(String(name))}`,
      projectId,
      category: normalizeBudgetCategory(group.category),
      name: String(name),
      approvedAmount: Number(approvedAmount),
      executedAmount: 0,
      notes: "Rubrica oficial importada da Planilha Orçamentária - Anexo XI.",
    })),
  );
}

function mapBudgetItem(row: BudgetRow): BudgetItem {
  return {
    id: row.id,
    projectId: row.project_id,
    category: normalizeBudgetCategory(row.category),
    name: row.name,
    approvedAmount: Number(row.approved_amount ?? 0),
    executedAmount: Number(row.executed_amount ?? 0),
    notes: row.notes ?? "",
  };
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    projectId: row.project_id,
    budgetItemId: row.budget_item_id,
    description: row.description,
    supplier: row.supplier ?? "",
    document: row.supplier_document ?? "",
    amount: Number(row.amount ?? 0),
    paidAt: row.paid_at ?? "",
    paymentMethod: row.payment_method ?? "",
    receiptFile: null,
    invoiceFile: null,
    receiptType: normalizeReceiptType(row.payment_method),
    status: normalizeExpenseStatus(row.status),
    notes: row.notes ?? "",
  };
}

export async function listBudgetItems(projectId?: string) {
  const project = await getScopedProject(projectId);

  if (!hasSupabaseServerEnv()) {
    return buildOfficialBudgetItems(project.id);
  }

  const supabase = await createClient();

  if (!supabase) {
    return buildOfficialBudgetItems(project.id);
  }

  const { data, error } = await (supabase as any)
    .from("budget_items")
    .select("id, project_id, category, name, approved_amount, executed_amount, notes")
    .eq("project_id", project.id)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("listBudgetItems failed", error);
    return buildOfficialBudgetItems(project.id);
  }

  const storedItems = (data as BudgetRow[] | null)?.map(mapBudgetItem) ?? [];

  if (storedItems.length > 0) {
    return storedItems;
  }

  return buildOfficialBudgetItems(project.id);
}

export async function listExpenses(projectId?: string) {
  const project = await getScopedProject(projectId);

  if (!hasSupabaseServerEnv()) {
    return [] satisfies Expense[];
  }

  const supabase = await createClient();

  if (!supabase) {
    return [] satisfies Expense[];
  }

  const { data, error } = await (supabase as any)
    .from("expenses")
    .select("id, project_id, budget_item_id, description, supplier, supplier_document, amount, paid_at, payment_method, status, notes")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("listExpenses failed", error);
    return [] satisfies Expense[];
  }

  return (data as ExpenseRow[]).map(mapExpense);
}

export async function getFinancialSummary(projectId?: string) {
  const project = await getScopedProject(projectId);
  const [items, expenses] = await Promise.all([
    listBudgetItems(project.id),
    listExpenses(project.id),
  ]);

  const approvedFromBudget = items.reduce((total, item) => total + item.approvedAmount, 0);
  const executedFromBudget = items.reduce((total, item) => total + item.executedAmount, 0);
  const executedFromPaidExpenses = expenses
    .filter((expense) => expense.status === "Pago")
    .reduce((total, expense) => total + expense.amount, 0);

  const approved = approvedFromBudget > 0 ? approvedFromBudget : project.approvedAmount;
  const executed = Math.max(executedFromBudget, executedFromPaidExpenses, project.executedAmount);

  return {
    approved,
    executed,
    remaining: Math.max(approved - executed, 0),
    expenseCount: expenses.length,
  };
}
