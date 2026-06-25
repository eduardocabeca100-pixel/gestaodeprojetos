"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileText,
  FolderCheck,
  Plus,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CulturalReportWorkspace } from "@/components/management/cultural-report-workspace";
import { ProjectDataResetPanel } from "@/components/projects/project-data-reset-panel";
import { AdministrativeDemonstratives } from "@/components/management/administrative-demonstratives";
import { AccountabilityEditor } from "@/components/management/accountability-editor";
import { ProjectDocumentsVault } from "@/components/management/project-documents-vault";
import { formatCurrency } from "@/lib/utils/format-currency";

type IconComponent = ComponentType<{ className?: string }>;

type TabKey =
  | "dashboard"
  | "alerts"
  | "documents"
  | "reports"
  | "accountability"
  | "demonstratives";

type AlertItem = {
  id: string;
  title: string;
  dueDate: string;
  priority: "Baixa" | "Média" | "Alta";
  done: boolean;
};

type ProjectDocument = {
  id: string;
  name: string;
  category: string;
  status: "Pendente" | "Enviado" | "Aprovado" | "Precisa corrigir";
  validUntil?: string;
};

type AccountabilityItem = {
  id: string;
  title: string;
  done: boolean;
  notes: string;
};

type ReportDraft = {
  projectName: string;
  periodStart: string;
  periodEnd: string;
  emittedAt: string;
  audience: string;
  activities: string;
  development: string;
  results: string;
  evidence: string;
};

type DemonstrativeItem = {
  id: string;
  number: string;
  client: string;
  dueDate: string;
  total: number;
  status: "Rascunho" | "Emitido" | "Pago" | "Vencido";
};

type FinanceSummary = {
  approved: number;
  executed: number;
  pending: number;
};

type SuiteState = {
  alerts: AlertItem[];
  documents: ProjectDocument[];
  accountability: AccountabilityItem[];
  report: ReportDraft;
  demonstratives: DemonstrativeItem[];
  financeSummary: FinanceSummary;
};

type LegacyRubric = {
  approved?: number;
  executed?: number;
};

const storageKey = "viva:central-cultural:v2";

const defaultState: SuiteState = {
  alerts: [
    {
      id: "alert-certidao-federal",
      title: "Conferir validade da Certidão Federal",
      dueDate: new Date().toISOString().slice(0, 10),
      priority: "Alta",
      done: false,
    },
    {
      id: "alert-prestacao-contas",
      title: "Organizar evidências para prestação de contas",
      dueDate: "2026-12-31",
      priority: "Média",
      done: false,
    },
  ],
  documents: [
    {
      id: "doc-cartao-cnpj",
      name: "Cartão CNPJ",
      category: "Proponente",
      status: "Pendente",
      validUntil: "",
    },
    {
      id: "doc-certidao-federal",
      name: "Certidão Federal",
      category: "Certidões",
      status: "Pendente",
      validUntil: "",
    },
    {
      id: "doc-carta-anuencia",
      name: "Carta de anuência do espaço",
      category: "Projeto",
      status: "Pendente",
      validUntil: "",
    },
  ],
  accountability: [
    {
      id: "acc-relatorio",
      title: "Relatório narrativo preenchido",
      done: false,
      notes: "",
    },
    {
      id: "acc-fotos",
      title: "Fotos e links de vídeo organizados",
      done: false,
      notes: "",
    },
    {
      id: "acc-presenca",
      title: "Lista de presença vinculada aos participantes",
      done: false,
      notes: "",
    },
    {
      id: "acc-financeiro",
      title: "Comprovantes financeiros conferidos",
      done: false,
      notes: "",
    },
  ],
  report: {
    projectName: "Nome do projeto",
    periodStart: "",
    periodEnd: "",
    emittedAt: new Date().toISOString().slice(0, 10),
    audience: "",
    activities: "Descreva as ações realizadas no período.",
    development: "Descreva como o projeto está sendo desenvolvido.",
    results: "Descreva os resultados alcançados até o momento.",
    evidence: "Liste fotos, vídeos, listas de presença, documentos e links comprobatórios.",
  },
  demonstratives: [
    {
      id: "demonstrativo-modelo",
      number: "0001",
      client: "Nome/Razão social",
      dueDate: "",
      total: 0,
      status: "Rascunho",
    },
  ],
  financeSummary: {
    approved: 0,
    executed: 0,
    pending: 0,
  },
};

