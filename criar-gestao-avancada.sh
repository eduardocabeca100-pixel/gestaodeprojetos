#!/usr/bin/env bash
set -e

echo "Criando backup antes de adicionar a Gestão Avançada..."
tar -czf ".backup-antes-gestao-avancada-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

echo "Criando arquivos novos sem apagar o que já existe..."
mkdir -p src/components/advanced-management
mkdir -p 'src/app/(protected)/gestao'

cat > src/components/advanced-management/advanced-management-panel.tsx <<'EOF'
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  FileText,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";

type Status = "Pendente" | "Em andamento" | "Concluído";
type Priority = "Baixa" | "Média" | "Alta";

type PendingItem = {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  priority: Priority;
  status: Status;
};

type TaskItem = {
  id: string;
  title: string;
  stage: string;
  assignee: string;
  dueDate: string;
  status: Status;
};

type RubricItem = {
  id: string;
  name: string;
  planned: string;
  paid: string;
  notes: string;
};

type AdvancedManagementData = {
  pending: PendingItem[];
  tasks: TaskItem[];
  rubrics: RubricItem[];
};

type AdvancedManagementPanelProps = {
  project: {
    id: string;
    name: string;
  };
};

const statusOptions: Status[] = ["Pendente", "Em andamento", "Concluído"];
const priorityOptions: Priority[] = ["Baixa", "Média", "Alta"];

const defaultData: AdvancedManagementData = {
  pending: [
    {
      id: "pend-contrato",
      title: "Conferir contratos da equipe",
      type: "Documentação",
      dueDate: "",
      priority: "Alta",
      status: "Pendente",
    },
    {
      id: "pend-pagamento",
      title: "Validar pagamentos em aberto",
      type: "Financeiro",
      dueDate: "",
      priority: "Média",
      status: "Em andamento",
    },
  ],
  tasks: [
    {
      id: "task-preproducao",
      title: "Revisar plano de produção",
      stage: "Pré-produção",
      assignee: "Eduardo",
      dueDate: "",
      status: "Em andamento",
    },
    {
      id: "task-relatorio",
      title: "Separar materiais para relatório",
      stage: "Prestação de contas",
      assignee: "Produção",
      dueDate: "",
      status: "Pendente",
    },
  ],
  rubrics: [
    {
      id: "rub-elenco",
      name: "Elenco",
      planned: "R$ 0,00",
      paid: "R$ 0,00",
      notes: "",
    },
    {
      id: "rub-producao",
      name: "Produção",
      planned: "R$ 0,00",
      paid: "R$ 0,00",
      notes: "",
    },
  ],
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function storageKey(projectId: string) {
  return `viva:gestao-avancada:${projectId}`;
}

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return formatBRL(Number(digits) / 100);
}

