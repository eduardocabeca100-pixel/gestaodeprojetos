import type { BudgetItem, Expense } from "./types";

export const budgetItems: BudgetItem[] = [
  {
    id: "rubrica-formadores",
    projectId: "refens",
    category: "Recursos humanos",
    name: "Professor/formador",
    approvedAmount: 18000,
    executedAmount: 4500,
    notes: "Contratação para 11 aulas e ensaios pedagógicos.",
  },
  {
    id: "rubrica-fotos",
    projectId: "refens",
    category: "Registro fotográfico",
    name: "Registro fotográfico e tratamento de imagens",
    approvedAmount: 5000,
    executedAmount: 1200,
    notes: "Fotos de aulas, bastidores e montagem.",
  },
  {
    id: "rubrica-divulgacao",
    projectId: "refens",
    category: "Divulgação",
    name: "Design e mídia de divulgação",
    approvedAmount: 7000,
    executedAmount: 1800,
    notes: "Peças gráficas e impulsionamento.",
  },
  {
    id: "rubrica-producao",
    projectId: "refens",
    category: "Serviços de terceiros",
    name: "Produção executiva",
    approvedAmount: 12000,
    executedAmount: 1000,
    notes: "Coordenação de cronograma, documentos e prestação.",
  },
];

export const expenses: Expense[] = [
  {
    id: "despesa-1",
    projectId: "refens",
    budgetItemId: "rubrica-formadores",
    description: "Parcela inicial do formador",
    supplier: "Formador principal",
    document: "000.000.000-00",
    amount: 4500,
    paidAt: "2026-08-10",
    paymentMethod: "PIX",
    receiptFile: "recibo-formador-parcela-1.pdf",
    invoiceFile: null,
    receiptType: "Recibo de prestador PF",
    status: "Pago",
    notes: "Comprovante vinculado ao documento financeiro.",
  },
  {
    id: "despesa-2",
    projectId: "refens",
    budgetItemId: "rubrica-fotos",
    description: "Cobertura fotográfica das primeiras aulas",
    supplier: "Fotógrafa convidada",
    document: "00.000.000/0001-00",
    amount: 1200,
    paidAt: "2026-08-18",
    paymentMethod: "Transferência",
    receiptFile: "comprovante-fotografia.pdf",
    invoiceFile: "nf-fotografia.pdf",
    receiptType: "Nota fiscal de serviço",
    status: "Pago",
    notes: "Incluir no relatório fotográfico.",
  },
];

export async function listBudgetItems() {
  return budgetItems;
}

export async function listExpenses() {
  return expenses;
}

export async function getFinancialSummary() {
  const approved = budgetItems.reduce((total, item) => total + item.approvedAmount, 0);
  const executed = budgetItems.reduce((total, item) => total + item.executedAmount, 0);

  return {
    approved,
    executed,
    remaining: approved - executed,
    expenseCount: expenses.length,
  };
}