const tabs: Array<{ key: TabKey; label: string; description: string; icon: IconComponent }> = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Visão geral",
    icon: BarChart3,
  },
  {
    key: "alerts",
    label: "Alertas",
    description: "Prazos críticos",
    icon: BellRing,
  },
  {
    key: "documents",
    label: "Documentos",
    description: "Certidões e anexos",
    icon: FolderCheck,
  },
  {
    key: "reports",
    label: "Relatório",
    description: "Execução narrativa",
    icon: FileText,
  },
  {
    key: "accountability",
    label: "Prestação",
    description: "Checklist e evidências",
    icon: ClipboardCheck,
  },
  {
    key: "demonstratives",
    label: "Demonstrativos",
    description: "Recibos administrativos",
    icon: ReceiptText,
  },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mergeState(saved: Partial<SuiteState> | null): SuiteState {
  if (!saved) return defaultState;

  const legacyRubrics = (saved as Partial<SuiteState> & { rubrics?: LegacyRubric[] }).rubrics ?? [];
  const approvedFromRubrics = legacyRubrics.reduce((sum, item) => sum + Number(item.approved ?? 0), 0);
  const executedFromRubrics = legacyRubrics.reduce((sum, item) => sum + Number(item.executed ?? 0), 0);

  return {
    alerts: saved.alerts ?? defaultState.alerts,
    documents: saved.documents ?? defaultState.documents,
    accountability: saved.accountability ?? defaultState.accountability,
    report: {
      ...defaultState.report,
      ...(saved.report ?? {}),
      emittedAt: saved.report?.emittedAt ?? new Date().toISOString().slice(0, 10),
    },
    demonstratives: saved.demonstratives ?? defaultState.demonstratives,
    financeSummary: saved.financeSummary ?? {
      approved: approvedFromRubrics,
      executed: executedFromRubrics,
      pending: Math.max(approvedFromRubrics - executedFromRubrics, 0),
    },
  };
}

function readState(): SuiteState {
  if (typeof window === "undefined") return defaultState;

  try {
    const savedV2 = window.localStorage.getItem(storageKey);

    if (savedV2) {
      return mergeState(JSON.parse(savedV2) as Partial<SuiteState>);
    }

    const savedV1 = window.localStorage.getItem("viva:central-cultural:v1");

    if (savedV1) {
      return mergeState(JSON.parse(savedV1) as Partial<SuiteState>);
    }

    return defaultState;
  } catch {
    return defaultState;
  }
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function daysUntil(date: string) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function alertTone(item: AlertItem) {
  if (item.done) return "border-emerald-200 bg-emerald-50 text-emerald-700";

  const days = daysUntil(item.dueDate);

  if (days === null) return "border-slate-200 bg-white text-slate-700";
  if (days < 0) return "border-red-300 bg-red-50 text-red-700";
  if (days <= 7 || item.priority === "Alta") return "border-amber-300 bg-amber-50 text-amber-800";

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="form-input" />;
}

function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="form-input" />;
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="form-input min-h-28" />;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TabButton({
  active,
  tab,
  onClick,
}: {
  active: boolean;
  tab: (typeof tabs)[number];
  onClick: () => void;
}) {
  const Icon = tab.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "group rounded-3xl border border-primary bg-primary p-4 text-left text-white shadow-xl shadow-primary/20"
          : "group rounded-3xl border border-white bg-white p-4 text-left text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <span className={active ? "rounded-2xl bg-white/15 p-3" : "rounded-2xl bg-primary/10 p-3 text-primary"}>
          <Icon className="size-5" />
        </span>
        <ChevronRight className={active ? "size-4 text-white/80" : "size-4 text-slate-300 group-hover:text-primary"} />
      </div>
      <p className="mt-4 text-sm font-black">{tab.label}</p>
      <p className={active ? "mt-1 text-xs text-white/75" : "mt-1 text-xs text-slate-500"}>
        {tab.description}
      </p>
    </button>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  onClick,
  tone = "primary",
}: {
  label: string;
  value: string;
  helper: string;
  icon: IconComponent;
  onClick?: () => void;
  tone?: "primary" | "red" | "amber" | "emerald" | "sky";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-3xl border border-white bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
        <span className={`rounded-2xl p-3 ${toneClass}`}>
          <Icon className="size-6" />
        </span>
      </div>
    </button>
  );
}

