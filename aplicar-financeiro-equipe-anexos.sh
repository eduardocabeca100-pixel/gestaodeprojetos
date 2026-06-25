#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-financeiro-equipe-anexos-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

mkdir -p src/components/advanced-management
mkdir -p src/components/documents
mkdir -p 'src/app/(protected)/anexos'

cat > src/components/advanced-management/advanced-management-panel.tsx <<'EOF'
"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
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
  const [data, setData] = useState<AdvancedManagementData>(emptyData);
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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey(project.id));
      setData(saved ? normalizeData(JSON.parse(saved)) : emptyData);
    } catch {
      setData(emptyData);
    }
  }, [project.id]);

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
EOF

cat > src/components/documents/document-vault.tsx <<'EOF'
"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Download,
  FileArchive,
  FileText,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DocumentCategory =
  | "Orçamento"
  | "Documento"
  | "Nota fiscal"
  | "Contrato"
  | "Recibo"
  | "Comprovante"
  | "Relatório"
  | "Mídia"
  | "Anexo do edital"
  | "Outros";

type DocumentMeta = {
  id: string;
  projectId: string;
  name: string;
  originalName: string;
  category: DocumentCategory;
  type: string;
  size: number;
  uploadedAt: string;
  notes: string;
};

type DocumentVaultProps = {
  project: {
    id: string;
    name: string;
  };
};

const DB_NAME = "viva-document-vault-db";
const STORE_NAME = "files";
const METADATA_KEY = "viva:document-vault:metadata:v1";

const categories: DocumentCategory[] = [
  "Orçamento",
  "Documento",
  "Nota fiscal",
  "Contrato",
  "Recibo",
  "Comprovante",
  "Relatório",
  "Mídia",
  "Anexo do edital",
  "Outros",
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFileToDb(id: string, file: File) {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

async function getFileFromDb(id: string): Promise<File | null> {
  const db = await openDb();

  const file = await new Promise<File | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as File) ?? null);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return file;
}

