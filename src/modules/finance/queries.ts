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

function normalizeBudgetCategory(category: string | null): BudgetCategory {
  return budgetCategories.includes(category as BudgetCategory)
    ? (category as BudgetCategory)
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
    return [] satisfies BudgetItem[];
  }

  const supabase = await createClient();

  if (!supabase) {
    return [] satisfies BudgetItem[];
  }

  const { data, error } = await supabase
    .from("budget_items")
    .select("id, project_id, category, name, approved_amount, executed_amount, notes")
    .eq("project_id", project.id)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("listBudgetItems failed", error);
    return [] satisfies BudgetItem[];
  }

  return (data as BudgetRow[]).map(mapBudgetItem);
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

  const { data, error } = await supabase
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
