"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Database, FileText, RefreshCcw, Trash2 } from "lucide-react";
import { refensKnownTeam, refensProjectAssignments, seedRefensTeamForProject } from "@/components/refens/refens-official-data";
import { applyRefensOfficialCostBreakdowns } from "@/components/refens/refens-cost-breakdown";
import { Button } from "@/components/ui/button";
import { notifyLocalFinancialDataChanged } from "@/lib/local-financial-sync";

type SeedResult = {
  team: number;
  assignments: number;
  rubrics: number;
  tasks: number;
  pending: number;
};

const REFENS_PROJECT_IDS = [
  "projeto-refens",
  "refens",
  "p-refens",
  "formacao-de-artistas-de-rua-e-montagem-do-espetaculo-refens",
];

const TEAM_ROSTER_STORAGE_KEY = "viva:team-roster:v1";
const PROJECT_ASSIGNMENTS_STORAGE_KEY = "viva:project-team-assignments:v1";
const PROJECT_TEAM_DRAFT_STORAGE_KEY = "viva:project-team-draft:v1";

function buildAdvancedKey(projectId: string) {
  return `viva:gestao-avancada:${projectId}`;
}

const refensTeam = [
  {
    id: "refens-marcel-eduardo",
    name: "Marcel Eduardo Cabeça Domingues",
    role: "Formador, diretor, ator e produtor",
    email: "eduardo@ciaviva.com",
    phone: "(47) 992747545",
    document: "CNPJ 59.053.899/0001-53",
    rubric: "Diretor geral + produtor / Professor formador",
    defaultAmount: "R$ 8.000,00",
    notes: "Proponente, diretor geral, formador e integrante artístico do projeto Reféns.",
    active: true,
  },
  {
    id: "refens-kaique-varela",
    name: "Kaique Varela Zaluski",
    role: "Produção executiva",
    email: "",
    phone: "",
    document: "CNPJ 55.069.179/0001-25",
    rubric: "Produção executiva",
    defaultAmount: "R$ 6.000,00",
    notes: "Direção/produção executiva, planejamento, comunicação, orçamento e apoio operacional.",
    active: true,
  },
  {
    id: "refens-suzi-daiane",
    name: "Suzi Daiane",
    role: "Professora de inclusão, LIBRAS e acessibilidade",
    email: "",
    phone: "",
    document: "",
    rubric: "Capacitação de equipe / Acessibilidade",
    defaultAmount: "R$ 1.000,00",
    notes: "Professora de inclusão, LIBRAS, audiodescrição e acessibilidade teatral.",
    active: true,
  },
  {
    id: "refens-katy-souza",
    name: "Katy Souza",
    role: "Professora de técnica vocal / Música",
    email: "",
    phone: "",
    document: "",
    rubric: "Técnica vocal / Tecladista músico",
    defaultAmount: "R$ 2.300,00",
    notes: "Técnica vocal e apoio musical.",
    active: true,
  },
  {
    id: "refens-jones-andre",
    name: "Jones André",
    role: "Técnico de som",
    email: "",
    phone: "",
    document: "",
    rubric: "Técnico de som",
    defaultAmount: "R$ 1.500,00",
    notes: "Equipe técnica de som.",
    active: true,
  },
  {
    id: "refens-cassius-venera",
    name: "Cassius Venera",
    role: "Técnico de iluminação",
    email: "",
    phone: "",
    document: "",
    rubric: "Técnico de iluminação",
    defaultAmount: "R$ 500,00",
    notes: "Equipe técnica de luz.",
    active: true,
  },
  {
    id: "refens-andre-brito",
    name: "André Brito",
    role: "Registro audiovisual / fotográfico",
    email: "",
    phone: "",
    document: "",
    rubric: "Registro fotográfico",
    defaultAmount: "R$ 2.000,00",
    notes: "Registro audiovisual/fotográfico do projeto.",
    active: true,
  },
  {
    id: "refens-renaldo-boddemberg",
    name: "Renaldo Boddemberg",
    role: "Ator experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente.",
    active: true,
  },
  {
    id: "refens-bruna-lazzarotto",
    name: "Bruna Lazzarotto",
    role: "Atriz experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente.",
    active: true,
  },
  {
    id: "refens-wemerson-goncalves",
    name: "Wemerson Gonçalves",
    role: "Ator experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente.",
    active: true,
  },
  {
    id: "refens-julia-titz",
    name: "Julia Titz",
    role: "Atriz experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente.",
    active: true,
  },
  {
    id: "refens-karim-kamada",
    name: "Karim Kamada",
    role: "Artista / Atriz experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente.",
    active: true,
  },
];

