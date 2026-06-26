"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Download,
  Edit3,
  FileCheck2,
  FileText,
  FolderPlus,
  HandCoins,
  Paperclip,
  Plus,
  ReceiptText,
  Save,
  Search,
  Trash2,
  UploadCloud,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { projectScopedKey } from "@/lib/project-scope";
import { formatCurrency } from "@/lib/utils/format-currency";
import {
  budgetCategories,
  type BudgetCategory,
  type BudgetItem,
} from "@/modules/finance/types";
import type { TeamMember } from "@/modules/team/types";

type LocalBudgetItem = BudgetItem & {
  originalApprovedAmount: number;
  revisionReason?: string;
  updatedAt?: string;
  updatedBy?: string;
};

type BeneficiaryKind = "Equipe" | "Fornecedor externo";

type FinancialDocumentStatus = "Pendente" | "Anexado" | "Conferido" | "Recusado";

type FinancialAttachment = {
  id: string;
  type: string;
  status: FinancialDocumentStatus;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileDataUrl?: string;
  notes?: string;
  uploadedAt?: string;
};

type ExpenseWorkflowStatus =
  | "Previsto"
  | "Aguardando nota/recibo"
  | "Aguardando pagamento"
  | "Pago"
  | "Em conferência"
  | "Aprovado para prestação de contas"
  | "Pendente de correção"
  | "Cancelado";

type FinancialExpense = {
  id: string;
  budgetItemId: string;
  description: string;
  beneficiaryKind: BeneficiaryKind;
  teamMemberId?: string;
  beneficiaryName: string;
  beneficiaryDocument: string;
  beneficiaryPhone: string;
  beneficiaryEmail: string;
  amount: number;
  paidAt: string;
  paymentMethod: string;
  status: ExpenseWorkflowStatus;
  notes: string;
  attachments: FinancialAttachment[];
  createdAt: string;
};

type FinanceState = {
  budgets: LocalBudgetItem[];
  expenses: FinancialExpense[];
};

const storageKeyBase = "viva:finance-accountability:v1";

const attachmentTypes = [
  "Nota fiscal de serviço",
  "Nota fiscal de material",
  "Cupom fiscal",
  "Recibo/RPA para prestador PF",
  "Recibo simples para ator/artista",
  "Comprovante de pagamento",
  "Contrato/autorização",
  "Comprovante bancário",
  "Boleto pago",
  "Print de Pix/transferência",
];

const expenseStatuses: ExpenseWorkflowStatus[] = [
  "Previsto",
  "Aguardando nota/recibo",
  "Aguardando pagamento",
  "Pago",
  "Em conferência",
  "Aprovado para prestação de contas",
  "Pendente de correção",
  "Cancelado",
];

