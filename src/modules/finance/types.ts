export const budgetCategories = [
  "Recursos humanos",
  "Serviços de terceiros",
  "Material de consumo",
  "Divulgação",
  "Acessibilidade",
  "Transporte/logística",
  "Alimentação",
  "Registro fotográfico",
  "Prestação de contas",
  "Outros",
] as const;

export const expenseStatuses = [
  "Previsto",
  "Empenhado",
  "Pago",
  "Pendente",
  "Cancelado",
] as const;

export type BudgetCategory = (typeof budgetCategories)[number];
export type ExpenseStatus = (typeof expenseStatuses)[number];

export type BudgetItem = {
  id: string;
  projectId: string;
  category: BudgetCategory;
  name: string;
  approvedAmount: number;
  executedAmount: number;
  notes: string;
};

export type Expense = {
  id: string;
  projectId: string;
  budgetItemId: string;
  description: string;
  supplier: string;
  document: string;
  amount: number;
  paidAt: string;
  paymentMethod: string;
  receiptFile: string | null;
  invoiceFile: string | null;
  status: ExpenseStatus;
  notes: string;
};