const refensAssignments = refensTeam.map((member) => ({
  id: `assignment-${member.id}`,
  memberId: member.id,
  name: member.name,
  role: member.role,
  rubric: member.rubric,
  expectedAmount: member.defaultAmount,
  paidAmount: "R$ 0,00",
  paymentStatus: "Previsto",
  notes: member.notes,
  paymentHistory: [],
}));

const refensRubrics = [
  {
    id: "rub-diretor-produtor",
    category: "Pré-produção",
    name: "Diretor geral + produtor",
    unit: "01 projeto",
    quantity: "01",
    paymentBasis: "Por projeto",
    approved: "R$ 6.000,00",
    executed: "R$ 0,00",
    notes: "Pré-produção.",
  },
  {
    id: "rub-professor-formador",
    category: "Pré-produção",
    name: "Professor / formador",
    unit: "01 projeto",
    quantity: "01",
    paymentBasis: "Por projeto",
    approved: "R$ 2.000,00",
    executed: "R$ 0,00",
    notes: "Formação teatral.",
  },
  {
    id: "rub-producao-executiva",
    category: "Pré-produção",
    name: "Produção executiva",
    unit: "01 projeto",
    quantity: "01",
    paymentBasis: "Por projeto",
    approved: "R$ 6.000,00",
    executed: "R$ 0,00",
    notes: "Planejamento, produção e execução.",
  },
  {
    id: "rub-ator-experiente",
    category: "Produção/Execução",
    name: "Ator experiente",
    unit: "03 apresentações",
    quantity: "06 atores",
    paymentBasis: "R$ 300,00 por ator por apresentação",
    approved: "R$ 5.400,00",
    executed: "R$ 0,00",
    notes: "6 atores experientes em 3 apresentações.",
  },
  {
    id: "rub-alunos-novos",
    category: "Produção/Execução",
    name: "Alunos novos",
    unit: "03 apresentações",
    quantity: "12 alunos",
    paymentBasis: "R$ 50,00 por aluno por apresentação",
    approved: "R$ 1.800,00",
    executed: "R$ 0,00",
    notes: "Cachê simbólico para 12 novos artistas.",
  },
  {
    id: "rub-tecnico-som",
    category: "Produção/Execução",
    name: "Técnico de som",
    unit: "03 apresentações",
    quantity: "01 profissional",
    paymentBasis: "R$ 500,00 por apresentação",
    approved: "R$ 1.500,00",
    executed: "R$ 0,00",
    notes: "Som nas apresentações.",
  },
  {
    id: "rub-tecnico-iluminacao",
    category: "Produção/Execução",
    name: "Técnico de iluminação",
    unit: "01 serviço",
    quantity: "01 profissional",
    paymentBasis: "Por projeto/serviço",
    approved: "R$ 500,00",
    executed: "R$ 0,00",
    notes: "Iluminação.",
  },
  {
    id: "rub-tecladista-musico",
    category: "Produção/Execução",
    name: "Tecladista / músico",
    unit: "03 apresentações",
    quantity: "01 músico",
    paymentBasis: "Por projeto/apresentações",
    approved: "R$ 1.000,00",
    executed: "R$ 0,00",
    notes: "Apoio musical.",
  },
  {
    id: "rub-figurino-maquiagem",
    category: "Produção/Execução",
    name: "Figurino e maquiagem",
    unit: "01 projeto",
    quantity: "01 conjunto",
    paymentBasis: "Por projeto",
    approved: "R$ 4.500,00",
    executed: "R$ 0,00",
    notes: "Figurino e maquiagem.",
  },
  {
    id: "rub-cenografia",
    category: "Produção/Execução",
    name: "Cenografia",
    unit: "01 projeto",
    quantity: "01 cenário",
    paymentBasis: "Por projeto",
    approved: "R$ 1.500,00",
    executed: "R$ 0,00",
    notes: "Cenário leve.",
  },
  {
    id: "rub-material-divulgacao",
    category: "Produção/Execução",
    name: "Material de divulgação",
    unit: "01 projeto",
    quantity: "01 campanha",
    paymentBasis: "Por campanha",
    approved: "R$ 1.800,00",
    executed: "R$ 0,00",
    notes: "Divulgação das inscrições e apresentações.",
  },
  {
    id: "rub-transporte-logistica",
    category: "Produção/Execução",
    name: "Transporte e logística",
    unit: "01 projeto",
    quantity: "01 operação",
    paymentBasis: "Por projeto",
    approved: "R$ 1.000,00",
    executed: "R$ 0,00",
    notes: "Logística.",
  },
  {
    id: "rub-lanche",
    category: "Produção/Execução",
    name: "Lanche / alunos e equipe",
    unit: "01 projeto",
    quantity: "01 fornecimento",
    paymentBasis: "Por projeto",
    approved: "R$ 3.500,00",
    executed: "R$ 0,00",
    notes: "Apoio alimentar.",
  },
  {
    id: "rub-sonorizacao",
    category: "Produção/Execução",
    name: "Sonorização",
    unit: "02 serviços",
    quantity: "01 fornecedor",
    paymentBasis: "Por serviço",
    approved: "R$ 3.000,00",
    executed: "R$ 0,00",
    notes: "Sonorização.",
  },
  {
    id: "rub-registro-fotografico",
    category: "Produção/Execução",
    name: "Registro fotográfico",
    unit: "01 projeto",
    quantity: "01 profissional",
    paymentBasis: "Por projeto",
    approved: "R$ 2.000,00",
    executed: "R$ 0,00",
    notes: "Registro fotográfico/audiovisual.",
  },
  {
    id: "rub-tecnica-vocal",
    category: "Produção/Execução",
    name: "Técnica vocal",
    unit: "01 projeto",
    quantity: "01 profissional",
    paymentBasis: "Por projeto",
    approved: "R$ 1.300,00",
    executed: "R$ 0,00",
    notes: "Técnica vocal.",
  },
  {
    id: "rub-interprete-libras",
    category: "Acessibilidade",
    name: "Intérprete de LIBRAS",
    unit: "03 apresentações",
    quantity: "01 intérprete",
    paymentBasis: "R$ 400,00 por apresentação",
    approved: "R$ 1.200,00",
    executed: "R$ 0,00",
    notes: "Acessibilidade comunicacional.",
  },
  {
    id: "rub-capacitacao-equipe",
    category: "Acessibilidade",
    name: "Capacitação de equipe",
    unit: "01 capacitação",
    quantity: "01 profissional",
    paymentBasis: "Por capacitação",
    approved: "R$ 1.000,00",
    executed: "R$ 0,00",
    notes: "Workshop de inclusão.",
  },
  {
    id: "rub-espaco-capacitacao",
    category: "Acessibilidade",
    name: "Espaço para capacitação",
    unit: "01 espaço",
    quantity: "01",
    paymentBasis: "Por uso",
    approved: "R$ 500,00",
    executed: "R$ 0,00",
    notes: "Espaço da capacitação.",
  },
  {
    id: "rub-materiais-acessiveis",
    category: "Acessibilidade",
    name: "Materiais acessíveis",
    unit: "01 projeto",
    quantity: "01 conjunto",
    paymentBasis: "Por projeto",
    approved: "R$ 2.300,00",
    executed: "R$ 0,00",
    notes: "Materiais com QR Code e linguagem simples.",
  },
  {
    id: "rub-prestacao-contas",
    category: "Pós-produção",
    name: "Prestação de contas",
    unit: "01 projeto",
    quantity: "01",
    paymentBasis: "Por projeto",
    approved: "R$ 1.000,00",
    executed: "R$ 0,00",
    notes: "Relatório e prestação de contas.",
  },
  {
    id: "rub-contingencias",
    category: "Pós-produção",
    name: "Contingências / imprevistos",
    unit: "01 projeto",
    quantity: "01 reserva",
    paymentBasis: "Conforme necessidade",
    approved: "R$ 1.200,00",
    executed: "R$ 0,00",
    notes: "Reserva para imprevistos.",
  },
];

