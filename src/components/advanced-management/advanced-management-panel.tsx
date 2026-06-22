"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Copy,
  Download,
  FileText,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { openSystemPdf } from "@/lib/pdf/pdf-template";
import { useClientReady } from "@/lib/use-client-ready";

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
  category: string;
  name: string;
  unit: string;
  quantity: string;
  paymentBasis: string;
  approved: string;
  executed: string;
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

const emptyData: AdvancedManagementData = {
  pending: [],
  tasks: [],
  rubrics: [],
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
  const digits = String(value ?? "").replace(/\D/g, "");
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
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return formatBRL(Number(digits) / 100);
}

function normalizeRubric(item: Partial<RubricItem> & { planned?: string; paid?: string }): RubricItem {
  return {
    id: item.id || createId("rubric"),
    category: item.category || "Sem categoria",
    name: item.name || "Rubrica sem nome",
    unit: item.unit || "01",
    quantity: item.quantity || "01",
    paymentBasis: item.paymentBasis || "Por projeto",
    approved: item.approved || item.planned || "R$ 0,00",
    executed: item.executed || item.paid || "R$ 0,00",
    notes: item.notes || "",
  };
}

function normalizeData(input: Partial<AdvancedManagementData>): AdvancedManagementData {
  return {
    pending: Array.isArray(input.pending) ? input.pending : [],
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    rubrics: Array.isArray(input.rubrics) ? input.rubrics.map(normalizeRubric) : [],
  };
}

export function AdvancedManagementPanel({ project }: AdvancedManagementPanelProps) {
  const isClient = useClientReady();

  if (!isClient) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando gestão avançada do projeto...
      </div>
    );
  }

  return <AdvancedManagementPanelContent key={project.id} project={project} />;
}

function readStoredData(projectId: string) {
  if (typeof window === "undefined") {
    return emptyData;
  }

  try {
    const saved = window.localStorage.getItem(storageKey(projectId));
    return saved ? normalizeData(JSON.parse(saved)) : emptyData;
  } catch {
    return emptyData;
  }
}

