import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { BudgetItem, Expense } from "./types";

const budgetPlan = [
  {
    id: "rubrica-equipe",
    category: "Recursos humanos",
    name: "Equipe artística e técnica",
    approvedRatio: 0.36,
    executedRatio: 0.53,
    notes: "Contratação de equipe, direção, atuação, formação e produção.",
  },
  {
    id: "rubrica-registro",
    category: "Registro fotográfico",
    name: "Registro fotográfico e tratamento de imagens",
    approvedRatio: 0.1,
    executedRatio: 0.14,
    notes: "Fotos, bastidores, tratamento de imagens e comprovação visual.",
  },
  {
    id: "rubrica-divulgacao",
    category: "Divulgação",
    name: "Design e mídia de divulgação",
    approvedRatio: 0.14,
    executedRatio: 0.21,
    notes: "Peças gráficas, comunicação e impulsionamento.",
  },
  {
    id: "rubrica-producao",
    category: "Serviços de terceiros",
    name: "Produção executiva",
    approvedRatio: 0.24,
    executedRatio: 0.12,
    notes: "Coordenação de cronograma, documentos e prestação de contas.",
  },
  {
    id: "rubrica-acessibilidade",
    category: "Acessibilidade",
    name: "Acessibilidade e mediação",
    approvedRatio: 0.1,
    executedRatio: 0,
    notes: "Ações de acesso, mediação e adequações necessárias.",
  },
  {
    id: "rubrica-outros",
    category: "Outros",
    name: "Materiais, deslocamento e apoio",
    approvedRatio: 0.06,
    executedRatio: 0,
    notes: "Materiais de consumo, pequenos deslocamentos e apoio operacional.",
  },
] as const;

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function roundAmount(value: number) {
  return Math.round(value / 100) * 100;
}

function buildBudgetItems(project: Project): BudgetItem[] {
  return budgetPlan.map((item) => ({
    id: `${project.id}-${item.id}`,
    projectId: project.id,
    category: item.category,
    name: item.name,
    approvedAmount: roundAmount(project.approvedAmount * item.approvedRatio),
    executedAmount: roundAmount(project.executedAmount * item.executedRatio),
    notes: `${item.notes} Projeto: ${project.name}.`,
  }));
}

function buildExpenses(project: Project, items: BudgetItem[]): Expense[] {
  if (project.executedAmount <= 0) {
    return [];
  }

  const firstAmount = roundAmount(project.executedAmount * 0.58);
  const secondAmount = Math.max(project.executedAmount - firstAmount, 0);

  return [
    {
      id: `${project.id}-despesa-1`,
      projectId: project.id,
      budgetItemId: items[0]?.id ?? `${project.id}-rubrica-equipe`,
      description: `Pagamento artístico/técnico - ${project.name}`,
      supplier: "Profissional pessoa física",
      document: "000.000.000-00",
      amount: firstAmount,
      paidAt: project.id === "refens" ? "2026-08-10" : "2026-06-20",
      paymentMethod: "PIX",
      receiptFile: `recibo-${project.id}-prestador.pdf`,
      invoiceFile: null,
      receiptType: "Recibo de prestador PF",
      status: "Pago",
      notes: "Recibo obrigatório quando o prestador não emitir nota fiscal.",
    },
    {
      id: `${project.id}-despesa-2`,
      projectId: project.id,
      budgetItemId: items[1]?.id ?? `${project.id}-rubrica-registro`,
      description: `Comprovação visual e materiais - ${project.name}`,
      supplier: "Fornecedor/prestador vinculado",
      document: "00.000.000/0001-00",
      amount: secondAmount,
      paidAt: project.id === "refens" ? "2026-08-18" : "2026-07-05",
      paymentMethod: "Transferência",
      receiptFile: `comprovante-${project.id}.pdf`,
      invoiceFile: `nf-${project.id}.pdf`,
      receiptType: "Nota fiscal de serviço",
      status: "Pago",
      notes: "Anexar nota fiscal, cupom fiscal ou recibo conforme o caso.",
    },
  ];
}

export async function listBudgetItems(projectId?: string) {
  const project = await getScopedProject(projectId);

  return buildBudgetItems(project);
}

export async function listExpenses(projectId?: string) {
  const project = await getScopedProject(projectId);
  const items = buildBudgetItems(project);

  return buildExpenses(project, items);
}

export async function getFinancialSummary(projectId?: string) {
  const project = await getScopedProject(projectId);
  const items = buildBudgetItems(project);
  const projectExpenses = buildExpenses(project, items);
  const approved = items.reduce((total, item) => total + item.approvedAmount, 0);
  const executed = project.executedAmount;

  return {
    approved,
    executed,
    remaining: approved - executed,
    expenseCount: projectExpenses.length,
  };
}
