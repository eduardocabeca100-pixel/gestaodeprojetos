import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type { BudgetItem, Expense } from "./types";

const budgetPlan = [
  {
    id: "pre-diretor-geral",
    category: "Pré-produção",
    name: "Diretor geral + produtor",
    approvedAmount: 6000,
    notes: "Gestão geral, direção e produção do projeto.",
  },
  {
    id: "pre-professor",
    category: "Pré-produção",
    name: "Professor / formador",
    approvedAmount: 2000,
    notes: "Formação e preparação pedagógica inicial.",
  },
  {
    id: "pre-producao-executiva",
    category: "Pré-produção",
    name: "Produção executiva",
    approvedAmount: 6000,
    notes: "Coordenação da produção e documentação do projeto.",
  },
  {
    id: "exec-ator-experiente",
    category: "Produção / Execução",
    name: "Ator experiente",
    approvedAmount: 5400,
    notes: "Participação artística e orientação de cena.",
  },
  {
    id: "exec-alunos-novos",
    category: "Produção / Execução",
    name: "Alunos novos",
    approvedAmount: 1800,
    notes: "Bolsas e participação dos estudantes no processo formativo.",
  },
  {
    id: "exec-som",
    category: "Produção / Execução",
    name: "Técnico de som",
    approvedAmount: 1500,
    notes: "Operação de som em aulas, ensaios e apresentações.",
  },
  {
    id: "exec-iluminacao",
    category: "Produção / Execução",
    name: "Técnico de iluminação",
    approvedAmount: 500,
    notes: "Operação e ajuste de luz cênica.",
  },
  {
    id: "exec-tecladista",
    category: "Produção / Execução",
    name: "Tecladista / músico",
    approvedAmount: 1000,
    notes: "Acompanhamento musical e apoio sonoro ao espetáculo.",
  },
  {
    id: "exec-figurino-maquiagem",
    category: "Produção / Execução",
    name: "Figurino e maquiagem",
    approvedAmount: 4500,
    notes: "Criação, ajuste e finalização de figurino e maquiagem.",
  },
  {
    id: "exec-cenografia",
    category: "Produção / Execução",
    name: "Cenografia",
    approvedAmount: 1500,
    notes: "Elementos cenográficos e ambientação do espetáculo.",
  },
  {
    id: "exec-divulgacao",
    category: "Produção / Execução",
    name: "Material de divulgação",
    approvedAmount: 1800,
    notes: "Peças gráficas, comunicação e divulgação do projeto.",
  },
  {
    id: "exec-logistica",
    category: "Produção / Execução",
    name: "Transporte e logística",
    approvedAmount: 1000,
    notes: "Deslocamento e apoio operacional.",
  },
  {
    id: "exec-lanche",
    category: "Produção / Execução",
    name: "Lanche / alunos e equipe",
    approvedAmount: 3500,
    notes: "Alimentação de alunos e equipe durante as ações.",
  },
  {
    id: "exec-sonorizacao",
    category: "Produção / Execução",
    name: "Sonorização",
    approvedAmount: 3000,
    notes: "Estrutura de som e operação técnica.",
  },
  {
    id: "exec-registro",
    category: "Produção / Execução",
    name: "Registro fotográfico",
    approvedAmount: 2000,
    notes: "Fotos e documentação visual para prestação de contas.",
  },
  {
    id: "exec-tecnica-vocal",
    category: "Produção / Execução",
    name: "Técnica vocal",
    approvedAmount: 1300,
    notes: "Apoio à voz, projeção e preparação vocal.",
  },
  {
    id: "acess-libras",
    category: "Acessibilidade",
    name: "Intérprete de Libras",
    approvedAmount: 1200,
    notes: "Acessibilidade comunicacional nas atividades do projeto.",
  },
  {
    id: "acess-capacitacao",
    category: "Acessibilidade",
    name: "Capacitação de equipe",
    approvedAmount: 1000,
    notes: "Formação da equipe para atendimento acessível.",
  },
  {
    id: "acess-espaco",
    category: "Acessibilidade",
    name: "Espaço para a capacitação",
    approvedAmount: 500,
    notes: "Reserva de espaço físico para a ação acessível.",
  },
  {
    id: "acess-materiais",
    category: "Acessibilidade",
    name: "Materiais acessíveis",
    approvedAmount: 2300,
    notes: "Recursos e materiais de apoio para acessibilidade.",
  },
  {
    id: "pos-prestacao-contas",
    category: "Pós-produção",
    name: "Prestação de contas",
    approvedAmount: 1000,
    notes: "Organização documental e entrega final.",
  },
  {
    id: "pos-contingencias",
    category: "Pós-produção",
    name: "Contingências / imprevistos",
    approvedAmount: 1200,
    notes: "Reserva para ajustes e imprevistos do projeto.",
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
    approvedAmount: item.approvedAmount,
    executedAmount:
      item.id === "pre-diretor-geral"
        ? 3000
        : item.id === "pre-professor"
          ? 2000
          : item.id === "pre-producao-executiva"
            ? 3500
            : 0,
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
      budgetItemId: items[0]?.id ?? `${project.id}-pre-diretor-geral`,
      description: `Direção geral e produção - ${project.name}`,
      supplier: "Marcel Eduardo Cabeça Domingues",
      document: "",
      amount: firstAmount,
      paidAt: project.id === "refens" ? "2026-08-10" : "2026-06-20",
      paymentMethod: "PIX",
      receiptFile: `recibo-${project.id}-prestador.pdf`,
      invoiceFile: null,
      receiptType: "Recibo de prestador PF",
      status: "Pago",
      notes: "Documento de pagamento para profissional sem emissão de nota fiscal.",
    },
    {
      id: `${project.id}-despesa-2`,
      projectId: project.id,
      budgetItemId: items[8]?.id ?? `${project.id}-exec-figurino-maquiagem`,
      description: `Figurino e materiais de cena - ${project.name}`,
      supplier: "Fornecedor de materiais",
      document: "",
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
      budgetItemId: items[20]?.id ?? `${project.id}-pos-prestacao-contas`,
      description: `Organização financeira e documentação - ${project.name}`,
      supplier: "Kaique",
      document: "",
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