function AdvancedManagementPanelContent({ project }: AdvancedManagementPanelProps) {
  const [data, setData] = useState<AdvancedManagementData>(() => readStoredData(project.id));
  const [activeTab, setActiveTab] = useState<"pendencias" | "tarefas" | "rubricas" | "relatorio">("rubricas");

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
    category: "",
    name: "",
    unit: "",
    quantity: "",
    paymentBasis: "",
    approved: "",
    executed: "",
    notes: "",
  });

  function persist(nextData: AdvancedManagementData) {
    const normalized = normalizeData(nextData);
    setData(normalized);
    window.localStorage.setItem(storageKey(project.id), JSON.stringify(normalized));
  }

  const totals = useMemo(() => {
    const approved = data.rubrics.reduce((sum, item) => sum + parseCurrency(item.approved), 0);
    const executed = data.rubrics.reduce((sum, item) => sum + parseCurrency(item.executed), 0);
    const open = Math.max(approved - executed, 0);

    return {
      approved,
      executed,
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
        const approved = parseCurrency(item.approved);
        const executed = parseCurrency(item.executed);
        const balance = Math.max(approved - executed, 0);
        return `- ${item.category} | ${item.name}: unidade ${item.unit}, quantidade ${item.quantity}, pagamento ${item.paymentBasis}, aprovado ${item.approved}, executado ${item.executed}, saldo ${formatBRL(balance)}`;
      })
      .join("\n");

    return `RELATÓRIO AUTOMÁTICO DO PROJETO

PROJETO
${project.name}

RESUMO FINANCEIRO
Aprovado: ${formatBRL(totals.approved)}
Executado: ${formatBRL(totals.executed)}
Saldo: ${formatBRL(totals.open)}

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
        normalizeRubric({
          id: createId("rubric"),
          category: rubricDraft.category || "Sem categoria",
          name: rubricDraft.name,
          unit: rubricDraft.unit || "01",
          quantity: rubricDraft.quantity || "01",
          paymentBasis: rubricDraft.paymentBasis || "Por projeto",
          approved: formatCurrencyInput(rubricDraft.approved) || "R$ 0,00",
          executed: formatCurrencyInput(rubricDraft.executed) || "R$ 0,00",
          notes: rubricDraft.notes,
        }),
        ...data.rubrics,
      ],
    });

    setRubricDraft({
      category: "",
      name: "",
      unit: "",
      quantity: "",
      paymentBasis: "",
      approved: "",
      executed: "",
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
    const nextValue = field === "approved" || field === "executed" ? formatCurrencyInput(value) : value;

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

  function downloadPdfReport() {
    const bodyHtml = `
      <h2>Resumo financeiro</h2>
      <table>
        <thead>
          <tr>
            <th>Indicador</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Aprovado</td><td>${formatBRL(totals.approved)}</td></tr>
          <tr><td>Executado</td><td>${formatBRL(totals.executed)}</td></tr>
          <tr><td>Saldo</td><td>${formatBRL(totals.open)}</td></tr>
        </tbody>
      </table>

      <h2>Rubricas</h2>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Rubrica</th>
            <th>Unidade</th>
            <th>Qtd.</th>
            <th>Pagamento</th>
            <th>Aprovado</th>
            <th>Executado</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.rubrics.length
              ? data.rubrics.map((item) => {
                const approved = parseCurrency(item.approved);
                const executed = parseCurrency(item.executed);
                const balance = Math.max(approved - executed, 0);

                return `
                  <tr>
                    <td>${item.category}</td>
                    <td>${item.name}</td>
                    <td>${item.unit}</td>
                    <td>${item.quantity}</td>
                    <td>${item.paymentBasis}</td>
                    <td>${item.approved}</td>
                    <td>${item.executed}</td>
                    <td>${formatBRL(balance)}</td>
                  </tr>
                `;
              }).join("")
              : `<tr><td colspan="8">Nenhuma rubrica cadastrada.</td></tr>`
          }
        </tbody>
      </table>

      <h2>Pendências</h2>
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Tipo</th>
            <th>Prioridade</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.pending.length
              ? data.pending.map((item) => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.type || "Não informado"}</td>
                  <td>${item.priority}</td>
                  <td>${item.status}</td>
                </tr>
              `).join("")
              : `<tr><td colspan="4">Nenhuma pendência cadastrada.</td></tr>`
          }
        </tbody>
      </table>

      <h2>Tarefas</h2>
      <table>
        <thead>
          <tr>
            <th>Tarefa</th>
            <th>Etapa</th>
            <th>Responsável</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.tasks.length
              ? data.tasks.map((item) => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.stage || "Não informada"}</td>
                  <td>${item.assignee || "Não informado"}</td>
                  <td>${item.status}</td>
                </tr>
              `).join("")
              : `<tr><td colspan="4">Nenhuma tarefa cadastrada.</td></tr>`
          }
        </tbody>
      </table>
    `;

    openSystemPdf({
      title: `Relatório do projeto ${project.name}`,
      subtitle: "Relatório automático gerado pela Central de Gestão.",
      documentLabel: "Relatório de gestão do projeto",
      preparedBy: "Sistema",
      fileName: `relatorio-${project.name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      bodyHtml,
    });
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
                Controle financeiro por rubrica, quantidade, forma de pagamento, pendências, tarefas e relatório automático.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard icon={AlertTriangle} title="Pendências" value={String(totals.pendingCount)} />
              <SummaryCard icon={ClipboardList} title="Tarefas" value={String(totals.taskCount)} />
              <SummaryCard icon={Wallet} title="Executado" value={formatBRL(totals.executed)} />
              <SummaryCard icon={FileText} title="Saldo" value={formatBRL(totals.open)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
          <TabButton active={activeTab === "rubricas"} onClick={() => setActiveTab("rubricas")}>
            Financeiro por rubrica
          </TabButton>
          <TabButton active={activeTab === "pendencias"} onClick={() => setActiveTab("pendencias")}>
            Pendências
          </TabButton>
          <TabButton active={activeTab === "tarefas"} onClick={() => setActiveTab("tarefas")}>
            Tarefas
          </TabButton>
          <TabButton active={activeTab === "relatorio"} onClick={() => setActiveTab("relatorio")}>
            Relatório automático
          </TabButton>
        </div>
      </section>

      {activeTab === "rubricas" ? (
        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={addRubric} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <PanelTitle title="Nova rubrica" description="Cadastre categoria, quantidade, forma de pagamento e valores." />

            <div className="space-y-4">
              <InputLine label="Categoria">
                <input
                  value={rubricDraft.category}
                  onChange={(event) => setRubricDraft({ ...rubricDraft, category: event.target.value })}
                  className="viva-input"
                  placeholder="Pré-produção, Produção, Acessibilidade..."
                />
              </InputLine>

              <InputLine label="Rubrica">
                <input
                  value={rubricDraft.name}
                  onChange={(event) => setRubricDraft({ ...rubricDraft, name: event.target.value })}
                  className="viva-input"
                  placeholder="Elenco, figurino, divulgação..."
                />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="Unidade">
                  <input
                    value={rubricDraft.unit}
                    onChange={(event) => setRubricDraft({ ...rubricDraft, unit: event.target.value })}
                    className="viva-input"
                    placeholder="03 dias, 01 projeto..."
                  />
                </InputLine>

                <InputLine label="Quantidade">
                  <input
                    value={rubricDraft.quantity}
                    onChange={(event) => setRubricDraft({ ...rubricDraft, quantity: event.target.value })}
                    className="viva-input"
                    placeholder="06, 12, 01..."
                  />
                </InputLine>
              </div>

              <InputLine label="Forma de pagamento">
                <input
                  value={rubricDraft.paymentBasis}
                  onChange={(event) => setRubricDraft({ ...rubricDraft, paymentBasis: event.target.value })}
                  className="viva-input"
                  placeholder="Por apresentação, por projeto, por diária..."
                />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="Aprovado">
                  <input
                    value={rubricDraft.approved}
                    onChange={(event) => setRubricDraft({ ...rubricDraft, approved: formatCurrencyInput(event.target.value) })}
                    className="viva-input"
                    placeholder="R$ 0,00"
                  />
                </InputLine>

                <InputLine label="Executado">
                  <input
                    value={rubricDraft.executed}
                    onChange={(event) => setRubricDraft({ ...rubricDraft, executed: formatCurrencyInput(event.target.value) })}
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
                  placeholder="Detalhes da rubrica..."
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
              const approved = parseCurrency(item.approved);
              const executed = parseCurrency(item.executed);
              const balance = Math.max(approved - executed, 0);

              return (
                <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-3 xl:grid-cols-[0.9fr_1fr_0.55fr_0.55fr_0.9fr_0.8fr_0.8fr_0.8fr_auto]">
                    <input value={item.category} onChange={(event) => updateRubric(item.id, "category", event.target.value)} className="viva-input" />
                    <input value={item.name} onChange={(event) => updateRubric(item.id, "name", event.target.value)} className="viva-input" />
                    <input value={item.unit} onChange={(event) => updateRubric(item.id, "unit", event.target.value)} className="viva-input" />
                    <input value={item.quantity} onChange={(event) => updateRubric(item.id, "quantity", event.target.value)} className="viva-input" />
                    <input value={item.paymentBasis} onChange={(event) => updateRubric(item.id, "paymentBasis", event.target.value)} className="viva-input" />
                    <input value={item.approved} onChange={(event) => updateRubric(item.id, "approved", event.target.value)} className="viva-input" />
                    <input value={item.executed} onChange={(event) => updateRubric(item.id, "executed", event.target.value)} className="viva-input" />
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">
                      {formatBRL(balance)}
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

      {activeTab === "pendencias" ? (
        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={addPending} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <PanelTitle title="Nova pendência" description="Cadastre algo que precisa de atenção." />

            <div className="space-y-4">
              <InputLine label="Descrição">
                <input value={pendingDraft.title} onChange={(event) => setPendingDraft({ ...pendingDraft, title: event.target.value })} className="viva-input" placeholder="Ex: Anexar contrato da Júlia" />
              </InputLine>

              <InputLine label="Tipo">
                <input value={pendingDraft.type} onChange={(event) => setPendingDraft({ ...pendingDraft, type: event.target.value })} className="viva-input" placeholder="Documentação, financeiro, equipe..." />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="Prazo">
                  <input type="date" value={pendingDraft.dueDate} onChange={(event) => setPendingDraft({ ...pendingDraft, dueDate: event.target.value })} className="viva-input" />
                </InputLine>

                <InputLine label="Prioridade">
                  <select value={pendingDraft.priority} onChange={(event) => setPendingDraft({ ...pendingDraft, priority: event.target.value as Priority })} className="viva-input">
                    {priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}
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
                  <input value={item.title} onChange={(event) => updatePending(item.id, "title", event.target.value)} className="viva-input" />
                  <input value={item.type} onChange={(event) => updatePending(item.id, "type", event.target.value)} className="viva-input" />
                  <select value={item.priority} onChange={(event) => updatePending(item.id, "priority", event.target.value)} className="viva-input">
                    {priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                  <select value={item.status} onChange={(event) => updatePending(item.id, "status", event.target.value)} className="viva-input">
                    {statusOptions.map((status) => <option key={status}>{status}</option>)}
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
                <input value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} className="viva-input" placeholder="Ex: Revisar orçamento" />
              </InputLine>

              <InputLine label="Etapa">
                <input value={taskDraft.stage} onChange={(event) => setTaskDraft({ ...taskDraft, stage: event.target.value })} className="viva-input" placeholder="Pré-produção, execução, prestação..." />
              </InputLine>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputLine label="Responsável">
                  <input value={taskDraft.assignee} onChange={(event) => setTaskDraft({ ...taskDraft, assignee: event.target.value })} className="viva-input" placeholder="Nome" />
                </InputLine>

                <InputLine label="Prazo">
                  <input type="date" value={taskDraft.dueDate} onChange={(event) => setTaskDraft({ ...taskDraft, dueDate: event.target.value })} className="viva-input" />
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
                  <input value={item.title} onChange={(event) => updateTask(item.id, "title", event.target.value)} className="viva-input" />
                  <input value={item.stage} onChange={(event) => updateTask(item.id, "stage", event.target.value)} className="viva-input" />
                  <input value={item.assignee} onChange={(event) => updateTask(item.id, "assignee", event.target.value)} className="viva-input" />
                  <select value={item.status} onChange={(event) => updateTask(item.id, "status", event.target.value)} className="viva-input">
                    {statusOptions.map((status) => <option key={status}>{status}</option>)}
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

      {activeTab === "relatorio" ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PanelTitle title="Relatório automático" description="Copie ou gere um PDF com o modelo padrão." />

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyReport} className="viva-button-secondary">
                <Copy className="size-4" />
                Copiar
              </button>
              <button type="button" onClick={downloadPdfReport} className="viva-button">
                <Download className="size-4" />
                Baixar PDF
              </button>
            </div>
          </div>

          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-sm leading-7 text-slate-100">
            {reportText}
          </pre>
        </section>
      ) : null}
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
  children: ReactNode;
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
  children: ReactNode;
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