export function AdvancedManagementPanel({ project }: AdvancedManagementPanelProps) {
  const [data, setData] = useState<AdvancedManagementData>(defaultData);
  const [activeTab, setActiveTab] = useState<"pendencias" | "tarefas" | "rubricas" | "relatorio">("pendencias");

  const [pendingDraft, setPendingDraft] = useState({
    title: "",
    type: "",
    dueDate: "",
    priority: "Média" as Priority,
  });

  const [taskDraft, setTaskDraft] = useState({
    title: "",
    stage: "",
    assignee: "",
    dueDate: "",
  });

  const [rubricDraft, setRubricDraft] = useState({
    name: "",
    planned: "",
    paid: "",
    notes: "",
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey(project.id));
      if (saved) {
        setData(JSON.parse(saved) as AdvancedManagementData);
      }
    } catch {
      setData(defaultData);
    }
  }, [project.id]);

  function persist(nextData: AdvancedManagementData) {
    setData(nextData);
    window.localStorage.setItem(storageKey(project.id), JSON.stringify(nextData));
  }

  const totals = useMemo(() => {
    const planned = data.rubrics.reduce((sum, item) => sum + parseCurrency(item.planned), 0);
    const paid = data.rubrics.reduce((sum, item) => sum + parseCurrency(item.paid), 0);
    const open = Math.max(planned - paid, 0);

    return {
      planned,
      paid,
      open,
      pendingCount: data.pending.filter((item) => item.status !== "Concluído").length,
      taskCount: data.tasks.filter((item) => item.status !== "Concluído").length,
    };
  }, [data]);

  const reportText = useMemo(() => {
    const pendingLines = data.pending
      .map((item) => `- [${item.status}] ${item.title} | Tipo: ${item.type || "Não informado"} | Prioridade: ${item.priority}`)
      .join("\n");

    const taskLines = data.tasks
      .map((item) => `- [${item.status}] ${item.title} | Etapa: ${item.stage || "Não informada"} | Responsável: ${item.assignee || "Não informado"}`)
      .join("\n");

    const rubricLines = data.rubrics
      .map((item) => {
        const planned = parseCurrency(item.planned);
        const paid = parseCurrency(item.paid);
        const open = Math.max(planned - paid, 0);
        return `- ${item.name}: previsto ${item.planned || "R$ 0,00"}, pago ${item.paid || "R$ 0,00"}, em aberto ${formatBRL(open)}`;
      })
      .join("\n");

    return `RELATÓRIO AUTOMÁTICO DO PROJETO

PROJETO
${project.name}

RESUMO FINANCEIRO
Previsto: ${formatBRL(totals.planned)}
Pago: ${formatBRL(totals.paid)}
Em aberto: ${formatBRL(totals.open)}

PENDÊNCIAS
${pendingLines || "Nenhuma pendência cadastrada."}

TAREFAS
${taskLines || "Nenhuma tarefa cadastrada."}

RUBRICAS
${rubricLines || "Nenhuma rubrica cadastrada."}

Observação: relatório gerado automaticamente pelo Sistema de Gestão de Projetos da Cia de Artes Viva.`;
  }, [data, project.name, totals]);

  function addPending(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pendingDraft.title.trim()) return;

    persist({
      ...data,
      pending: [
        {
          id: createId("pending"),
          title: pendingDraft.title,
          type: pendingDraft.type,
          dueDate: pendingDraft.dueDate,
          priority: pendingDraft.priority,
          status: "Pendente",
        },
        ...data.pending,
      ],
    });

    setPendingDraft({
      title: "",
      type: "",
      dueDate: "",
      priority: "Média",
    });
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!taskDraft.title.trim()) return;

    persist({
      ...data,
      tasks: [
        {
          id: createId("task"),
          title: taskDraft.title,
          stage: taskDraft.stage,
          assignee: taskDraft.assignee,
          dueDate: taskDraft.dueDate,
          status: "Pendente",
        },
        ...data.tasks,
      ],
    });

    setTaskDraft({
      title: "",
      stage: "",
      assignee: "",
      dueDate: "",
    });
  }

  function addRubric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!rubricDraft.name.trim()) return;

    persist({
      ...data,
      rubrics: [
        {
          id: createId("rubric"),
          name: rubricDraft.name,
          planned: formatCurrencyInput(rubricDraft.planned) || "R$ 0,00",
          paid: formatCurrencyInput(rubricDraft.paid) || "R$ 0,00",
          notes: rubricDraft.notes,
        },
        ...data.rubrics,
      ],
    });

    setRubricDraft({
      name: "",
      planned: "",
      paid: "",
      notes: "",
    });
  }

  function updatePending(id: string, field: keyof PendingItem, value: string) {
    persist({
      ...data,
      pending: data.pending.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    });
  }

  function updateTask(id: string, field: keyof TaskItem, value: string) {
    persist({
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    });
  }

  function updateRubric(id: string, field: keyof RubricItem, value: string) {
    const nextValue = field === "planned" || field === "paid" ? formatCurrencyInput(value) : value;

    persist({
      ...data,
      rubrics: data.rubrics.map((item) =>
        item.id === id ? { ...item, [field]: nextValue } : item,
      ),
    });
  }

  function removePending(id: string) {
    persist({
      ...data,
      pending: data.pending.filter((item) => item.id !== id),
    });
  }

  function removeTask(id: string) {
    persist({
      ...data,
      tasks: data.tasks.filter((item) => item.id !== id),
    });
  }

  function removeRubric(id: string) {
    persist({
      ...data,
      rubrics: data.rubrics.filter((item) => item.id !== id),
    });
  }

  async function copyReport() {
    await navigator.clipboard.writeText(reportText);
    alert("Relatório copiado para a área de transferência.");
  }

  function downloadReport() {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");

    element.href = url;
    element.download = `relatorio-${project.name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    element.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-white to-slate-50 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-600">
                Gestão avançada
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Central do projeto
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Controle pendências, tarefas, rubricas e gere um relatório automático para o projeto {project.name}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard icon={AlertTriangle} title="Pendências" value={String(totals.pendingCount)} />
              <SummaryCard icon={ClipboardList} title="Tarefas" value={String(totals.taskCount)} />
              <SummaryCard icon={Wallet} title="Pago" value={formatBRL(totals.paid)} />
              <SummaryCard icon={FileText} title="Em aberto" value={formatBRL(totals.open)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
          <TabButton active={activeTab === "pendencias"} onClick={() => setActiveTab("pendencias")}>
            Pendências
          </TabButton>
          <TabButton active={activeTab === "tarefas"} onClick={() => setActiveTab("tarefas")}>
            Tarefas
          </TabButton>
          <TabButton active={activeTab === "rubricas"} onClick={() => setActiveTab("rubricas")}>
            Rubricas
          </TabButton>
          <TabButton active={activeTab === "relatorio"} onClick={() => setActiveTab("relatorio")}>
            Relatório automático
          </TabButton>
        </div>
      </section>

      {activeTab === "pendencias" ? (
        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={addPending} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <PanelTitle title="Nova pendência" description="Cadastre algo que precisa de atenção." />

            <div className="space-y-4">
              <InputLine label="Descrição">
                <input
                  value={pendingDraft.title}
                  onChange={(event) => setPendingDraft({ ...pendingDraft, title: event.target.value })}
                  className="viva-input"
                  placeholder="Ex: Anexar contrato da Júlia"
                />
              </InputLine>

              <InputLine label="Tipo">
                <input
                  value={pendingDraft.type}
                  onChange={(event) => setPendingDraft({ ...pendingDraft, type: event.target.value })}
                  className="viva-input"
                  placeholder="Documentação, financeiro, equipe..."
                />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="Prazo">
                  <input
                    type="date"
                    value={pendingDraft.dueDate}
                    onChange={(event) => setPendingDraft({ ...pendingDraft, dueDate: event.target.value })}
                    className="viva-input"
                  />
                </InputLine>

                <InputLine label="Prioridade">
                  <select
                    value={pendingDraft.priority}
                    onChange={(event) => setPendingDraft({ ...pendingDraft, priority: event.target.value as Priority })}
                    className="viva-input"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </InputLine>
              </div>

              <button type="submit" className="viva-button">
                <Plus className="size-4" />
                Adicionar pendência
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {data.pending.map((item) => (
              <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_auto]">
                  <input
                    value={item.title}
                    onChange={(event) => updatePending(item.id, "title", event.target.value)}
                    className="viva-input"
                  />
                  <input
                    value={item.type}
                    onChange={(event) => updatePending(item.id, "type", event.target.value)}
                    className="viva-input"
                  />
                  <select
                    value={item.priority}
                    onChange={(event) => updatePending(item.id, "priority", event.target.value)}
                    className="viva-input"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                  <select
                    value={item.status}
                    onChange={(event) => updatePending(item.id, "status", event.target.value)}
                    className="viva-input"
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removePending(item.id)} className="viva-danger-button">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "tarefas" ? (
        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={addTask} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <PanelTitle title="Nova tarefa" description="Organize ações por etapa do projeto." />

            <div className="space-y-4">
              <InputLine label="Tarefa">
                <input
                  value={taskDraft.title}
                  onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })}
                  className="viva-input"
                  placeholder="Ex: Revisar orçamento"
                />
              </InputLine>

              <InputLine label="Etapa">
                <input
                  value={taskDraft.stage}
                  onChange={(event) => setTaskDraft({ ...taskDraft, stage: event.target.value })}
                  className="viva-input"
                  placeholder="Pré-produção, execução, prestação..."
                />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="Responsável">
                  <input
                    value={taskDraft.assignee}
                    onChange={(event) => setTaskDraft({ ...taskDraft, assignee: event.target.value })}
                    className="viva-input"
                    placeholder="Nome"
                  />
                </InputLine>

                <InputLine label="Prazo">
                  <input
                    type="date"
                    value={taskDraft.dueDate}
                    onChange={(event) => setTaskDraft({ ...taskDraft, dueDate: event.target.value })}
                    className="viva-input"
                  />
                </InputLine>
              </div>

              <button type="submit" className="viva-button">
                <Plus className="size-4" />
                Adicionar tarefa
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {data.tasks.map((item) => (
              <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_auto]">
                  <input
                    value={item.title}
                    onChange={(event) => updateTask(item.id, "title", event.target.value)}
                    className="viva-input"
                  />
                  <input
                    value={item.stage}
                    onChange={(event) => updateTask(item.id, "stage", event.target.value)}
                    className="viva-input"
                  />
                  <input
                    value={item.assignee}
                    onChange={(event) => updateTask(item.id, "assignee", event.target.value)}
                    className="viva-input"
                  />
                  <select
                    value={item.status}
                    onChange={(event) => updateTask(item.id, "status", event.target.value)}
                    className="viva-input"
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeTask(item.id)} className="viva-danger-button">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "rubricas" ? (
        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={addRubric} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <PanelTitle title="Nova rubrica" description="Controle previsto, pago e saldo." />

            <div className="space-y-4">
              <InputLine label="Nome da rubrica">
                <input
                  value={rubricDraft.name}
                  onChange={(event) => setRubricDraft({ ...rubricDraft, name: event.target.value })}
                  className="viva-input"
                  placeholder="Elenco, figurino, divulgação..."
                />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="Previsto">
                  <input
                    value={rubricDraft.planned}
                    onChange={(event) => setRubricDraft({ ...rubricDraft, planned: formatCurrencyInput(event.target.value) })}
                    className="viva-input"
                    placeholder="R$ 0,00"
                  />
                </InputLine>

                <InputLine label="Pago">
                  <input
                    value={rubricDraft.paid}
                    onChange={(event) => setRubricDraft({ ...rubricDraft, paid: formatCurrencyInput(event.target.value) })}
                    className="viva-input"
                    placeholder="R$ 0,00"
                  />
                </InputLine>
              </div>

              <InputLine label="Observações">
                <textarea
                  value={rubricDraft.notes}
                  onChange={(event) => setRubricDraft({ ...rubricDraft, notes: event.target.value })}
                  className="viva-input min-h-24"
                  placeholder="Detalhes sobre a rubrica..."
                />
              </InputLine>

              <button type="submit" className="viva-button">
                <Plus className="size-4" />
                Adicionar rubrica
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {data.rubrics.map((item) => {
              const planned = parseCurrency(item.planned);
              const paid = parseCurrency(item.paid);
              const open = Math.max(planned - paid, 0);

              return (
                <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_auto]">
                    <input
                      value={item.name}
                      onChange={(event) => updateRubric(item.id, "name", event.target.value)}
                      className="viva-input"
                    />
                    <input
                      value={item.planned}
                      onChange={(event) => updateRubric(item.id, "planned", event.target.value)}
                      className="viva-input"
                    />
                    <input
                      value={item.paid}
                      onChange={(event) => updateRubric(item.id, "paid", event.target.value)}
                      className="viva-input"
                    />
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">
                      {formatBRL(open)}
                    </div>
                    <button type="button" onClick={() => removeRubric(item.id)} className="viva-danger-button">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {activeTab === "relatorio" ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PanelTitle title="Relatório automático" description="Copie ou baixe um resumo do projeto." />

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyReport} className="viva-button-secondary">
                <Copy className="size-4" />
                Copiar
              </button>
              <button type="button" onClick={downloadReport} className="viva-button">
                <Download className="size-4" />
                Baixar TXT
              </button>
            </div>
          </div>

          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-sm leading-7 text-slate-100">
            {reportText}
          </pre>
        </section>
      ) : null}

      <style jsx global>{`
        .viva-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .viva-input:focus {
          border-color: rgb(124 58 237);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.08);
        }

        .viva-button,
        .viva-button-secondary,
        .viva-danger-button {
          display: inline-flex;
          min-height: 2.75rem;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 1rem;
          padding: 0 1rem;
          font-size: 0.875rem;
          font-weight: 900;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .viva-button:hover,
        .viva-button-secondary:hover,
        .viva-danger-button:hover {
          transform: translateY(-1px);
        }

        .viva-button {
          background: linear-gradient(135deg, rgb(124 58 237), rgb(79 70 229));
          color: white;
        }

        .viva-button-secondary {
          border: 1px solid rgb(226 232 240);
          background: white;
          color: rgb(51 65 85);
        }

        .viva-danger-button {
          background: rgb(220 38 38);
          color: white;
        }
      `}</style>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof AlertTriangle;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
        <Icon className="size-4" />
      </div>
      <strong className="block text-sm font-black text-slate-950">{value}</strong>
      <span className="text-xs font-semibold text-slate-500">{title}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
        active
          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function PanelTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function InputLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
EOF

cat > 'src/app/(protected)/gestao/page.tsx' <<'EOF'
import { AdvancedManagementPanel } from "@/components/advanced-management/advanced-management-panel";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";

export default async function AdvancedManagementPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);

  return (
    <PageContainer
      title="Gestão"
      description="Central de pendências, tarefas, rubricas e relatório automático do projeto."
    >
      <div className="space-y-6">
        <ProjectScopeBanner project={project} />
        <AdvancedManagementPanel project={{ id: project.id, name: project.name }} />
      </div>
    </PageContainer>
  );
}
EOF

echo "Adicionando item Gestão no menu lateral, sem remover nenhum item existente..."
python3 - <<'PY'
from pathlib import Path

sidebar = Path("src/components/layout/app-sidebar.tsx")

if not sidebar.exists():
    print("AVISO: app-sidebar.tsx não encontrado. A página /gestao foi criada, mas o menu não foi alterado.")
    raise SystemExit(0)

text = sidebar.read_text()

if 'href: "/gestao"' not in text:
    target = '{ label: "Relatórios", href: "/relatorios", icon: BarChart3, projectScoped: true },'
    insert = '{ label: "Gestão", href: "/gestao", icon: ClipboardList, projectScoped: true }, '
    if target in text:
        text = text.replace(target, insert + target)
    else:
        print("AVISO: não encontrei o ponto exato para inserir no menu. A rota /gestao existe, mas talvez precise adicionar o link manualmente.")

sidebar.write_text(text)
PY

echo "Removendo styled-jsx do componente para evitar erro no Next..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/advanced-management/advanced-management-panel.tsx")
text = path.read_text()

text = text.replace('''      <style jsx global>{`
        .viva-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .viva-input:focus {
          border-color: rgb(124 58 237);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.08);
        }

        .viva-button,
        .viva-button-secondary,
        .viva-danger-button {
          display: inline-flex;
          min-height: 2.75rem;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 1rem;
          padding: 0 1rem;
          font-size: 0.875rem;
          font-weight: 900;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .viva-button:hover,
        .viva-button-secondary:hover,
        .viva-danger-button:hover {
          transform: translateY(-1px);
        }

        .viva-button {
          background: linear-gradient(135deg, rgb(124 58 237), rgb(79 70 229));
          color: white;
        }

        .viva-button-secondary {
          border: 1px solid rgb(226 232 240);
          background: white;
          color: rgb(51 65 85);
        }

        .viva-danger-button {
          background: rgb(220 38 38);
          color: white;
        }
      `}</style>''', "")

text = text.replace(
'className="viva-input"',
'className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"'
)

text = text.replace(
'className="viva-input min-h-24"',
'className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"'
)

text = text.replace(
'className="viva-button"',
'className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5"'
)

text = text.replace(
'className="viva-button-secondary"',
'className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"'
)

text = text.replace(
'className="viva-danger-button"',
'className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-black text-white transition hover:-translate-y-0.5"'
)

path.write_text(text)
PY

echo "Protegendo arquivos sensíveis..."
touch .gitignore
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF "node_modules" .gitignore || echo "node_modules" >> .gitignore
grep -qxF ".next" .gitignore || echo ".next" >> .gitignore
grep -qxF "dist" .gitignore || echo "dist" >> .gitignore

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  git rm --cached .env
fi

if git ls-files --error-unmatch .env.local >/dev/null 2>&1; then
  git rm --cached .env.local
fi

echo "Verificando se não ficou firebase/auth nem styled-jsx indevido..."
if grep -R "firebase/auth" -n src 2>/dev/null; then
  echo "ERRO: ainda existe firebase/auth dentro de src."
  exit 1
fi

if grep -R "style jsx" -n src 2>/dev/null; then
  echo "ERRO: ainda existe style jsx dentro de src."
  exit 1
fi

echo "Rodando build..."
npm run build

echo "Conferindo criação da nova gestão..."
grep -R "AdvancedManagementPanel" -n src/components/advanced-management/advanced-management-panel.tsx 'src/app/(protected)/gestao/page.tsx'
grep -R 'href: "/gestao"' -n src/components/layout/app-sidebar.tsx || true

echo "Status:"
git status --short

git add src/components/advanced-management 'src/app/(protected)/gestao' src/components/layout/app-sidebar.tsx .gitignore package.json package-lock.json
git commit -m "Adiciona central de gestao avancada do projeto" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Abra /gestao no painel."