async function deleteFileFromDb(id: string) {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

function readMetadata() {
  try {
    const saved = window.localStorage.getItem(METADATA_KEY);
    return saved ? (JSON.parse(saved) as DocumentMeta[]) : [];
  } catch {
    return [];
  }
}

function writeMetadata(items: DocumentMeta[]) {
  window.localStorage.setItem(METADATA_KEY, JSON.stringify(items));
}

export function DocumentVault({ project }: DocumentVaultProps) {
  const [items, setItems] = useState<DocumentMeta[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    category: "Documento" as DocumentCategory,
    notes: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(readMetadata());
  }, []);

  const projectItems = useMemo(() => {
    return items
      .filter((item) => item.projectId === project.id)
      .filter((item) => {
        const search = query.trim().toLowerCase();
        if (!search) return true;

        return [
          item.name,
          item.originalName,
          item.category,
          item.type,
          item.notes,
        ].some((value) => value.toLowerCase().includes(search));
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [items, project.id, query]);

  const grouped = useMemo(() => {
    return categories.map((category) => ({
      category,
      items: projectItems.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [projectItems]);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles(files);
  }

  async function uploadFiles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setMessage("Selecione pelo menos um arquivo para enviar.");
      return;
    }

    const newItems: DocumentMeta[] = [];

    for (const file of selectedFiles) {
      const id = createId("file");

      await saveFileToDb(id, file);

      newItems.push({
        id,
        projectId: project.id,
        name: draft.name || file.name,
        originalName: file.name,
        category: draft.category,
        type: file.type || "Arquivo",
        size: file.size,
        uploadedAt: new Date().toISOString(),
        notes: draft.notes,
      });
    }

    const nextItems = [...newItems, ...items];
    setItems(nextItems);
    writeMetadata(nextItems);
    setSelectedFiles([]);
    setDraft({
      name: "",
      category: "Documento",
      notes: "",
    });
    setMessage(`${newItems.length} arquivo(s) enviado(s) com sucesso.`);
  }

  async function downloadFile(item: DocumentMeta) {
    const file = await getFileFromDb(item.id);

    if (!file) {
      setMessage("Arquivo não encontrado no armazenamento local.");
      return;
    }

    const url = URL.createObjectURL(file);
    const element = document.createElement("a");

    element.href = url;
    element.download = item.originalName;
    element.click();

    URL.revokeObjectURL(url);
  }

  async function removeFile(item: DocumentMeta) {
    await deleteFileFromDb(item.id);

    const nextItems = items.filter((current) => current.id !== item.id);
    setItems(nextItems);
    writeMetadata(nextItems);
    setMessage("Arquivo removido.");
  }

  function updateMeta(id: string, field: keyof DocumentMeta, value: string) {
    const nextItems = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item,
    );

    setItems(nextItems);
    writeMetadata(nextItems);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">
            Anexos do projeto
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Documentos, notas e comprovantes
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Envie vários arquivos por projeto e classifique como orçamento, documento, nota fiscal,
            contrato, recibo, comprovante, relatório, mídia ou anexo do edital.
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <StatCard label="Arquivos" value={String(projectItems.length)} />
          <StatCard label="Categorias usadas" value={String(grouped.length)} />
          <StatCard label="Projeto" value={project.name} />
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={uploadFiles} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              Upload
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Adicionar anexos
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Você pode selecionar vários arquivos ao mesmo tempo.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
              <UploadCloud className="mb-3 size-8 text-emerald-700" />
              <span className="text-sm font-black text-slate-800">
                Selecionar arquivos
              </span>
              <span className="mt-1 text-xs text-slate-500">
                PDF, imagem, planilha, documento, recibo, nota fiscal...
              </span>
              <input type="file" multiple className="hidden" onChange={handleFiles} />
            </label>

            {selectedFiles.length ? (
              <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                {selectedFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between gap-3 py-1">
                    <span>{file.name}</span>
                    <strong>{formatBytes(file.size)}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            <InputLine label="Nome interno">
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className="vault-input"
                placeholder="Opcional. Se vazio, usa o nome do arquivo."
              />
            </InputLine>

            <InputLine label="Tipo / categoria">
              <select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value as DocumentCategory })}
                className="vault-input"
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </InputLine>

            <InputLine label="Observações">
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                className="vault-input min-h-24"
                placeholder="Ex: nota fiscal da sonorização, contrato do ator..."
              />
            </InputLine>

            <Button type="submit" className="w-full">
              <Plus className="mr-2 size-4" />
              Enviar anexo(s)
            </Button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Arquivos salvos
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Biblioteca do projeto
              </h3>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                placeholder="Buscar arquivo..."
              />
            </div>
          </div>

          {projectItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <FileArchive className="mx-auto mb-3 size-9 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">
                Nenhum anexo enviado para este projeto ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.category}>
                  <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">
                    {group.category}
                  </h4>

                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                              <FileText className="size-5" />
                            </div>

                            <div>
                              <input
                                value={item.name}
                                onChange={(event) => updateMeta(item.id, "name", event.target.value)}
                                className="w-full border-0 bg-transparent p-0 text-base font-black text-slate-950 outline-none"
                              />
                              <p className="mt-1 text-sm text-slate-500">
                                {item.originalName} • {formatBytes(item.size)} • {new Date(item.uploadedAt).toLocaleDateString("pt-BR")}
                              </p>

                              <div className="mt-3 grid gap-3 sm:grid-cols-[190px_1fr]">
                                <select
                                  value={item.category}
                                  onChange={(event) => updateMeta(item.id, "category", event.target.value)}
                                  className="vault-input"
                                >
                                  {categories.map((category) => (
                                    <option key={category}>{category}</option>
                                  ))}
                                </select>

                                <input
                                  value={item.notes}
                                  onChange={(event) => updateMeta(item.id, "notes", event.target.value)}
                                  className="vault-input"
                                  placeholder="Observações"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={() => downloadFile(item)}>
                              <Download className="mr-2 size-4" />
                              Baixar
                            </Button>
                            <Button type="button" variant="destructive" onClick={() => removeFile(item)}>
                              <Trash2 className="mr-2 size-4" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="block text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <strong className="mt-2 block text-sm font-black text-slate-950">
        {value}
      </strong>
    </div>
  );
}

function InputLine({ label, children }: { label: string; children: React.ReactNode }) {
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

cat > 'src/app/(protected)/anexos/page.tsx' <<'EOF'
import { DocumentVault } from "@/components/documents/document-vault";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";

export default async function AttachmentsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);

  return (
    <PageContainer
      title="Anexos"
      description="Envie, categorize, consulte e baixe arquivos vinculados ao projeto."
    >
      <div className="space-y-6">
        <ProjectScopeBanner project={project} />
        <DocumentVault project={{ id: project.id, name: project.name }} />
      </div>
    </PageContainer>
  );
}
EOF

echo "Atualizando importador do Reféns com rubricas detalhadas..."
python3 - <<'PY'
from pathlib import Path
import re

path = Path("src/components/refens/refens-data-seeder.tsx")
if not path.exists():
    raise SystemExit(0)

text = path.read_text()

rubrics_block = '''const refensRubrics = [
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
];'''

text = re.sub(r"const refensRubrics = \[[\s\S]*?\];\n\nconst refensPending =", rubrics_block + "\n\nconst refensPending =", text)

# Atualiza texto visual caso tenha as palavras antigas
text = text.replace("Rubricas: {result.rubrics}", "Rubricas detalhadas: {result.rubrics}")
text = text.replace("incluindo pré-produção,\n                produção/execução, acessibilidade e pós-produção, totalizando R$ 50.000,00.", "incluindo categoria, unidade, quantidade, forma de pagamento, aprovado, executado e saldo.")

path.write_text(text)
PY

echo "Adicionando botão Adicionar à equipe permanente na gestão de equipe..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/team/local-team-workspace.tsx")
if not path.exists():
    raise SystemExit(0)

text = path.read_text()

# Adiciona função para transformar membro do projeto em permanente
if "function promoteAssignmentToPermanent" not in text:
    marker = "  function removeAssignment(assignmentId: string) {"
    function_code = '''  function promoteAssignmentToPermanent(assignment: LocalProjectAssignment) {
    const alreadyExists = members.some((member) => member.id === assignment.memberId);

    if (alreadyExists) {
      setMessage(`${assignment.name} já está na equipe permanente.`);
      return;
    }

    const nextMember: LocalTeamMember = {
      id: assignment.memberId || createLocalId("member"),
      name: assignment.name,
      role: assignment.role,
      email: "",
      phone: "",
      document: "",
      rubric: assignment.rubric,
      defaultAmount: assignment.expectedAmount,
      notes: assignment.notes,
      active: true,
    };

    persistMembers([nextMember, ...members]);
    setMessage(`${assignment.name} foi adicionado(a) à equipe permanente.`);
  }

'''
    if marker in text:
        text = text.replace(marker, function_code + marker)

# Adiciona botão perto do Histórico se ainda não existe
if "Adicionar à permanente" not in text:
    old = '''                        <Button type="button" variant="outline" onClick={() => toggleHistory(assignment.id)}>
                          <History className="mr-2 size-4" />
                          Histórico
                        </Button>'''
    new = old + '''
                        <Button type="button" variant="outline" onClick={() => promoteAssignmentToPermanent(assignment)}>
                          <UsersRound className="mr-2 size-4" />
                          Adicionar à permanente
                        </Button>'''
    if old in text:
        text = text.replace(old, new)

path.write_text(text)
PY

echo "Adicionando rota Anexos no menu lateral..."
python3 - <<'PY'
from pathlib import Path
import re

sidebar = Path("src/components/layout/app-sidebar.tsx")
if not sidebar.exists():
    raise SystemExit(0)

text = sidebar.read_text()

# Garante import FileArchive
match = re.search(r'import\s*\{([^}]+)\}\s*from\s*"lucide-react";', text, flags=re.DOTALL)
if match:
    imports = [item.strip() for item in match.group(1).split(",") if item.strip()]
    if "FileArchive" not in imports:
        imports.append("FileArchive")
    seen = []
    for item in imports:
        if item not in seen:
            seen.append(item)
    new_import = 'import {\n  ' + ',\n  '.join(seen) + ',\n} from "lucide-react";'
    text = text[:match.start()] + new_import + text[match.end():]

if 'href: "/anexos"' not in text:
    targets = [
        '{ label: "Documentos", href: "/documentos", icon: FileText, projectScoped: true },',
        '{ label: "Gestão", href: "/gestao", icon: ClipboardList, projectScoped: true },',
        '{ label: "Relatórios", href: "/relatorios", icon: BarChart3, projectScoped: true },',
    ]
    insert = '{ label: "Anexos", href: "/anexos", icon: FileArchive, projectScoped: true }, '
    for target in targets:
        if target in text:
            text = text.replace(target, target + " " + insert)
            break

sidebar.write_text(text)
PY

echo "Adicionando estilos globais reutilizáveis..."
python3 - <<'PY'
from pathlib import Path

css_path = Path("src/app/globals.css")
css = css_path.read_text() if css_path.exists() else ""

block = """
/* === VIVA FORM CONTROLS START === */
.viva-input,
.vault-input {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgb(226 232 240);
  background: white;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.viva-input:focus,
.vault-input:focus {
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
/* === VIVA FORM CONTROLS END === */
"""

if "VIVA FORM CONTROLS START" not in css:
    css_path.write_text(css.rstrip() + "\n\n" + block)
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

echo "Verificando erros conhecidos..."
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

echo "Conferindo alterações..."
grep -R "Forma de pagamento" -n src/components/advanced-management/advanced-management-panel.tsx
grep -R "DocumentVault" -n src/components/documents/document-vault.tsx 'src/app/(protected)/anexos/page.tsx'
grep -R "Adicionar à permanente" -n src/components/team/local-team-workspace.tsx || true
grep -R 'href: "/anexos"' -n src/components/layout/app-sidebar.tsx || true

echo "Status:"
git status --short

git add src/components/advanced-management/advanced-management-panel.tsx src/components/documents 'src/app/(protected)/anexos' src/components/refens/refens-data-seeder.tsx src/components/team/local-team-workspace.tsx src/components/layout/app-sidebar.tsx src/app/globals.css .gitignore package.json package-lock.json
git commit -m "Aprimora financeiro equipe permanente e anexos do projeto" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Abra /configuracoes/importar-refens, reimporte o Reféns, depois confira /gestao, /equipe e /anexos."
