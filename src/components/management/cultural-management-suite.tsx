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
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSignature,
  FileText,
  FolderCheck,
  Plus,
  ReceiptText,
  RotateCcw,
  Trash2,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";

type IconComponent = ComponentType<{ className?: string }>;

type TabKey =
  | "dashboard"
  | "alerts"
  | "documents"
  | "reports"
  | "finance"
  | "contracts"
  | "accountability";

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
};

type RubricItem = {
  id: string;
  name: string;
  approved: number;
  executed: number;
};

type ContractItem = {
  id: string;
  person: string;
  role: string;
  type: "Contrato" | "Recibo" | "Termo";
  status: "Rascunho" | "Gerado" | "Assinado";
};

type AccountabilityItem = {
  id: string;
  title: string;
  done: boolean;
};

type ReportDraft = {
  projectName: string;
  period: string;
  audience: string;
  activities: string;
  results: string;
  evidence: string;
};

type SuiteState = {
  alerts: AlertItem[];
  documents: ProjectDocument[];
  rubrics: RubricItem[];
  contracts: ContractItem[];
  accountability: AccountabilityItem[];
  report: ReportDraft;
};

const storageKey = "viva:central-cultural:v1";

const defaultState: SuiteState = {
  alerts: [
    {
      id: "alert-habilitacao",
      title: "Conferir documentos de habilitação",
      dueDate: new Date().toISOString().slice(0, 10),
      priority: "Alta",
      done: false,
    },
    {
      id: "alert-relatorio",
      title: "Separar fotos, listas e comprovantes para relatório",
      dueDate: "2026-12-31",
      priority: "Média",
      done: false,
    },
  ],
  documents: [
    {
      id: "doc-cnpj",
      name: "Cartão CNPJ / comprovante MEI",
      category: "Proponente",
      status: "Pendente",
    },
    {
      id: "doc-certidoes",
      name: "Certidões negativas",
      category: "Habilitação",
      status: "Pendente",
    },
  ],
  rubrics: [
    {
      id: "rub-formadores",
      name: "Formadores / oficineiros",
      approved: 8000,
      executed: 0,
    },
    {
      id: "rub-divulgacao",
      name: "Divulgação",
      approved: 1500,
      executed: 0,
    },
  ],
  contracts: [
    {
      id: "contract-modelo",
      person: "Nome da pessoa",
      role: "Função no projeto",
      type: "Contrato",
      status: "Rascunho",
    },
  ],
  accountability: [
    { id: "acc-relatorio", title: "Relatório narrativo preenchido", done: false },
    { id: "acc-fotos", title: "Fotos e vídeos organizados", done: false },
    { id: "acc-presenca", title: "Listas de presença anexadas", done: false },
    { id: "acc-comprovantes", title: "Comprovantes financeiros anexados", done: false },
    { id: "acc-divulgacao", title: "Prints e materiais de divulgação salvos", done: false },
  ],
  report: {
    projectName: "Nome do projeto",
    period: "Período de execução",
    audience: "Público alcançado",
    activities: "Descreva as ações realizadas.",
    results: "Descreva os resultados culturais, sociais e formativos.",
    evidence: "Liste fotos, vídeos, listas de presença, links e comprovantes.",
  },
};