const paymentMethods = [
  "Pix",
  "Transferência bancária",
  "Boleto",
  "Cartão",
  "Dinheiro",
  "Outro",
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeBudget(item: BudgetItem): LocalBudgetItem {
  return {
    ...item,
    originalApprovedAmount: item.approvedAmount,
    revisionReason: "",
    updatedAt: "",
    updatedBy: "",
  };
}

function mergeBudgets(saved: LocalBudgetItem[], official: BudgetItem[]) {
  const savedById = new Map(saved.map((item) => [item.id, item]));

  const merged = official.map((item) => {
    const savedItem = savedById.get(item.id);

    return savedItem
      ? {
          ...normalizeBudget(item),
          ...savedItem,
          originalApprovedAmount:
            savedItem.originalApprovedAmount || item.approvedAmount,
        }
      : normalizeBudget(item);
  });

  const officialIds = new Set(official.map((item) => item.id));
  const custom = saved.filter((item) => !officialIds.has(item.id));

  return [...merged, ...custom];
}

function readState(projectId: string, officialBudgets: BudgetItem[]): FinanceState {
  if (typeof window === "undefined") {
    return {
      budgets: officialBudgets.map(normalizeBudget),
      expenses: [],
    };
  }

  try {
    const saved = window.localStorage.getItem(projectScopedKey(storageKeyBase, projectId));

    if (!saved) {
      return {
        budgets: officialBudgets.map(normalizeBudget),
        expenses: [],
      };
    }

    const parsed = JSON.parse(saved) as Partial<FinanceState>;

    return {
      budgets: mergeBudgets(parsed.budgets ?? [], officialBudgets),
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    };
  } catch {
    return {
      budgets: officialBudgets.map(normalizeBudget),
      expenses: [],
    };
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size?: number) {
  if (!size) return "Sem arquivo";

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isExpenseExecuted(status: ExpenseWorkflowStatus) {
  return (
    status === "Pago" ||
    status === "Em conferência" ||
    status === "Aprovado para prestação de contas"
  );
}

function getBudgetExecuted(budgetId: string, expenses: FinancialExpense[]) {
  return expenses
    .filter((expense) => expense.budgetItemId === budgetId)
    .filter((expense) => isExpenseExecuted(expense.status))
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

function getBudgetPendingDocuments(expenses: FinancialExpense[]) {
  return expenses.filter((expense) => {
    if (expense.status === "Cancelado") return false;

    const hasFiscalDocument = expense.attachments.some(
      (attachment) =>
        attachment.fileDataUrl &&
        attachment.status !== "Recusado" &&
        !attachment.type.toLowerCase().includes("pagamento") &&
        !attachment.type.toLowerCase().includes("bancário") &&
        !attachment.type.toLowerCase().includes("pix"),
    );

    const hasPaymentProof = expense.attachments.some(
      (attachment) =>
        attachment.fileDataUrl &&
        attachment.status !== "Recusado" &&
        (attachment.type.toLowerCase().includes("pagamento") ||
          attachment.type.toLowerCase().includes("bancário") ||
          attachment.type.toLowerCase().includes("pix")),
    );

    return !hasFiscalDocument || !hasPaymentProof;
  }).length;
}

function statusTone(status: ExpenseWorkflowStatus) {
  if (status === "Aprovado para prestação de contas") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Pago" || status === "Em conferência") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "Pendente de correção" || status === "Cancelado") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function attachmentTone(status: FinancialDocumentStatus) {
  if (status === "Conferido") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Anexado") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "Recusado") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function downloadAttachment(attachment: FinancialAttachment) {
  if (!attachment.fileDataUrl) return;

  const link = window.document.createElement("a");
  link.href = attachment.fileDataUrl;
  link.download = attachment.fileName || `${attachment.type}.pdf`;
  link.click();
}

function buildNewExpense(budgetItemId: string): FinancialExpense {
  return {
    id: makeId("expense"),
    budgetItemId,
    description: "",
    beneficiaryKind: "Equipe",
    teamMemberId: "",
    beneficiaryName: "",
    beneficiaryDocument: "",
    beneficiaryPhone: "",
    beneficiaryEmail: "",
    amount: 0,
    paidAt: "",
    paymentMethod: "Pix",
    status: "Previsto",
    notes: "",
    attachments: attachmentTypes.map((type) => ({
      id: makeId("attachment"),
      type,
      status: "Pendente",
      notes: "",
    })),
    createdAt: new Date().toISOString(),
  };
}

export function FinancialAccountabilityWorkspace({
  project,
  initialBudgetItems,
  teamMembers,
}: {
  project: { id: string; name: string };
  initialBudgetItems: BudgetItem[];
  teamMembers: TeamMember[];
}) {
  const [state, setState] = useState<FinanceState>(() =>
    readState(project.id, initialBudgetItems),
  );
  const [selectedBudgetId, setSelectedBudgetId] = useState(
    initialBudgetItems[0]?.id ?? "",
  );
  const [selectedExpenseId, setSelectedExpenseId] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Pré-produção": true,
    "Produção / Execução": true,
    Acessibilidade: true,
    "Pós-produção": true,
  });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Financeiro carregado.");
  const [preview, setPreview] = useState<FinancialAttachment | null>(null);

  useEffect(() => {
    const next = readState(project.id, initialBudgetItems);
    setState(next);
    setSelectedBudgetId(next.budgets[0]?.id ?? "");
    setSelectedExpenseId("");
    setMessage(`Financeiro carregado para ${project.name}.`);
  }, [project.id, project.name, initialBudgetItems]);

  function commit(next: FinanceState, nextMessage = "Alteração salva no financeiro.") {
    setState(next);
    window.localStorage.setItem(
      projectScopedKey(storageKeyBase, project.id),
      JSON.stringify(next),
    );
    setMessage(nextMessage);
  }

  const selectedBudget =
    state.budgets.find((budget) => budget.id === selectedBudgetId) ??
    state.budgets[0] ??
    null;

  const selectedBudgetExpenses = selectedBudget
    ? state.expenses.filter((expense) => expense.budgetItemId === selectedBudget.id)
    : [];

  const selectedExpense =
    state.expenses.find((expense) => expense.id === selectedExpenseId) ??
    selectedBudgetExpenses[0] ??
    null;

  const totals = useMemo(() => {
    const approved = state.budgets.reduce(
      (total, budget) => total + Number(budget.approvedAmount || 0),
      0,
    );
    const executed = state.expenses
      .filter((expense) => isExpenseExecuted(expense.status))
      .reduce((total, expense) => total + Number(expense.amount || 0), 0);
    const pendingDocuments = getBudgetPendingDocuments(state.expenses);
    const approvedExpenses = state.expenses.filter(
      (expense) => expense.status === "Aprovado para prestação de contas",
    ).length;

    return {
      approved,
      executed,
      remaining: Math.max(approved - executed, 0),
      pendingDocuments,
      approvedExpenses,
      expensesCount: state.expenses.length,
    };
  }, [state.budgets, state.expenses]);

  const groupedBudgets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return budgetCategories.map((category) => ({
      category,
      items: state.budgets.filter((budget) => {
        const matchesCategory = budget.category === category;
        const matchesSearch =
          !normalizedSearch ||
          budget.name.toLowerCase().includes(normalizedSearch) ||
          budget.category.toLowerCase().includes(normalizedSearch) ||
          budget.notes.toLowerCase().includes(normalizedSearch);

        return matchesCategory && matchesSearch;
      }),
    }));
  }, [search, state.budgets]);

  function updateBudget(budgetId: string, patch: Partial<LocalBudgetItem>) {
    commit({
      ...state,
      budgets: state.budgets.map((budget) =>
        budget.id === budgetId
          ? {
              ...budget,
              ...patch,
              updatedAt: new Date().toISOString(),
              updatedBy: "Sistema",
            }
          : budget,
      ),
    });
  }

  function addCustomBudget() {
    const newBudget: LocalBudgetItem = {
      id: makeId("budget"),
      projectId: project.id,
      category: "Produção / Execução",
      name: "Nova rubrica",
      approvedAmount: 0,
      executedAmount: 0,
      originalApprovedAmount: 0,
      notes: "Rubrica criada manualmente.",
      revisionReason: "",
      updatedAt: new Date().toISOString(),
      updatedBy: "Sistema",
    };

    commit(
      {
        ...state,
        budgets: [newBudget, ...state.budgets],
      },
      "Nova rubrica criada.",
    );
    setSelectedBudgetId(newBudget.id);
  }

  function removeBudget(budgetId: string) {
    const hasExpenses = state.expenses.some((expense) => expense.budgetItemId === budgetId);

    if (hasExpenses) {
      setMessage("Não dá para excluir rubrica com despesas lançadas. Apague ou mova as despesas primeiro.");
      return;
    }

    if (!window.confirm("Excluir esta rubrica?")) return;

    const nextBudgets = state.budgets.filter((budget) => budget.id !== budgetId);

    commit(
      {
        ...state,
        budgets: nextBudgets,
      },
      "Rubrica excluída.",
    );

    setSelectedBudgetId(nextBudgets[0]?.id ?? "");
  }

  function addExpense() {
    if (!selectedBudget) {
      setMessage("Selecione uma rubrica antes de lançar despesa.");
      return;
    }

    const newExpense = buildNewExpense(selectedBudget.id);

    commit(
      {
        ...state,
        expenses: [newExpense, ...state.expenses],
      },
      "Nova despesa criada dentro da rubrica.",
    );
    setSelectedExpenseId(newExpense.id);
  }

  function updateExpense(expenseId: string, patch: Partial<FinancialExpense>) {
    commit({
      ...state,
      expenses: state.expenses.map((expense) =>
        expense.id === expenseId ? { ...expense, ...patch } : expense,
      ),
    });
  }

  function removeExpense(expenseId: string) {
    if (!window.confirm("Excluir esta despesa e seus anexos?")) return;

    const nextExpenses = state.expenses.filter((expense) => expense.id !== expenseId);

    commit(
      {
        ...state,
        expenses: nextExpenses,
      },
      "Despesa excluída.",
    );
    setSelectedExpenseId(nextExpenses[0]?.id ?? "");
  }

  function selectTeamMember(expense: FinancialExpense, teamMemberId: string) {
    const member = teamMembers.find((item) => item.id === teamMemberId);

    if (!member) {
      updateExpense(expense.id, {
        teamMemberId: "",
        beneficiaryName: "",
        beneficiaryDocument: "",
        beneficiaryPhone: "",
        beneficiaryEmail: "",
      });
      return;
    }

    updateExpense(expense.id, {
      teamMemberId: member.id,
      beneficiaryName: member.name,
      beneficiaryDocument: member.document,
      beneficiaryPhone: member.phone,
      beneficiaryEmail: member.email,
      description: expense.description || `Pagamento de ${member.role}`,
    });
  }

  async function uploadAttachment(
    expenseId: string,
    attachmentId: string,
    file: File | null,
  ) {
    if (!file) return;

    const maxSize = 8 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage("Arquivo muito grande. Use até 8 MB por anexo nesta versão.");
      return;
    }

    const fileDataUrl = await fileToDataUrl(file);

    commit(
      {
        ...state,
        expenses: state.expenses.map((expense) =>
          expense.id === expenseId
            ? {
                ...expense,
                attachments: expense.attachments.map((attachment) =>
                  attachment.id === attachmentId
                    ? {
                        ...attachment,
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        fileDataUrl,
                        status: "Anexado",
                        uploadedAt: new Date().toISOString(),
                      }
                    : attachment,
                ),
              }
            : expense,
        ),
      },
      "Anexo financeiro enviado.",
    );
  }

  function updateAttachment(
    expenseId: string,
    attachmentId: string,
    patch: Partial<FinancialAttachment>,
  ) {
    commit({
      ...state,
      expenses: state.expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              attachments: expense.attachments.map((attachment) =>
                attachment.id === attachmentId ? { ...attachment, ...patch } : attachment,
              ),
            }
          : expense,
      ),
    });
  }

  function removeAttachmentFile(expenseId: string, attachmentId: string) {
    updateAttachment(expenseId, attachmentId, {
      fileName: undefined,
      fileSize: undefined,
      fileType: undefined,
      fileDataUrl: undefined,
      uploadedAt: undefined,
      status: "Pendente",
    });
  }

  function exportFinanceJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");

    link.href = url;
    link.download = `financeiro-${project.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Prestação de contas
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Financeiro por rubrica, despesa e anexo
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Clique em uma rubrica, lance despesas, selecione equipe ou fornecedor,
              anexe nota/recibo/comprovante e marque o status de conferência.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={exportFinanceJson}>
              <Download className="size-4" />
              Exportar dados
            </Button>
            <Button type="button" onClick={addCustomBudget}>
              <FolderPlus className="size-4" />
              Nova rubrica
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="Aprovado" value={formatCurrency(totals.approved)} icon={Wallet} />
        <SummaryCard title="Executado" value={formatCurrency(totals.executed)} icon={HandCoins} />
        <SummaryCard title="Saldo" value={formatCurrency(totals.remaining)} icon={AlertTriangle} />
        <SummaryCard title="Despesas" value={String(totals.expensesCount)} icon={ReceiptText} />
        <SummaryCard title="Pendências" value={String(totals.pendingDocuments)} icon={Paperclip} />
        <SummaryCard title="Aprovadas" value={String(totals.approvedExpenses)} icon={CheckCircle2} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Rubricas oficiais</h3>
              <p className="text-sm text-slate-500">Base da planilha orçamentária.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addCustomBudget}>
              <Plus className="size-4" />
              Rubrica
            </Button>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Buscar
            </span>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="form-input pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar rubrica..."
              />
            </div>
          </label>

          <div className="mt-4 space-y-4">
            {groupedBudgets.map((group) => {
              const groupApproved = group.items.reduce(
                (total, item) => total + Number(item.approvedAmount || 0),
                0,
              );
              const groupExecuted = group.items.reduce(
                (total, item) => total + getBudgetExecuted(item.id, state.expenses),
                0,
              );
              const open = expandedGroups[group.category] ?? true;

              return (
                <div key={group.category} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() =>
                      setExpandedGroups((current) => ({
                        ...current,
                        [group.category]: !open,
                      }))
                    }
                  >
                    <div>
                      <p className="font-black text-slate-950">{group.category}</p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(groupExecuted)} de {formatCurrency(groupApproved)}
                      </p>
                    </div>
                    {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>

                  {open ? (
                    <div className="mt-3 space-y-2">
                      {group.items.length === 0 ? (
                        <p className="rounded-xl bg-white p-3 text-sm text-slate-500">
                          Nenhuma rubrica nesta categoria.
                        </p>
                      ) : null}

                      {group.items.map((budget) => {
                        const executed = getBudgetExecuted(budget.id, state.expenses);
                        const remaining = Number(budget.approvedAmount || 0) - executed;
                        const selected = selectedBudget?.id === budget.id;

                        return (
                          <button
                            key={budget.id}
                            type="button"
                            className={
                              selected
                                ? "w-full rounded-2xl border border-primary bg-primary/10 p-3 text-left shadow-sm"
                                : "w-full rounded-2xl border border-white bg-white p-3 text-left transition hover:border-primary/40"
                            }
                            onClick={() => {
                              setSelectedBudgetId(budget.id);
                              setSelectedExpenseId("");
                            }}
                          >
                            <p className="line-clamp-2 text-sm font-black text-slate-950">
                              {budget.name}
                            </p>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                              <span>
                                <strong>Aprov.</strong>
                                <br />
                                {formatCurrency(budget.approvedAmount)}
                              </span>
                              <span>
                                <strong>Exec.</strong>
                                <br />
                                {formatCurrency(executed)}
                              </span>
                              <span>
                                <strong>Saldo</strong>
                                <br />
                                {formatCurrency(remaining)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          {selectedBudget ? (
            <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                    Rubrica selecionada
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">
                    {selectedBudget.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{selectedBudget.category}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => removeBudget(selectedBudget.id)}>
                    <Trash2 className="size-4" />
                    Excluir rubrica
                  </Button>
                  <Button type="button" onClick={addExpense}>
                    <Plus className="size-4" />
                    Nova despesa
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Nome da rubrica">
                  <input
                    className="form-input"
                    value={selectedBudget.name}
                    onChange={(event) =>
                      updateBudget(selectedBudget.id, { name: event.target.value })
                    }
                  />
                </Field>

                <Field label="Categoria">
                  <select
                    className="form-input"
                    value={selectedBudget.category}
                    onChange={(event) =>
                      updateBudget(selectedBudget.id, {
                        category: event.target.value as BudgetCategory,
                      })
                    }
                  >
                    {budgetCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Valor aprovado">
                  <input
                    className="form-input"
                    type="number"
                    value={selectedBudget.approvedAmount}
                    onChange={(event) =>
                      updateBudget(selectedBudget.id, {
                        approvedAmount: Number(event.target.value),
                      })
                    }
                  />
                </Field>

                <Field label="Valor original">
                  <input
                    className="form-input bg-slate-50"
                    value={formatCurrency(selectedBudget.originalApprovedAmount)}
                    readOnly
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Motivo do ajuste/remanejamento">
                  <input
                    className="form-input"
                    value={selectedBudget.revisionReason ?? ""}
                    onChange={(event) =>
                      updateBudget(selectedBudget.id, {
                        revisionReason: event.target.value,
                      })
                    }
                    placeholder="Ex.: remanejamento aprovado, correção de valor..."
                  />
                </Field>

                <Field label="Observações da rubrica">
                  <input
                    className="form-input"
                    value={selectedBudget.notes}
                    onChange={(event) =>
                      updateBudget(selectedBudget.id, { notes: event.target.value })
                    }
                  />
                </Field>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <MiniCard
                  title="Executado"
                  value={formatCurrency(getBudgetExecuted(selectedBudget.id, state.expenses))}
                />
                <MiniCard
                  title="Saldo"
                  value={formatCurrency(
                    selectedBudget.approvedAmount -
                      getBudgetExecuted(selectedBudget.id, state.expenses),
                  )}
                />
                <MiniCard
                  title="Despesas nesta rubrica"
                  value={String(selectedBudgetExpenses.length)}
                />
              </div>
            </div>
          ) : null}

          {selectedBudget ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
              <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Despesas da rubrica</h3>
                    <p className="text-sm text-slate-500">
                      Cada despesa fica ligada a uma rubrica.
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={addExpense}>
                    <Plus className="size-4" />
                    Despesa
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedBudgetExpenses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                      Nenhuma despesa lançada nesta rubrica.
                    </div>
                  ) : null}

                  {selectedBudgetExpenses.map((expense) => {
                    const selected = selectedExpense?.id === expense.id;
                    const pendingDocs = getBudgetPendingDocuments([expense]);

                    return (
                      <button
                        key={expense.id}
                        type="button"
                        className={
                          selected
                            ? "w-full rounded-2xl border border-primary bg-primary/10 p-4 text-left"
                            : "w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-primary/40"
                        }
                        onClick={() => setSelectedExpenseId(expense.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-950">
                              {expense.description || "Despesa sem descrição"}
                            </p>
                            <p className="mt-1 truncate text-sm text-slate-500">
                              {expense.beneficiaryName || expense.beneficiaryKind}
                            </p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(expense.status)}`}>
                            {expense.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                          <span>{formatCurrency(expense.amount)}</span>
                          <span>•</span>
                          <span>{pendingDocs ? `${pendingDocs} pendência(s)` : "documentos ok"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
                {selectedExpense ? (
                  <ExpenseEditor
                    expense={selectedExpense}
                    teamMembers={teamMembers}
                    onUpdate={(patch) => updateExpense(selectedExpense.id, patch)}
                    onRemove={() => removeExpense(selectedExpense.id)}
                    onSelectTeamMember={(teamMemberId) =>
                      selectTeamMember(selectedExpense, teamMemberId)
                    }
                    onUploadAttachment={(attachmentId, file) =>
                      uploadAttachment(selectedExpense.id, attachmentId, file)
                    }
                    onUpdateAttachment={(attachmentId, patch) =>
                      updateAttachment(selectedExpense.id, attachmentId, patch)
                    }
                    onRemoveAttachmentFile={(attachmentId) =>
                      removeAttachmentFile(selectedExpense.id, attachmentId)
                    }
                    onPreviewAttachment={(attachment) => setPreview(attachment)}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Selecione uma despesa ou crie uma nova para anexar nota, recibo e comprovante.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {preview?.fileDataUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <p className="text-sm font-black text-slate-950">{preview.type}</p>
                <p className="text-xs text-slate-500">{preview.fileName}</p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => downloadAttachment(preview)}>
                  <Download className="size-4" />
                  Baixar
                </Button>

                <Button type="button" variant="outline" onClick={() => setPreview(null)}>
                  Fechar
                </Button>
              </div>
            </div>

            <div className="min-h-[70vh] overflow-auto bg-slate-100 p-4">
              {preview.fileType?.includes("pdf") ? (
                <iframe
                  src={preview.fileDataUrl}
                  title={preview.type}
                  className="h-[72vh] w-full rounded-2xl border border-slate-200 bg-white"
                />
              ) : preview.fileType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.fileDataUrl}
                  alt={preview.type}
                  className="mx-auto max-h-[72vh] rounded-2xl object-contain"
                />
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                  Prévia indisponível para este tipo de arquivo. Use o botão baixar.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ExpenseEditor({
  expense,
  teamMembers,
  onUpdate,
  onRemove,
  onSelectTeamMember,
  onUploadAttachment,
  onUpdateAttachment,
  onRemoveAttachmentFile,
  onPreviewAttachment,
}: {
  expense: FinancialExpense;
  teamMembers: TeamMember[];
  onUpdate: (patch: Partial<FinancialExpense>) => void;
  onRemove: () => void;
  onSelectTeamMember: (teamMemberId: string) => void;
  onUploadAttachment: (attachmentId: string, file: File | null) => void;
  onUpdateAttachment: (attachmentId: string, patch: Partial<FinancialAttachment>) => void;
  onRemoveAttachmentFile: (attachmentId: string) => void;
  onPreviewAttachment: (attachment: FinancialAttachment) => void;
}) {
  const pendingDocs = getBudgetPendingDocuments([expense]);

  return (
    <div>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
            Despesa selecionada
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            {expense.description || "Nova despesa"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {pendingDocs ? `${pendingDocs} pendência(s) documental(is)` : "Documentação mínima conferida"}
          </p>
        </div>

        <Button type="button" variant="destructive" onClick={onRemove}>
          <Trash2 className="size-4" />
          Excluir despesa
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Field label="Descrição da despesa">
          <input
            className="form-input"
            value={expense.description}
            onChange={(event) => onUpdate({ description: event.target.value })}
            placeholder="Ex.: Serviço técnico de som"
          />
        </Field>

        <Field label="Status">
          <select
            className="form-input"
            value={expense.status}
            onChange={(event) =>
              onUpdate({ status: event.target.value as ExpenseWorkflowStatus })
            }
          >
            {expenseStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>

        <Field label="Tipo de favorecido">
          <select
            className="form-input"
            value={expense.beneficiaryKind}
            onChange={(event) =>
              onUpdate({
                beneficiaryKind: event.target.value as BeneficiaryKind,
                teamMemberId: "",
                beneficiaryName: "",
                beneficiaryDocument: "",
                beneficiaryPhone: "",
                beneficiaryEmail: "",
              })
            }
          >
            <option>Equipe</option>
            <option>Fornecedor externo</option>
          </select>
        </Field>

        {expense.beneficiaryKind === "Equipe" ? (
          <Field label="Selecionar pessoa da equipe">
            <select
              className="form-input"
              value={expense.teamMemberId ?? ""}
              onChange={(event) => onSelectTeamMember(event.target.value)}
            >
              <option value="">Escolha uma pessoa...</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} — {member.role}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Fornecedor externo">
            <input
              className="form-input"
              value={expense.beneficiaryName}
              onChange={(event) => onUpdate({ beneficiaryName: event.target.value })}
              placeholder="Nome ou razão social"
            />
          </Field>
        )}

        <Field label="Nome/Razão social">
          <input
            className="form-input"
            value={expense.beneficiaryName}
            onChange={(event) => onUpdate({ beneficiaryName: event.target.value })}
          />
        </Field>

        <Field label="CPF/CNPJ">
          <input
            className="form-input"
            value={expense.beneficiaryDocument}
            onChange={(event) => onUpdate({ beneficiaryDocument: event.target.value })}
          />
        </Field>

        <Field label="Telefone">
          <input
            className="form-input"
            value={expense.beneficiaryPhone}
            onChange={(event) => onUpdate({ beneficiaryPhone: event.target.value })}
          />
        </Field>

        <Field label="E-mail">
          <input
            className="form-input"
            value={expense.beneficiaryEmail}
            onChange={(event) => onUpdate({ beneficiaryEmail: event.target.value })}
          />
        </Field>

        <Field label="Valor">
          <input
            className="form-input"
            type="number"
            value={expense.amount}
            onChange={(event) => onUpdate({ amount: Number(event.target.value) })}
          />
        </Field>

        <Field label="Data de pagamento">
          <input
            className="form-input"
            type="date"
            value={expense.paidAt}
            onChange={(event) => onUpdate({ paidAt: event.target.value })}
          />
        </Field>

        <Field label="Forma de pagamento">
          <select
            className="form-input"
            value={expense.paymentMethod}
            onChange={(event) => onUpdate({ paymentMethod: event.target.value })}
          >
            {paymentMethods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </Field>

        <Field label="Observações">
          <input
            className="form-input"
            value={expense.notes}
            onChange={(event) => onUpdate({ notes: event.target.value })}
            placeholder="Pendências, conferência, observações do contador..."
          />
        </Field>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-primary" />
          <h4 className="font-black text-slate-950">Checklist de prestação de contas</h4>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ChecklistItem
            ok={Boolean(expense.beneficiaryName && expense.beneficiaryDocument)}
            label="Favorecido identificado"
          />
          <ChecklistItem
            ok={expense.attachments.some(
              (attachment) =>
                attachment.fileDataUrl &&
                attachment.status !== "Recusado" &&
                !attachment.type.toLowerCase().includes("pagamento") &&
                !attachment.type.toLowerCase().includes("bancário") &&
                !attachment.type.toLowerCase().includes("pix"),
            )}
            label="Documento fiscal/recibo"
          />
          <ChecklistItem
            ok={expense.attachments.some(
              (attachment) =>
                attachment.fileDataUrl &&
                attachment.status !== "Recusado" &&
                (attachment.type.toLowerCase().includes("pagamento") ||
                  attachment.type.toLowerCase().includes("bancário") ||
                  attachment.type.toLowerCase().includes("pix")),
            )}
            label="Comprovante de pagamento"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2">
          <Paperclip className="size-5 text-primary" />
          <h4 className="font-black text-slate-950">Anexos financeiros da despesa</h4>
        </div>

        <div className="mt-3 grid gap-3">
          {expense.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                    {attachment.fileDataUrl ? (
                      <FileCheck2 className="size-5" />
                    ) : (
                      <FileText className="size-5" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="font-black text-slate-950">{attachment.type}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {attachment.fileName || "Nenhum arquivo anexado"} · {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                </div>

                <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-black ${attachmentTone(attachment.status)}`}>
                  {attachment.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
                <input
                  className="form-input"
                  value={attachment.notes ?? ""}
                  onChange={(event) =>
                    onUpdateAttachment(attachment.id, { notes: event.target.value })
                  }
                  placeholder="Observação do prestador de contas..."
                />

                <select
                  className="form-input"
                  value={attachment.status}
                  onChange={(event) =>
                    onUpdateAttachment(attachment.id, {
                      status: event.target.value as FinancialDocumentStatus,
                    })
                  }
                >
                  <option>Pendente</option>
                  <option>Anexado</option>
                  <option>Conferido</option>
                  <option>Recusado</option>
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                  <UploadCloud className="mr-2 size-4" />
                  Anexar/substituir
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,image/png,image/jpeg,image/webp,.doc,.docx,.xls,.xlsx"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      void onUploadAttachment(attachment.id, event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!attachment.fileDataUrl}
                  onClick={() => onPreviewAttachment(attachment)}
                >
                  <FileText className="size-4" />
                  Visualizar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!attachment.fileDataUrl}
                  onClick={() => downloadAttachment(attachment)}
                >
                  <Download className="size-4" />
                  Baixar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!attachment.fileDataUrl}
                  onClick={() => onRemoveAttachmentFile(attachment.id)}
                >
                  <X className="size-4" />
                  Apagar arquivo
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={
        ok
          ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700"
          : "rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800"
      }
    >
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
        {label}
      </div>
    </div>
  );
}
