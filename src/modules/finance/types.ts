export const budgetCategories = [
  "Pré-produção",
  "Produção / Execução",
  "Acessibilidade",
  "Pós-produção",
] as const;

export const expenseStatuses = [
  "Previsto",
  "Empenhado",
  "Pago",
  "Pendente",
  "Cancelado",
] as const;

export const receiptTypes = [
  "Nota fiscal de serviço",
  "Nota fiscal de material",
  "Cupom fiscal",
  "Recibo de prestador PF",
  "Recibo de ator/artista",
  "RPA",
  "Comprovante bancário",
] as const;

export type BudgetCategory = (typeof budgetCategories)[number];
export type ExpenseStatus = (typeof expenseStatuses)[number];
export type ReceiptType = (typeof receiptTypes)[number];

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
  receiptType: ReceiptType;
  status: ExpenseStatus;
  notes: string;
};