const tabs: Array<{ key: TabKey; label: string; icon: IconComponent }> = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "alerts", label: "Alertas", icon: CalendarClock },
  { key: "documents", label: "Documentos", icon: FolderCheck },
  { key: "reports", label: "Relatório", icon: FileText },
  { key: "finance", label: "Rubricas", icon: Wallet },
  { key: "contracts", label: "Contratos", icon: FileSignature },
  { key: "accountability", label: "Prestação", icon: ClipboardCheck },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function readState(): SuiteState {
  if (typeof window === "undefined") return defaultState;

  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? { ...defaultState, ...(JSON.parse(saved) as SuiteState) } : defaultState;
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

function urgencyClass(date: string, done = false) {
  if (done) return "border-emerald-200 bg-emerald-50 text-emerald-700";

  const days = daysUntil(date);

  if (days === null) return "border-slate-200 bg-white text-slate-700";
  if (days < 0) return "border-red-200 bg-red-50 text-red-700";
  if (days <= 7) return "border-amber-200 bg-amber-50 text-amber-800";

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function statusClass(status: string) {
  if (["Aprovado", "Assinado", "Gerado"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Enviado") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "Precisa corrigir") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
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
          ? "flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white shadow-lg shadow-primary/20"
          : "flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      }
    >
      <Icon className="size-4" />
      {tab.label}
    </button>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: IconComponent;
}) {
  return (
    <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="size-6" />
        </div>
      </div>
    </div>
  );
}

export function CulturalManagementSuite() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [state, setState] = useState<SuiteState>(defaultState);
  const [clientReady, setClientReady] = useState(false);
  const [message, setMessage] = useState("Central pronta para gestão dos projetos culturais.");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setState(readState());
      setClientReady(true);
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  function commit(next: SuiteState, nextMessage = "Alteração salva.") {
    setState(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setMessage(nextMessage);
  }

  const totals = useMemo(() => {
    const approved = state.rubrics.reduce((sum, item) => sum + item.approved, 0);
    const executed = state.rubrics.reduce((sum, item) => sum + item.executed, 0);
    const pendingDocs = state.documents.filter((item) => item.status !== "Aprovado").length;
    const pendingAlerts = state.alerts.filter((item) => !item.done).length;
    const doneAccountability = state.accountability.filter((item) => item.done).length;
    const accountabilityPercent = state.accountability.length
      ? Math.round((doneAccountability / state.accountability.length) * 100)
      : 0;

    return {
      approved,
      executed,
      remaining: approved - executed,
      pendingDocs,
      pendingAlerts,
      accountabilityPercent,
    };
  }, [state]);

  const generatedReport = useMemo(
    () =>
      `RELATÓRIO DE EXECUÇÃO CULTURAL

Projeto: ${state.report.projectName}
Período: ${state.report.period}
Público alcançado: ${state.report.audience}

AÇÕES REALIZADAS
${state.report.activities}

RESULTADOS ALCANÇADOS
${state.report.results}

COMPROVAÇÕES E EVIDÊNCIAS
${state.report.evidence}

RESUMO FINANCEIRO
Valor aprovado: ${formatCurrency(totals.approved)}
Valor executado: ${formatCurrency(totals.executed)}
Saldo: ${formatCurrency(totals.remaining)}
`,
    [state.report, totals.approved, totals.executed, totals.remaining],
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
      <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Módulos 2, 3, 4, 6, 7, 10 e 13
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Central Cultural da Cia Viva
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Alertas, documentos, relatório, rubricas, contratos, prestação de contas e painel geral.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadText("relatorio-execucao-cultural.txt", generatedReport)}
            >
              <Download className="size-4" />
              Baixar relatório
            </Button>

            <Button
              type="button"
              variant="outline"
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

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
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
            <MetricCard label="Aprovado" value={formatCurrency(totals.approved)} helper="Total das rubricas" icon={Wallet} />
            <MetricCard label="Executado" value={formatCurrency(totals.executed)} helper="Gastos lançados" icon={ReceiptText} />
            <MetricCard label="Saldo" value={formatCurrency(totals.remaining)} helper="Disponível estimado" icon={BarChart3} />
            <MetricCard label="Alertas" value={String(totals.pendingAlerts)} helper="Pendências abertas" icon={AlertTriangle} />
            <MetricCard label="Documentos" value={String(totals.pendingDocs)} helper="Não aprovados" icon={FolderCheck} />
            <MetricCard label="Prestação" value={`${totals.accountabilityPercent}%`} helper="Checklist concluído" icon={ClipboardCheck} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Próximas pendências</h3>
              <div className="mt-4 space-y-3">
                {state.alerts.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-3 text-sm ${urgencyClass(item.dueDate, item.done)}`}
                  >
                    <p className="font-black">{item.title}</p>
                    <p className="mt-1 text-xs">
                      Prazo: {item.dueDate || "sem data"} • Prioridade: {item.priority}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Resumo da prestação</h3>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${totals.accountabilityPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {totals.accountabilityPercent}% concluído
              </p>
              <div className="mt-4 grid gap-2">
                {state.accountability.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className={item.done ? "size-4 text-emerald-600" : "size-4 text-slate-300"} />
                    {item.title}
                  </div>
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
                Controle datas de edital, certidões, execução e prestação de contas.
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
                        title: "Novo prazo",
                        dueDate: "",
                        priority: "Média",
                        done: false,
                      },
                      ...state.alerts,
                    ],
                  },
                  "Alerta criado.",
                )
              }
            >
              <Plus className="size-4" />
              Novo alerta
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {state.alerts.map((item) => (
              <div
                key={item.id}
                className={`grid gap-3 rounded-2xl border p-4 lg:grid-cols-[1fr_170px_150px_120px] ${urgencyClass(item.dueDate, item.done)}`}
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
                        "Status atualizado.",
                      )
                    }
                  >
                    {item.done ? "Reabrir" : "Concluir"}
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
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "documents" ? (
        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Documentos por projeto</h3>
              <p className="text-sm text-slate-500">Cada projeto deve ter sua própria lista de documentos.</p>
            </div>
            <Button
              type="button"
              onClick={() =>
                commit(
                  {
                    ...state,
                    documents: [
                      {
                        id: makeId("doc"),
                        name: "Novo documento",
                        category: "Geral",
                        status: "Pendente",
                      },
                      ...state.documents,
                    ],
                  },
                  "Documento criado.",
                )
              }
            >
              <Plus className="size-4" />
              Novo documento
            </Button>
          </div>

          <div className="mt-5 grid gap-3">
            {state.documents.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1fr_170px_180px_150px_44px]"
              >
                <TextInput
                  value={item.name}
                  onChange={(event) =>
                    commit(
                      {
                        ...state,
                        documents: state.documents.map((doc) =>
                          doc.id === item.id ? { ...doc, name: event.target.value } : doc,
                        ),
                      },
                      "Documento atualizado.",
                    )
                  }
                />
                <TextInput
                  value={item.category}
                  onChange={(event) =>
                    commit(
                      {
                        ...state,
                        documents: state.documents.map((doc) =>
                          doc.id === item.id ? { ...doc, category: event.target.value } : doc,
                        ),
                      },
                      "Categoria atualizada.",
                    )
                  }
                />
                <SelectInput
                  value={item.status}
                  onChange={(event) =>
                    commit(
                      {
                        ...state,
                        documents: state.documents.map((doc) =>
                          doc.id === item.id
                            ? { ...doc, status: event.target.value as ProjectDocument["status"] }
                            : doc,
                        ),
                      },
                      "Status atualizado.",
                    )
                  }
                >
                  <option>Pendente</option>
                  <option>Enviado</option>
                  <option>Aprovado</option>
                  <option>Precisa corrigir</option>
                </SelectInput>
                <div className={`rounded-xl border px-3 py-2 text-xs font-black ${statusClass(item.status)}`}>
                  {item.status}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    commit(
                      { ...state, documents: state.documents.filter((doc) => doc.id !== item.id) },
                      "Documento removido.",
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Gerador de relatório de execução</h3>
            <div className="mt-5 grid gap-4">
              <Field label="Projeto">
                <TextInput
                  value={state.report.projectName}
                  onChange={(event) =>
                    commit({ ...state, report: { ...state.report, projectName: event.target.value } }, "Relatório atualizado.")
                  }
                />
              </Field>
              <Field label="Período">
                <TextInput
                  value={state.report.period}
                  onChange={(event) =>
                    commit({ ...state, report: { ...state.report, period: event.target.value } }, "Relatório atualizado.")
                  }
                />
              </Field>
              <Field label="Público">
                <TextInput
                  value={state.report.audience}
                  onChange={(event) =>
                    commit({ ...state, report: { ...state.report, audience: event.target.value } }, "Relatório atualizado.")
                  }
                />
              </Field>
              <Field label="Ações realizadas">
                <TextArea
                  value={state.report.activities}
                  onChange={(event) =>
                    commit({ ...state, report: { ...state.report, activities: event.target.value } }, "Relatório atualizado.")
                  }
                />
              </Field>
              <Field label="Resultados">
                <TextArea
                  value={state.report.results}
                  onChange={(event) =>
                    commit({ ...state, report: { ...state.report, results: event.target.value } }, "Relatório atualizado.")
                  }
                />
              </Field>
              <Field label="Comprovações">
                <TextArea
                  value={state.report.evidence}
                  onChange={(event) =>
                    commit({ ...state, report: { ...state.report, evidence: event.target.value } }, "Relatório atualizado.")
                  }
                />
              </Field>
            </div>
          </div>

          <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-black text-slate-950">Prévia copiável</h3>
              <Button
                type="button"
                onClick={() => downloadText("relatorio-execucao-cultural.txt", generatedReport)}
              >
                <Download className="size-4" />
                Baixar TXT
              </Button>
            </div>
            <pre className="mt-5 max-h-[620px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-950 p-5 text-sm leading-6 text-white">
              {generatedReport}
            </pre>
          </div>
        </div>
      ) : null}

      {activeTab === "finance" ? (
        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Controle financeiro por rubrica</h3>
              <p className="text-sm text-slate-500">Acompanhe valor aprovado, executado e saldo.</p>
            </div>
            <Button
              type="button"
              onClick={() =>
                commit(
                  {
                    ...state,
                    rubrics: [{ id: makeId("rub"), name: "Nova rubrica", approved: 0, executed: 0 }, ...state.rubrics],
                  },
                  "Rubrica criada.",
                )
              }
            >
              <Plus className="size-4" />
              Nova rubrica
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {state.rubrics.map((item) => {
              const percent =
                item.approved > 0 ? Math.min(100, Math.round((item.executed / item.approved) * 100)) : 0;

              return (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 xl:grid-cols-[1fr_170px_170px_170px_44px]">
                    <TextInput
                      value={item.name}
                      onChange={(event) =>
                        commit(
                          {
                            ...state,
                            rubrics: state.rubrics.map((rubric) =>
                              rubric.id === item.id ? { ...rubric, name: event.target.value } : rubric,
                            ),
                          },
                          "Rubrica atualizada.",
                        )
                      }
                    />
                    <TextInput
                      type="number"
                      value={item.approved}
                      onChange={(event) =>
                        commit(
                          {
                            ...state,
                            rubrics: state.rubrics.map((rubric) =>
                              rubric.id === item.id ? { ...rubric, approved: Number(event.target.value) } : rubric,
                            ),
                          },
                          "Valor aprovado atualizado.",
                        )
                      }
                    />
                    <TextInput
                      type="number"
                      value={item.executed}
                      onChange={(event) =>
                        commit(
                          {
                            ...state,
                            rubrics: state.rubrics.map((rubric) =>
                              rubric.id === item.id ? { ...rubric, executed: Number(event.target.value) } : rubric,
                            ),
                          },
                          "Valor executado atualizado.",
                        )
                      }
                    />
                    <div className="rounded-xl border border-white bg-white px-3 py-2 text-sm font-black text-slate-700">
                      Saldo: {formatCurrency(item.approved - item.executed)}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        commit(
                          { ...state, rubrics: state.rubrics.filter((rubric) => rubric.id !== item.id) },
                          "Rubrica removida.",
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className={item.executed > item.approved ? "h-full bg-red-500" : "h-full bg-primary"}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {item.executed > item.approved ? (
                    <p className="mt-2 text-xs font-bold text-red-700">
                      Alerta: executado acima do aprovado.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "contracts" ? (
        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Contratos, recibos e termos</h3>
              <p className="text-sm text-slate-500">Gere minutas simples para assinatura e organização.</p>
            </div>
            <Button
              type="button"
              onClick={() =>
                commit(
                  {
                    ...state,
                    contracts: [
                      { id: makeId("contract"), person: "Pessoa", role: "Função", type: "Contrato", status: "Rascunho" },
                      ...state.contracts,
                    ],
                  },
                  "Documento contratual criado.",
                )
              }
            >
              <Plus className="size-4" />
              Novo contrato/recibo
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {state.contracts.map((item) => {
              const text = `${item.type.toUpperCase()}

Pessoa: ${item.person}
Função: ${item.role}
Status: ${item.status}

Declaro, para fins de organização do projeto cultural, que as informações acima serão conferidas antes da assinatura final.`;

              return (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 xl:grid-cols-[1fr_1fr_150px_150px_120px_44px]">
                    <TextInput
                      value={item.person}
                      onChange={(event) =>
                        commit(
                          {
                            ...state,
                            contracts: state.contracts.map((contract) =>
                              contract.id === item.id ? { ...contract, person: event.target.value } : contract,
                            ),
                          },
                          "Pessoa atualizada.",
                        )
                      }
                    />
                    <TextInput
                      value={item.role}
                      onChange={(event) =>
                        commit(
                          {
                            ...state,
                            contracts: state.contracts.map((contract) =>
                              contract.id === item.id ? { ...contract, role: event.target.value } : contract,
                            ),
                          },
                          "Função atualizada.",
                        )
                      }
                    />
                    <SelectInput
                      value={item.type}
                      onChange={(event) =>
                        commit(
                          {
                            ...state,
                            contracts: state.contracts.map((contract) =>
                              contract.id === item.id
                                ? { ...contract, type: event.target.value as ContractItem["type"] }
                                : contract,
                            ),
                          },
                          "Tipo atualizado.",
                        )
                      }
                    >
                      <option>Contrato</option>
                      <option>Recibo</option>
                      <option>Termo</option>
                    </SelectInput>
                    <SelectInput
                      value={item.status}
                      onChange={(event) =>
                        commit(
                          {
                            ...state,
                            contracts: state.contracts.map((contract) =>
                              contract.id === item.id
                                ? { ...contract, status: event.target.value as ContractItem["status"] }
                                : contract,
                            ),
                          },
                          "Status atualizado.",
                        )
                      }
                    >
                      <option>Rascunho</option>
                      <option>Gerado</option>
                      <option>Assinado</option>
                    </SelectInput>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => downloadText(`${item.type.toLowerCase()}-${item.person || "pessoa"}.txt`, text)}
                    >
                      Gerar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        commit(
                          { ...state, contracts: state.contracts.filter((contract) => contract.id !== item.id) },
                          "Contrato removido.",
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

      {activeTab === "accountability" ? (
        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Painel de prestação de contas</h3>
              <p className="text-sm text-slate-500">Checklist final de comprovação física, financeira e narrativa.</p>
            </div>
            <Button
              type="button"
              onClick={() =>
                commit(
                  {
                    ...state,
                    accountability: [{ id: makeId("acc"), title: "Nova pendência", done: false }, ...state.accountability],
                  },
                  "Item criado.",
                )
              }
            >
              <Plus className="size-4" />
              Novo item
            </Button>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${totals.accountabilityPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-600">
            {totals.accountabilityPercent}% concluído
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {state.accountability.map((item) => (
              <div
                key={item.id}
                className={
                  item.done
                    ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                    : "rounded-2xl border border-slate-200 bg-slate-50 p-4"
                }
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      commit(
                        {
                          ...state,
                          accountability: state.accountability.map((acc) =>
                            acc.id === item.id ? { ...acc, done: !acc.done } : acc,
                          ),
                        },
                        "Prestação atualizada.",
                      )
                    }
                    className="mt-2 size-4"
                  />
                  <TextInput
                    value={item.title}
                    onChange={(event) =>
                      commit(
                        {
                          ...state,
                          accountability: state.accountability.map((acc) =>
                            acc.id === item.id ? { ...acc, title: event.target.value } : acc,
                          ),
                        },
                        "Item atualizado.",
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      commit(
                        { ...state, accountability: state.accountability.filter((acc) => acc.id !== item.id) },
                        "Item removido.",
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