const refensPending = [
  {
    id: "pend-refens-conta-bancaria",
    title: "Acompanhar etapa de assinatura do Termo de Execução Cultural e dados bancários",
    type: "Administrativo",
    dueDate: "",
    priority: "Alta",
    status: "Pendente",
  },
  {
    id: "pend-refens-contratos-equipe",
    title: "Organizar contratos/recibos da equipe e participantes",
    type: "Documentação",
    dueDate: "",
    priority: "Alta",
    status: "Pendente",
  },
  {
    id: "pend-refens-libras",
    title: "Confirmar intérprete de LIBRAS nas 3 apresentações",
    type: "Acessibilidade",
    dueDate: "",
    priority: "Alta",
    status: "Pendente",
  },
  {
    id: "pend-refens-ceu",
    title: "Confirmar agenda do Teatro do CEU para aulas, ensaios e apresentação",
    type: "Produção",
    dueDate: "",
    priority: "Alta",
    status: "Pendente",
  },
  {
    id: "pend-refens-divulgacao",
    title: "Preparar material de divulgação das inscrições e apresentações gratuitas",
    type: "Comunicação",
    dueDate: "",
    priority: "Média",
    status: "Pendente",
  },
];

const refensTasks = [
  {
    id: "task-refens-inscricoes",
    title: "Abrir inscrições para 12 novos artistas",
    stage: "Meses 1–2",
    assignee: "Produção executiva",
    dueDate: "",
    status: "Pendente",
  },
  {
    id: "task-refens-aulas",
    title: "Realizar 11 aulas de teatro no CEU",
    stage: "Meses 1–2",
    assignee: "Formador / Direção",
    dueDate: "",
    status: "Pendente",
  },
  {
    id: "task-refens-roteiro",
    title: "Enviar roteiro completo de Reféns aos selecionados",
    stage: "Formação",
    assignee: "Direção",
    dueDate: "",
    status: "Pendente",
  },
  {
    id: "task-refens-ensaios",
    title: "Realizar ensaios finais com grupo formado",
    stage: "Meses 3–4",
    assignee: "Direção artística",
    dueDate: "",
    status: "Pendente",
  },
  {
    id: "task-refens-tecnica",
    title: "Fazer ajustes técnicos de som, luz, figurino, cenário e música",
    stage: "Mês 5",
    assignee: "Equipe técnica",
    dueDate: "",
    status: "Pendente",
  },
  {
    id: "task-refens-apresentacoes",
    title: "Realizar 3 apresentações gratuitas",
    stage: "Mês 6",
    assignee: "Produção / Elenco",
    dueDate: "",
    status: "Pendente",
  },
  {
    id: "task-refens-registro",
    title: "Registrar fotos/vídeos das ações e apresentações",
    stage: "Execução",
    assignee: "Registro audiovisual",
    dueDate: "",
    status: "Pendente",
  },
  {
    id: "task-refens-prestacao",
    title: "Organizar relatório de execução e prestação de contas",
    stage: "Pós-produção",
    assignee: "Produção executiva",
    dueDate: "",
    status: "Pendente",
  },
];

