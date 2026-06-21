import { formatCurrency } from "@/lib/utils/format-currency";

import type { Project, ProjectKpi } from "./types";

export const projects: Project[] = [
  {
    id: "refens",
    name: "Reféns",
    fullTitle: "Formação de Artistas de Rua e Montagem do Espetáculo Reféns",
    slug: "formacao-artistas-rua-espetaculo-refens",
    shortDescription:
      "Projeto de formação em teatro de rua, diário de classe, documentos oficiais, orçamento e montagem do espetáculo Reféns.",
    summary:
      "A proposta organiza 11 encontros formativos, diário de presença, documentação do edital, execução financeira detalhada, registros e certificação do percurso do espetáculo Reféns.",
    edital: "Circuito Catarinense de Cultura PNAB SC 2026",
    registrationNumber: "000937",
    approvedAmount: 50000,
    executedAmount: 8500,
    status: "Classificado",
    currentStage: "Habilitação documental e organização de anexos",
    modality: "Ações de Qualificação e Formação",
    className: "Classe II",
    proponent: "Marcel Eduardo Cabeça Domingues",
    proponentDocument: "59.053.899/0001-53",
    city: "Jaraguá do Sul",
    state: "SC",
    startDate: "2026-08-01",
    endDate: "2027-07-31",
    coverUrl: null,
    bannerUrl: null,
    notes:
      "Baseado no edital Circuito Catarinense de Cultura PNAB SC 2026 e na planilha orçamentária oficial do projeto Reféns.",
    archived: false,
  },
];

export async function listProjects() {
  return projects;
}

export async function getFeaturedProject() {
  return projects[0];
}

export async function getProjectById(id: string) {
  return projects.find((project) => project.id === id || project.slug === id);
}

export async function getProjectKpis(): Promise<ProjectKpi[]> {
  const activeProjects = projects.filter((project) => !project.archived);
  const approvedTotal = activeProjects.reduce(
    (total, project) => total + project.approvedAmount,
    0,
  );
  const executedTotal = activeProjects.reduce(
    (total, project) => total + project.executedAmount,
    0,
  );

  return [
    {
      label: "Projetos ativos",
      value: String(activeProjects.length),
      helper: "Projetos em acompanhamento",
      tone: "purple",
    },
    {
      label: "Valor aprovado total",
      value: formatCurrency(approvedTotal),
      helper: "Somatório dos projetos",
      tone: "green",
    },
    {
      label: "Valor executado",
      value: formatCurrency(executedTotal),
      helper: "Lançado no financeiro",
      tone: "amber",
    },
    {
      label: "A prestar contas",
      value: formatCurrency(approvedTotal - executedTotal),
      helper: "Saldo documental/financeiro",
      tone: "cyan",
    },
  ];
}
