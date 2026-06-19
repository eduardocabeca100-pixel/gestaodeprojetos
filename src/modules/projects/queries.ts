import { formatCurrency } from "@/lib/utils/format-currency";

import type { Project, ProjectKpi } from "./types";

export const projects: Project[] = [
  {
    id: "refens",
    name: "Reféns",
    fullTitle: "Formação de Artistas de Rua e Montagem do Espetáculo Reféns",
    slug: "formacao-artistas-rua-espetaculo-refens",
    shortDescription:
      "Projeto de formação cênica, diário de classe, documentos oficiais e montagem teatral com artistas de rua.",
    summary:
      "A formação organiza 11 encontros pedagógicos, ensaios, diário de presença, anexos do edital, documentos oficiais, registros documentais e montagem do espetáculo Reféns para circulação cultural.",
    edital: "Circuito Catarinense de Cultura PNAB SC 2026",
    registrationNumber: "000937",
    approvedAmount: 50000,
    executedAmount: 8500,
    status: "Classificado",
    currentStage: "Habilitação documental e organização de anexos",
    modality: "Ações de Qualificação e Formação",
    className: "Classe II",
    proponent: "Cia de Artes Viva",
    proponentDocument: "00.000.000/0001-00",
    city: "Florianópolis",
    state: "SC",
    startDate: "2026-08-01",
    endDate: "2027-07-31",
    coverUrl: null,
    bannerUrl: null,
    notes:
      "Prioridade atual: organizar habilitação documental, anexos do edital, certidões, cronograma base e diário de classe.",
    archived: false,
  },
  {
    id: "noiva-amor-tempo",
    name: "A Noiva, o Amor e o Tempo",
    fullTitle: "A Noiva, o Amor e o Tempo",
    slug: "a-noiva-o-amor-e-o-tempo",
    shortDescription: "Circulação teatral com ações de mediação cultural.",
    summary:
      "Projeto de repertório artístico com apresentações, registros e comprovações para prestação de contas.",
    edital: "Edital municipal de circulação cultural",
    registrationNumber: "001245",
    approvedAmount: 32000,
    executedAmount: 19200,
    status: "Em execução",
    currentStage: "Execução artística",
    modality: "Circulação",
    className: "Classe I",
    proponent: "Cia de Artes Viva",
    proponentDocument: "00.000.000/0001-00",
    city: "São José",
    state: "SC",
    startDate: "2026-03-01",
    endDate: "2026-12-15",
    coverUrl: null,
    bannerUrl: null,
    notes: "Acompanhar comprovantes fotográficos e notas fiscais.",
    archived: false,
  },
  {
    id: "prazer-laodiceia",
    name: "Prazer Laodiceia",
    fullTitle: "Prazer Laodiceia",
    slug: "prazer-laodiceia",
    shortDescription: "Montagem teatral em fase de planejamento.",
    summary:
      "Pesquisa e pré-produção de montagem com equipe técnica, orçamento e documentos preparatórios.",
    edital: "Programa estadual de incentivo à cultura",
    registrationNumber: "000518",
    approvedAmount: 28000,
    executedAmount: 0,
    status: "Planejamento",
    currentStage: "Pré-produção",
    modality: "Produção artística",
    className: "Classe II",
    proponent: "Cia de Artes Viva",
    proponentDocument: "00.000.000/0001-00",
    city: "Palhoça",
    state: "SC",
    startDate: "2026-09-10",
    endDate: "2027-02-28",
    coverUrl: null,
    bannerUrl: null,
    notes: "Abrir planilha de rubricas e calendário inicial.",
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