const refensProjectSummary = {
  id: "projeto-refens",
  shortName: "Reféns",
  officialTitle: "Formação de Artistas de Rua e Montagem do Espetáculo “Reféns”",
  proponent: "Marcel Eduardo Cabeça Domingues (MEI)",
  class: "Classe II – Pessoa Jurídica (MEI)",
  area: "A – Artes Cênicas (Teatro) + K – Gestão e Mediação Cultural",
  object:
    "Realização de 11 ações de qualificação, aulas práticas e teóricas de teatro, para 12 novos artistas em situação de vulnerabilidade e 6 artistas experientes. Ao final, será montado e apresentado o espetáculo Reféns em 3 apresentações gratuitas.",
  locations:
    "Teatro do CEU – Jaraguá do Sul para aulas e uma apresentação; 2 apresentações em espaço público de rua/praça.",
  duration:
    "11 aulas de 3 horas cada; 3 apresentações gratuitas com duração aproximada de 1 hora cada.",
  budget: "R$ 50.000,00",
  accessibility:
    "Intérprete de LIBRAS nas 3 apresentações, materiais com QR Code e linguagem simples, workshop de inclusão com Suzi Daiane e destinação de R$ 5.000,00 para acessibilidade.",
  audience:
    "12 novos artistas + 6 artistas experientes, totalizando 18 participantes; estimativa de 600 pessoas de público nas apresentações.",
};

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function importRefensData(): SeedResult {
  const assignmentsByProject: Record<string, typeof refensAssignments> = {};

  REFENS_PROJECT_IDS.forEach((projectId) => {
    assignmentsByProject[projectId] = refensAssignments;
  });

  writeJson(TEAM_ROSTER_STORAGE_KEY, refensTeam);
  writeJson(PROJECT_ASSIGNMENTS_STORAGE_KEY, assignmentsByProject);
  writeJson(PROJECT_TEAM_DRAFT_STORAGE_KEY, refensTeam.map((member) => member.id));
  writeJson("viva:refens-project-summary:v1", refensProjectSummary);

  REFENS_PROJECT_IDS.forEach((projectId) => {
    writeJson(buildAdvancedKey(projectId), {
      pending: refensPending,
      tasks: refensTasks,
      rubrics: refensRubrics,
    });
  });

  notifyLocalFinancialDataChanged();

  return {
    team: refensTeam.length,
    assignments: refensAssignments.length,
    rubrics: refensRubrics.length,
    tasks: refensTasks.length,
    pending: refensPending.length,
  };
}

