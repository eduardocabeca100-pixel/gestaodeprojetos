import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { BudgetItem, Expense } from "./types";

const budgetPlan = [
  {
    id: "rubrica-direcao",
    category: "Direção executiva",
    name: "Coordenação e direção",
    approvedRatio: 0.12,
    executedRatio: 0.08,
    notes: "Gestão geral, coordenação e direção executiva do projeto.",
  },
  {
    id: "rubrica-formacao",
    category: "Formação / oficinas",
    name: "Oficinas e aulas",
    approvedRatio: 0.26,
    executedRatio: 0.35,
    notes: "Aulas, oficinas, preparação pedagógica e conteúdo formativo.",
  },
  {
    id: "rubrica-atuacao",
    category: "Atuação / elenco",
    name: "Elenco e participação artística",
    approvedRatio: 0.2,
    executedRatio: 0.18,
    notes: "Atuação, presença artística, ensaios e participação do elenco.",
  },
  {
    id: "rubrica-tecnica",
    category: "Técnica e operação",
    name: "Assistência técnica e operação",
    approvedRatio: 0.16,
    executedRatio: 0.18,
    notes: "Som, luz, montagem, operação e suporte técnico.",
  },
  {
    id: "rubrica-registro",
    category: "Registro fotográfico e vídeo",
    name: "Registro e documentação visual",
    approvedRatio: 0.1,
    executedRatio: 0.12,
    notes: "Fotos, vídeos, bastidores e comprovação documental.",
  },
  {
    id: "rubrica-divulgacao",
    category: "Divulgação e design",
    name: "Comunicação visual",
    approvedRatio: 0.08,
    executedRatio: 0.04,
    notes: "Peças gráficas, identidade visual e divulgação do projeto.",
  },
  {
    id: "rubrica-logistica",
    category: "Transporte e logística",
    name: "Deslocamento e apoio",
    approvedRatio: 0.04,
    executedRatio: 0.03,
    notes: "Transporte, logística e apoio operacional às atividades.",
  },
  {
    id: "rubrica-prestacao",
    category: "Documentação e prestação de contas",
    name: "Organização financeira",
    approvedRatio: 0.02,
    executedRatio: 0.02,
    notes: "Arquivamento, relatórios, anexos e prestação de contas.",
  },
  {
    id: "rubrica-acessibilidade",
    category: "Acessibilidade",
    name: "Recursos de acessibilidade",
    approvedRatio: 0.02,
    executedRatio: 0,
    notes: "Adequações e recursos de acesso conforme necessidade do projeto.",
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
      budgetItemId: items[2]?.id ?? `${project.id}-rubrica-atuacao`,
      description: `Pagamento artístico - ${project.name}`,
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
      budgetItemId: items[4]?.id ?? `${project.id}-rubrica-registro`,
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
    {
      id: `${project.id}-despesa-3`,
      projectId: project.id,
      budgetItemId: items[0]?.id ?? `${project.id}-rubrica-direcao`,
      description: `Organização financeira e documentação - ${project.name}`,
      supplier: "Direção executiva",
      document: "00.000.000/0001-00",
      amount: roundAmount(project.executedAmount * 0.12),
      paidAt: project.id === "refens" ? "2026-08-22" : "2026-07-12",
      paymentMethod: "Transferência",
      receiptFile: `comprovante-${project.id}-financeiro.pdf`,
      invoiceFile: null,
      receiptType: "Comprovante bancário",
      status: "Pago",
      notes: "Registro de aprovação, transferência e arquivo financeiro do projeto.",
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