export function CulturalManagementSuite() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [state, setState] = useState<SuiteState>(defaultState);
  const [clientReady, setClientReady] = useState(false);
  const [message, setMessage] = useState("Central pronta para gestão da execução cultural.");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setState(readState());
      setClientReady(true);
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  function commit(next: SuiteState, nextMessage = "Alteração salva automaticamente.") {
    setState(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setMessage(nextMessage);
  }

  const totals = useMemo(() => {
    const pendingAlerts = state.alerts.filter((item) => !item.done).length;
    const urgentAlerts = state.alerts.filter((item) => {
      const days = daysUntil(item.dueDate);
      return !item.done && (item.priority === "Alta" || (days !== null && days <= 7));
    }).length;
    const expiredAlerts = state.alerts.filter((item) => {
      const days = daysUntil(item.dueDate);
      return !item.done && days !== null && days < 0;
    }).length;
    const pendingDocuments = state.documents.filter((item) => item.status !== "Aprovado").length;
    const doneAccountability = state.accountability.filter((item) => item.done).length;
    const accountabilityPercent = state.accountability.length
      ? Math.round((doneAccountability / state.accountability.length) * 100)
      : 0;
    const demonstrativeTotal = state.demonstratives.reduce((sum, item) => sum + item.total, 0);

    return {
      pendingAlerts,
      urgentAlerts,
      expiredAlerts,
      pendingDocuments,
      doneAccountability,
      accountabilityPercent,
      demonstrativeTotal,
      remaining: state.financeSummary.approved - state.financeSummary.executed,
    };
  }, [state]);

  const criticalAlerts = useMemo(
    () =>
      state.alerts
        .filter((item) => {
          const days = daysUntil(item.dueDate);
          return !item.done && (item.priority === "Alta" || (days !== null && days <= 7));
        })
        .slice(0, 3),
    [state.alerts],
  );

  const generatedReport = useMemo(
    () =>
      `RELATÓRIO DE EXECUÇÃO CULTURAL

Projeto: ${state.report.projectName}
Período de execução analisado: ${state.report.periodStart || "não informado"} até ${state.report.periodEnd || "data atual"}
Data de emissão: ${state.report.emittedAt}
Público alcançado: ${state.report.audience || "não informado"}

1. AÇÕES REALIZADAS
${state.report.activities}

2. DESENVOLVIMENTO DO PROJETO
${state.report.development}

3. RESULTADOS ALCANÇADOS
${state.report.results}

4. EVIDÊNCIAS E COMPROVAÇÕES
${state.report.evidence}

5. DOCUMENTOS E PRESTAÇÃO
Documentos pendentes: ${totals.pendingDocuments}
Prestação de contas concluída: ${totals.accountabilityPercent}%

6. RESUMO FINANCEIRO
Valor aprovado: ${formatCurrency(state.financeSummary.approved)}
Valor executado: ${formatCurrency(state.financeSummary.executed)}
Saldo estimado: ${formatCurrency(totals.remaining)}
`,
    [state.financeSummary.approved, state.financeSummary.executed, state.report, totals.accountabilityPercent, totals.pendingDocuments, totals.remaining],
  );

  if (!clientReady) {
    return (
      <div className="rounded-3xl border border-white bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando Central Cultural...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {criticalAlerts.length > 0 ? (
        <div className="rounded-3xl border border-red-200 bg-gradient-to-r from-red-50 to-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
                <BellRing className="size-6" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
                  Atenção imediata
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  Existem prazos críticos que podem prejudicar o projeto.
                </h3>
                <div className="mt-3 grid gap-2">
                  {criticalAlerts.map((item) => {
                    const days = daysUntil(item.dueDate);
                    const label = days === null ? "sem data" : days < 0 ? `vencido há ${Math.abs(days)} dia(s)` : `vence em ${days} dia(s)`;

                    return (
                      <div key={item.id} className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-sm font-bold text-red-700">
                        {item.title} — {label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <Button type="button" onClick={() => setActiveTab("alerts")}>
              Abrir alertas
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-primary p-6 text-white">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-white/60">
                Gestão integrada
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Central Cultural
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
                Gestão de execução, prazos, documentos, relatórios, prestação de contas e demonstrativos administrativos da companhia.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => downloadText("relatorio-execucao-cultural.txt", generatedReport)}
              >
                <Download className="size-4" />
                Baixar relatório TXT
              </Button>

              <Button
                type="button"
                onClick={() => {
                  if (window.confirm("Restaurar dados de exemplo da Central Cultural?")) {
                    commit(defaultState, "Dados de exemplo restaurados.");
                  }
                }}
              >
                <RotateCcw className="size-4" />
                Restaurar exemplos
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white p-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        </div>
      </div>

      <ProjectDataResetPanel />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {tabs.map((tab) => (
          <TabButton
            key={tab.key}
            active={activeTab === tab.key}
            tab={tab}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      {activeTab === "dashboard" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              label="Prazos"
              value={String(totals.pendingAlerts)}
              helper={`${totals.urgentAlerts} urgente(s), ${totals.expiredAlerts} vencido(s)`}
              icon={AlertTriangle}
              tone={totals.expiredAlerts > 0 ? "red" : totals.urgentAlerts > 0 ? "amber" : "emerald"}
              onClick={() => setActiveTab("alerts")}
            />
            <MetricCard
              label="Documentos"
              value={String(totals.pendingDocuments)}
              helper="Pendentes ou em correção"
              icon={FolderCheck}
              tone={totals.pendingDocuments > 0 ? "amber" : "emerald"}
              onClick={() => setActiveTab("documents")}
            />
            <MetricCard
              label="Prestação"
              value={`${totals.accountabilityPercent}%`}
              helper="Checklist concluído"
              icon={ClipboardCheck}
              tone={totals.accountabilityPercent >= 80 ? "emerald" : "sky"}
              onClick={() => setActiveTab("accountability")}
            />
            <MetricCard
              label="Relatório"
              value={state.report.projectName}
              helper="Narrativo em edição"
              icon={FileText}
              tone="primary"
              onClick={() => setActiveTab("reports")}
            />
            <MetricCard
              label="Financeiro"
              value={formatCurrency(state.financeSummary.executed)}
              helper={`Saldo: ${formatCurrency(totals.remaining)}`}
              icon={Wallet}
              tone="sky"
              onClick={() => setMessage("O financeiro será puxado da aba Financeiro em módulo futuro.")}
            />
            <MetricCard
              label="Demonstrativos"
              value={formatCurrency(totals.demonstrativeTotal)}
              helper={`${state.demonstratives.length} documento(s)`}
              icon={ReceiptText}
              tone="primary"
              onClick={() => setActiveTab("demonstratives")}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    Grade de ações rápidas
                  </h3>
                  <p className="text-sm text-slate-500">
                    Clique em qualquer bloco para abrir a área correspondente.
                  </p>
                </div>
                <ShieldCheck className="size-7 text-primary" />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {tabs
                  .filter((tab) => tab.key !== "dashboard")
                  .map((tab) => {
                    const Icon = tab.icon;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-2xl bg-white p-3 text-primary">
                            <Icon className="size-5" />
                          </span>
                          <ChevronRight className="size-4 text-slate-300" />
                        </div>
                        <p className="mt-4 font-black text-slate-950">{tab.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{tab.description}</p>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">
                Execução da prestação
              </h3>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${totals.accountabilityPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-600">
                {totals.accountabilityPercent}% concluído
              </p>

              <div className="mt-5 space-y-2">
                {state.accountability.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setActiveTab("accountability")}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <CheckCircle2 className={item.done ? "size-4 text-emerald-600" : "size-4 text-slate-300"} />
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "alerts" ? (
        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Alertas de prazo</h3>
              <p className="text-sm text-slate-500">
                Controle rigoroso de prazos de edital, documentos, execução e prestação.
              </p>
            </div>
            <Button
              type="button"
              onClick={() =>
                commit(
                  {
                    ...state,
                    alerts: [
                      {
                        id: makeId("alert"),
                        title: "Novo prazo crítico",
                        dueDate: "",
                        priority: "Alta",
                        done: false,
                      },
                      ...state.alerts,
                    ],
                  },
                  "Novo alerta criado.",
                )
              }
            >
              <Plus className="size-4" />
              Novo alerta
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {state.alerts.map((item) => {
              const days = daysUntil(item.dueDate);
              const deadlineText = days === null ? "Sem data" : days < 0 ? `Vencido há ${Math.abs(days)} dia(s)` : `Faltam ${days} dia(s)`;

              return (
                <div
                  key={item.id}
                  className={`grid gap-3 rounded-3xl border p-4 xl:grid-cols-[1fr_170px_150px_170px_120px] ${alertTone(item)}`}
                >
                  <TextInput
                    value={item.title}
                    onChange={(event) =>
                      commit(
                        {
                          ...state,
                          alerts: state.alerts.map((alert) =>
                            alert.id === item.id ? { ...alert, title: event.target.value } : alert,
                          ),
                        },
                        "Alerta atualizado.",
                      )
                    }
                  />
                  <TextInput
                    type="date"
                    value={item.dueDate}
                    onChange={(event) =>
                      commit(
                        {
                          ...state,
                          alerts: state.alerts.map((alert) =>
                            alert.id === item.id ? { ...alert, dueDate: event.target.value } : alert,
                          ),
                        },
                        "Prazo atualizado.",
                      )
                    }
                  />
                  <SelectInput
                    value={item.priority}
                    onChange={(event) =>
                      commit(
                        {
                          ...state,
                          alerts: state.alerts.map((alert) =>
                            alert.id === item.id
                              ? { ...alert, priority: event.target.value as AlertItem["priority"] }
                              : alert,
                          ),
                        },
                        "Prioridade atualizada.",
                      )
                    }
                  >
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                  </SelectInput>
                  <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-sm font-black">
                    {deadlineText}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        commit(
                          {
                            ...state,
                            alerts: state.alerts.map((alert) =>
                              alert.id === item.id ? { ...alert, done: !alert.done } : alert,
                            ),
                          },
                          "Status do alerta atualizado.",
                        )
                      }
                    >
                      {item.done ? "Reabrir" : "OK"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        commit(
                          { ...state, alerts: state.alerts.filter((alert) => alert.id !== item.id) },
                          "Alerta removido.",
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "documents" ? <ProjectDocumentsVault /> : null}

      {activeTab === "reports" ? <CulturalReportWorkspace /> : null}

      {activeTab === "accountability" ? <AccountabilityEditor /> : null}

      {activeTab === "demonstratives" ? <AdministrativeDemonstratives /> : null}

    </div>
  );
}