function clearRefensData() {
  window.localStorage.removeItem(TEAM_ROSTER_STORAGE_KEY);
  window.localStorage.removeItem(PROJECT_ASSIGNMENTS_STORAGE_KEY);
  window.localStorage.removeItem(PROJECT_TEAM_DRAFT_STORAGE_KEY);
  window.localStorage.removeItem("viva:refens-project-summary:v1");

  REFENS_PROJECT_IDS.forEach((projectId) => {
    window.localStorage.removeItem(buildAdvancedKey(projectId));
  });

  notifyLocalFinancialDataChanged();
}

export function RefensDataSeeder() {
  const [result, setResult] = useState<SeedResult | null>(null);
  const [cleared, setCleared] = useState(false);

  const importPreview = useMemo(() => {
    return [
      ["Projeto", refensProjectSummary.officialTitle],
      ["Valor total", refensProjectSummary.budget],
      ["Equipe inicial", `${refensTeam.length} pessoas`],
      ["Rubricas", `${refensRubrics.length} itens`],
      ["Tarefas", `${refensTasks.length} tarefas`],
      ["Pendências", `${refensPending.length} pendências`],
    ];
  }, []);

  function handleImport() {
    const imported = importRefensData();
    seedRefensTeamForProject("projeto-refens");
    applyRefensOfficialCostBreakdowns("projeto-refens");
    setResult({
      team: refensKnownTeam.length,
      assignments: refensProjectAssignments.length,
      rubrics: imported.rubrics,
      tasks: imported.tasks,
      pending: imported.pending,
    });
    setCleared(false);
  }

  function handleClear() {
    clearRefensData();
    setResult(null);
    setCleared(true);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">
            Importador oficial
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Projeto Reféns
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Esta ação substitui os dados genéricos locais por informações reais do projeto aprovado,
            sem apagar telas, menus, layouts ou funcionalidades do sistema.
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {importPreview.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="block text-xs font-black uppercase tracking-wide text-slate-400">
                {label}
              </span>
              <strong className="mt-2 block text-sm font-black text-slate-950">
                {value}
              </strong>
            </div>
          ))}
        </div>
      </section>

      {result ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5" />
            Dados do Reféns importados com sucesso.
          </div>
          <p className="mt-2">
            Equipe: {result.team} • Equipe do projeto: {result.assignments} • Rubricas detalhadas: {result.rubrics} • Tarefas: {result.tasks} • Pendências: {result.pending}
          </p>
        </div>
      ) : null}

      {cleared ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Dados locais do Reféns removidos. Você pode importar novamente quando quiser.
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            O que será preenchido
          </h3>

          <div className="mt-5 grid gap-4">
            <InfoBlock title="Identificação">
              <p>
                <strong>Reféns</strong> será usado como nome curto, e o título oficial ficará registrado como
                <strong> Formação de Artistas de Rua e Montagem do Espetáculo “Reféns”</strong>.
              </p>
            </InfoBlock>

            <InfoBlock title="Equipe">
              <p>
                Serão cadastrados Marcel Eduardo, Kaique Varela, Suzi Daiane, Katy Souza,
                Jones André, Cassius Venera, André Brito e elenco experiente informado no projeto.
              </p>
            </InfoBlock>

            <InfoBlock title="Rubricas">
              <p>
                Serão cadastradas rubricas do orçamento aprovado, incluindo categoria, unidade, quantidade, forma de pagamento, aprovado, executado e saldo.
              </p>
            </InfoBlock>

            <InfoBlock title="Gestão">
              <p>
                Serão cadastradas pendências e tarefas reais do fluxo do projeto:
                inscrições, aulas, ensaios, ajustes técnicos, apresentações, registro e prestação de contas.
              </p>
            </InfoBlock>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Database className="size-6" />
          </div>

          <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
            Executar importação
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Esta ação atualiza apenas os dados locais usados pelas telas novas de equipe, gestão e relatórios.
          </p>

          <div className="mt-5 space-y-3">
            <Button type="button" className="w-full" onClick={handleImport}>
              <RefreshCcw className="mr-2 size-4" />
              Importar/Atualizar Reféns
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={handleClear}>
              <Trash2 className="mr-2 size-4" />
              Limpar dados locais do Reféns
            </Button>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
            Depois de importar, abra:
            <br />
            <strong>/equipe</strong>
            <br />
            <strong>/gestao</strong>
            <br />
            <strong>/configuracoes/pdf</strong>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-emerald-700" />
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            Resumo oficial cadastrado
          </h3>
        </div>

        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          {Object.entries(refensProjectSummary).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <dt className="text-xs font-black uppercase tracking-wide text-slate-400">{key}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-700">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="font-black text-slate-950">{title}</h4>
      <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}
