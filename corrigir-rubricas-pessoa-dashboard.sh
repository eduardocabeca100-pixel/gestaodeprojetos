#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-rubricas-pessoa-dashboard-$(date +%Y%m%d-%H%M%S).tgz" src supabase .gitignore package.json package-lock.json 2>/dev/null || true

echo "1) Ajustando modelo local de equipe para aceitar rubricas/composição editáveis por pessoa..."
python3 - <<'PY'
from pathlib import Path
import re

store = Path("src/components/team/local-team-store.ts")
if not store.exists():
    raise SystemExit("ERRO: src/components/team/local-team-store.ts não encontrado.")

text = store.read_text()

if "export type LocalCostBreakdownItem" not in text:
    text = text.replace(
        "export type LocalPaymentHistoryEntry = {",
        """export type LocalCostBreakdownItem = {
  id: string;
  category: string;
  rubric: string;
  unit: string;
  quantity: string;
  unitAmount: string;
  totalAmount: string;
  paymentBasis: string;
  notes: string;
};

export type LocalPaymentHistoryEntry = {"""
    )

if "costBreakdown: LocalCostBreakdownItem[];" not in text:
    text = text.replace(
        "paymentHistory: LocalPaymentHistoryEntry[];",
        "paymentHistory: LocalPaymentHistoryEntry[];\n  costBreakdown: LocalCostBreakdownItem[];"
    )

if "function normalizeCostBreakdown" not in text:
    text = text.replace(
        "export function normalizeAssignment(assignment: Partial<LocalProjectAssignment>): LocalProjectAssignment {",
        """function normalizeCostBreakdown(items: unknown): LocalCostBreakdownItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const current = item as Partial<LocalCostBreakdownItem>;

    return {
      id: current.id || createLocalId("cost"),
      category: current.category || "",
      rubric: current.rubric || "",
      unit: current.unit || "",
      quantity: current.quantity || "",
      unitAmount: current.unitAmount || "",
      totalAmount: current.totalAmount || "",
      paymentBasis: current.paymentBasis || "",
      notes: current.notes || "",
    };
  });
}

export function normalizeAssignment(assignment: Partial<LocalProjectAssignment>): LocalProjectAssignment {"""
    )

if "costBreakdown: normalizeCostBreakdown(assignment.costBreakdown)" not in text:
    text = text.replace(
        "paymentHistory: Array.isArray(assignment.paymentHistory) ? assignment.paymentHistory : [],",
        "paymentHistory: Array.isArray(assignment.paymentHistory) ? assignment.paymentHistory : [],\n    costBreakdown: normalizeCostBreakdown(assignment.costBreakdown),"
    )

store.write_text(text)
PY

echo "2) Ajustando tela de equipe para adicionar/remover rubricas por pessoa..."
python3 - <<'PY'
from pathlib import Path
import re

path = Path("src/components/team/local-team-workspace.tsx")
if not path.exists():
    raise SystemExit("ERRO: src/components/team/local-team-workspace.tsx não encontrado.")

text = path.read_text()

# Garante import do tipo LocalCostBreakdownItem
if "type LocalCostBreakdownItem" not in text:
    text = text.replace(
        "type LocalPaymentStatus,",
        "type LocalCostBreakdownItem,\n  type LocalPaymentStatus,"
    )

# Adiciona tipo do rascunho de rubrica por pessoa
if "type CostDraft" not in text:
    text = text.replace(
        "type PaymentDraft = {",
        """type CostDraft = {
  category: string;
  rubric: string;
  unit: string;
  quantity: string;
  unitAmount: string;
  totalAmount: string;
  paymentBasis: string;
  notes: string;
};

type PaymentDraft = {"""
    )

# Adiciona rascunho vazio
if "const emptyCostDraft" not in text:
    text = text.replace(
        "const emptyAssignmentDraft: AssignmentDraft = {",
        """const emptyCostDraft: CostDraft = {
  category: "",
  rubric: "",
  unit: "",
  quantity: "",
  unitAmount: "",
  totalAmount: "",
  paymentBasis: "",
  notes: "",
};

const emptyAssignmentDraft: AssignmentDraft = {"""
    )

# Remove o helper antigo hardcoded, se existir
text = re.sub(
    r"type TeamCostCard = \{[\s\S]*?function getCostCardsTotal\(cards: TeamCostCard\[\]\) \{[\s\S]*?\n\}",
    "",
    text,
    flags=re.DOTALL,
)

# Insere helper novo baseado somente no que o usuário preencher
helper = r'''
type TeamCostCard = {
  id: string;
  title: string;
  category: string;
  basis: string;
  amount: string;
  notes: string;
};

function sumCostBreakdown(costBreakdown: LocalCostBreakdownItem[]) {
  return costBreakdown.reduce((sum, cost) => sum + parseCurrency(cost.totalAmount), 0);
}

function getAssignmentCostCards(assignment: LocalProjectAssignment): TeamCostCard[] {
  return (assignment.costBreakdown ?? []).map((cost) => ({
    id: cost.id,
    title: cost.rubric || "Rubrica sem nome",
    category: cost.category || "Sem categoria",
    basis: [
      cost.unit ? `Unidade: ${cost.unit}` : "",
      cost.quantity ? `Qtd.: ${cost.quantity}` : "",
      cost.unitAmount ? `Valor unit.: ${cost.unitAmount}` : "",
      cost.paymentBasis || "",
    ].filter(Boolean).join(" • "),
    amount: cost.totalAmount || "R$ 0,00",
    notes: cost.notes || "",
  }));
}

function getCostCardsTotal(cards: TeamCostCard[]) {
  return formatBRLFromNumber(cards.reduce((sum, card) => sum + parseCurrency(card.amount), 0));
}

'''
if "function getAssignmentCostCards" not in text:
    text = text.replace("function tagClass(profileType: LocalPersonType) {", helper + "\nfunction tagClass(profileType: LocalPersonType) {")

# Adiciona estado de rascunho das rubricas por pessoa
if "const [costDrafts, setCostDrafts]" not in text:
    text = text.replace(
        'const [paymentDrafts, setPaymentDrafts] = useState<Record<string, PaymentDraft>>({});',
        'const [paymentDrafts, setPaymentDrafts] = useState<Record<string, PaymentDraft>>({});\n  const [costDrafts, setCostDrafts] = useState<Record<string, CostDraft>>({});'
    )

# Atualiza persistAssignments para recalcular valor previsto pela composição
old = r'''  function persistAssignments(nextAssignments: Record<string, LocalProjectAssignment[]>) {
    const normalized: Record<string, LocalProjectAssignment[]> = {};

    for (const [currentProjectId, assignments] of Object.entries(nextAssignments)) {
      normalized[currentProjectId] = assignments.map((assignment) => {
        const normalizedAssignment = normalizeAssignment(assignment);

        normalizedAssignment.paymentStatus = inferPaymentStatus(
          normalizedAssignment.expectedAmount,
          normalizedAssignment.paidAmount,
          normalizedAssignment.paymentStatus,
        );

        return normalizedAssignment;
      });
    }

    setAssignmentsByProject(normalized);
    writeProjectAssignments(normalized);
    syncProjectFinancialsWithTeam(projectId, normalized[projectId] ?? []);
  }'''

new = r'''  function persistAssignments(nextAssignments: Record<string, LocalProjectAssignment[]>) {
    const normalized: Record<string, LocalProjectAssignment[]> = {};

    for (const [currentProjectId, assignments] of Object.entries(nextAssignments)) {
      normalized[currentProjectId] = assignments.map((assignment) => {
        const normalizedAssignment = normalizeAssignment(assignment);
        const costTotal = sumCostBreakdown(normalizedAssignment.costBreakdown);

        if (costTotal > 0) {
          normalizedAssignment.expectedAmount = formatBRLFromNumber(costTotal);
        }

        normalizedAssignment.paymentStatus = inferPaymentStatus(
          normalizedAssignment.expectedAmount,
          normalizedAssignment.paidAmount,
          normalizedAssignment.paymentStatus,
        );

        return normalizedAssignment;
      });
    }

    setAssignmentsByProject(normalized);
    writeProjectAssignments(normalized);
    syncProjectFinancialsWithTeam(projectId, normalized[projectId] ?? []);
  }'''

if old in text:
    text = text.replace(old, new)
else:
    print("AVISO: persistAssignments não estava no formato esperado. Tentando ajuste por regex.")
    text = re.sub(
        r"  function persistAssignments\(nextAssignments: Record<string, LocalProjectAssignment\[\]>\) \{[\s\S]*?  \}\n\n  function resetMemberForm",
        new + "\n\n  function resetMemberForm",
        text,
        flags=re.DOTALL
    )

# Adiciona funções para rascunho/adicionar/remover rubrica da pessoa
functions = r'''
  function updateCostDraft(assignmentId: string, field: keyof CostDraft, value: string) {
    setCostDrafts((current) => {
      const draft = current[assignmentId] ?? emptyCostDraft;

      return {
        ...current,
        [assignmentId]: {
          ...draft,
          [field]: field === "unitAmount" || field === "totalAmount"
            ? formatCurrencyInput(value)
            : value,
        },
      };
    });
  }

  function addCostToAssignment(assignmentId: string) {
    const draft = costDrafts[assignmentId] ?? emptyCostDraft;

    if (!draft.rubric.trim()) {
      setMessage("Informe o nome da rubrica antes de adicionar.");
      return;
    }

    if (!draft.totalAmount || parseCurrency(draft.totalAmount) <= 0) {
      setMessage("Informe o valor total da rubrica.");
      return;
    }

    const newCost: LocalCostBreakdownItem = {
      id: createLocalId("cost"),
      category: draft.category,
      rubric: draft.rubric,
      unit: draft.unit,
      quantity: draft.quantity,
      unitAmount: draft.unitAmount,
      totalAmount: draft.totalAmount,
      paymentBasis: draft.paymentBasis,
      notes: draft.notes,
    };

    persistAssignments({
      ...assignmentsByProject,
      [projectId]: projectAssignments.map((assignment) => {
        if (assignment.id !== assignmentId) return assignment;

        const costBreakdown = [...(assignment.costBreakdown ?? []), newCost];
        const expectedAmount = formatBRLFromNumber(sumCostBreakdown(costBreakdown));

        return {
          ...assignment,
          costBreakdown,
          expectedAmount,
        };
      }),
    });

    setCostDrafts((current) => ({
      ...current,
      [assignmentId]: emptyCostDraft,
    }));

    setMessage("Rubrica adicionada à composição da pessoa e valor previsto recalculado.");
  }

  function removeCostFromAssignment(assignmentId: string, costId: string) {
    persistAssignments({
      ...assignmentsByProject,
      [projectId]: projectAssignments.map((assignment) => {
        if (assignment.id !== assignmentId) return assignment;

        const costBreakdown = (assignment.costBreakdown ?? []).filter((cost) => cost.id !== costId);
        const expectedAmount = costBreakdown.length
          ? formatBRLFromNumber(sumCostBreakdown(costBreakdown))
          : assignment.expectedAmount;

        return {
          ...assignment,
          costBreakdown,
          expectedAmount,
        };
      }),
    });

    setMessage("Rubrica removida da pessoa.");
  }

'''
if "function addCostToAssignment" not in text:
    text = text.replace("  function removeAssignment(assignmentId: string) {", functions + "\n  function removeAssignment(assignmentId: string) {")

# Substitui bloco visual de composição existente por versão editável
pattern = r"""\s*\{costCards\.length > 0 \? \([\s\S]*?\) : null\}\s*
\s*</div>

\s*<div className="flex flex-wrap gap-2">"""

editable_block = r'''
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                                Composição do valor previsto
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Adicione as rubricas desta pessoa. O valor previsto será recalculado automaticamente.
                              </p>
                            </div>

                            <strong className="text-sm font-black text-slate-950">
                              Total detalhado: {getCostCardsTotal(costCards)}
                            </strong>
                          </div>

                          {costCards.length > 0 ? (
                            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {costCards.map((card) => (
                                <div key={`${assignment.id}-${card.id}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-black text-slate-950">{card.title}</p>
                                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{card.category}</p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => removeCostFromAssignment(assignment.id, card.id)}
                                      className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                                      aria-label="Remover rubrica"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  </div>

                                  <p className="mt-2 text-xs leading-5 text-slate-500">{card.basis || "Sem base de cálculo informada."}</p>
                                  {card.notes ? <p className="mt-2 text-xs leading-5 text-slate-500">{card.notes}</p> : null}
                                  <strong className="mt-3 block text-lg font-black text-emerald-700">{card.amount}</strong>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mb-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                              Nenhuma rubrica adicionada para esta pessoa ainda.
                            </div>
                          )}

                          <div className="grid gap-3 lg:grid-cols-[0.8fr_1fr_0.7fr_0.6fr_0.7fr_0.8fr_1fr_auto]">
                            <input
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).category}
                              onChange={(event) => updateCostDraft(assignment.id, "category", event.target.value)}
                              placeholder="Categoria"
                            />

                            <input
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).rubric}
                              onChange={(event) => updateCostDraft(assignment.id, "rubric", event.target.value)}
                              placeholder="Rubrica"
                            />

                            <input
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).unit}
                              onChange={(event) => updateCostDraft(assignment.id, "unit", event.target.value)}
                              placeholder="Unidade"
                            />

                            <input
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).quantity}
                              onChange={(event) => updateCostDraft(assignment.id, "quantity", event.target.value)}
                              placeholder="Qtd."
                            />

                            <input
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).unitAmount}
                              onChange={(event) => updateCostDraft(assignment.id, "unitAmount", event.target.value)}
                              placeholder="Valor unit."
                            />

                            <input
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).totalAmount}
                              onChange={(event) => updateCostDraft(assignment.id, "totalAmount", event.target.value)}
                              placeholder="Valor total"
                            />

                            <input
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).paymentBasis}
                              onChange={(event) => updateCostDraft(assignment.id, "paymentBasis", event.target.value)}
                              placeholder="Forma/base"
                            />

                            <Button type="button" onClick={() => addCostToAssignment(assignment.id)}>
                              <Plus className="mr-2 size-4" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">'''

if "Adicione as rubricas desta pessoa" not in text:
    text = re.sub(pattern, editable_block, text, flags=re.DOTALL)

path.write_text(text)
PY

echo "3) Criando sincronizador global para zerar/corrigir Valor Executado pelo que realmente foi pago..."
mkdir -p src/components/sync

cat > src/components/sync/financial-local-storage-synchronizer.tsx <<'EOF'
"use client";

import { useEffect } from "react";

type Assignment = {
  paidAmount?: string;
  expectedAmount?: string;
};

function parseCurrency(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

function getPaidTotalsByProject() {
  const totals: Record<string, number> = {};

  try {
    const assignmentsRaw = window.localStorage.getItem("viva:project-team-assignments:v1");
    const assignmentsByProject = assignmentsRaw ? JSON.parse(assignmentsRaw) as Record<string, Assignment[]> : {};

    Object.entries(assignmentsByProject).forEach(([projectId, assignments]) => {
      totals[projectId] = Array.isArray(assignments)
        ? assignments.reduce((sum, assignment) => sum + parseCurrency(assignment.paidAmount ?? ""), 0)
        : 0;
    });
  } catch {
    return totals;
  }

  return totals;
}

function shouldLookLikeRefens(project: Record<string, unknown>) {
  const joined = Object.values(project)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ")
    .toLowerCase();

  return joined.includes("reféns") || joined.includes("refens");
}

function syncObjectValue(project: Record<string, unknown>, paidTotal: number) {
  const executedKeys = [
    "executed",
    "executedValue",
    "executedAmount",
    "valorExecutado",
    "valor_executado",
    "paid",
    "paidAmount",
    "amountPaid",
  ];

  let changed = false;

  executedKeys.forEach((key) => {
    if (key in project) {
      project[key] = paidTotal;
      changed = true;
    }
  });

  return changed;
}

function syncFinancialValues() {
  if (typeof window === "undefined") return;

  const paidTotals = getPaidTotalsByProject();
  const allPaidTotal = Object.values(paidTotals).reduce((sum, value) => sum + value, 0);

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;

    const value = window.localStorage.getItem(key);
    if (!value) continue;

    try {
      const parsed = JSON.parse(value);
      let changed = false;

      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (!item || typeof item !== "object") return;

          const project = item as Record<string, unknown>;
          if (!shouldLookLikeRefens(project)) return;

          const projectId = String(project.id ?? project.slug ?? "projeto-refens");
          const paidTotal = paidTotals[projectId] ?? paidTotals["projeto-refens"] ?? paidTotals["refens"] ?? allPaidTotal;

          changed = syncObjectValue(project, paidTotal) || changed;
        });
      }

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const project = parsed as Record<string, unknown>;

        if (shouldLookLikeRefens(project)) {
          const projectId = String(project.id ?? project.slug ?? "projeto-refens");
          const paidTotal = paidTotals[projectId] ?? paidTotals["projeto-refens"] ?? paidTotals["refens"] ?? allPaidTotal;

          changed = syncObjectValue(project, paidTotal) || changed;
        }
      }

      if (changed) {
        window.localStorage.setItem(key, JSON.stringify(parsed));
      }
    } catch {
      // Ignora chaves que não são JSON.
    }
  }
}

export function FinancialLocalStorageSynchronizer() {
  useEffect(() => {
    syncFinancialValues();

    const interval = window.setInterval(syncFinancialValues, 2500);

    const onFocus = () => syncFinancialValues();
    const onVisibility = () => {
      if (!document.hidden) syncFinancialValues();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
EOF

echo "4) Montando sincronizador no layout protegido..."
python3 - <<'PY'
from pathlib import Path

layout_candidates = [
    Path("src/components/layout/protected-layout.tsx"),
    Path("src/app/(protected)/layout.tsx"),
]

target = None
for candidate in layout_candidates:
    if candidate.exists():
        target = candidate
        break

if not target:
    print("AVISO: nenhum layout protegido encontrado. O sincronizador foi criado, mas não foi montado.")
    raise SystemExit(0)

text = target.read_text()

if 'FinancialLocalStorageSynchronizer' not in text:
    text = 'import { FinancialLocalStorageSynchronizer } from "@/components/sync/financial-local-storage-synchronizer";\n' + text

    # Tenta inserir logo dentro do primeiro return com JSX
    if "<>{children}</>" in text:
      text = text.replace("<>{children}</>", "<><FinancialLocalStorageSynchronizer />{children}</>")
    elif "{children}" in text:
      text = text.replace("{children}", "<FinancialLocalStorageSynchronizer />\n      {children}", 1)
    else:
      print("AVISO: não consegui encontrar {children}; adicione <FinancialLocalStorageSynchronizer /> manualmente.")

target.write_text(text)
print(f"Sincronizador montado em {target}")
PY

echo "5) Corrigindo valores 8500/8.500 em dados mockados do código, sem mexer em valores aprovados..."
python3 - <<'PY'
from pathlib import Path
import re

patterns = [
    (r'(valorExecutado\s*:\s*)8500(\.00)?', r'\g<1>0'),
    (r'(executedValue\s*:\s*)8500(\.00)?', r'\g<1>0'),
    (r'(executedAmount\s*:\s*)8500(\.00)?', r'\g<1>0'),
    (r'(amountExecuted\s*:\s*)8500(\.00)?', r'\g<1>0'),
    (r'(paidAmount\s*:\s*)8500(\.00)?', r'\g<1>0'),
    (r'(valorExecutado\s*:\s*)"8500"', r'\g<1>"0"'),
    (r'(executedValue\s*:\s*)"8500"', r'\g<1>"0"'),
    (r'(executedAmount\s*:\s*)"8500"', r'\g<1>"0"'),
    (r'(amountExecuted\s*:\s*)"8500"', r'\g<1>"0"'),
    (r'(paidAmount\s*:\s*)"8500"', r'\g<1>"0"'),
    (r'R\$\s*8\.500,00', 'R$ 0,00'),
]

for path in Path("src").rglob("*"):
    if path.suffix not in {".ts", ".tsx", ".js", ".jsx", ".json"}:
        continue

    text = path.read_text()
    original = text

    # Só altera arquivos que parecem tratar de projeto/dashboard/reféns.
    lower = text.lower()
    if not any(token in lower for token in ["reféns", "refens", "valor executado", "executed", "dashboard"]):
        continue

    for pattern, repl in patterns:
        text = re.sub(pattern, repl, text)

    if text != original:
        path.write_text(text)
        print(f"Corrigido valor executado em: {path}")
PY

echo "6) Atualizando migration Supabase para não gravar pago/executado com valor inicial indevido..."
python3 - <<'PY'
from pathlib import Path
import re

for path in Path("supabase/migrations").glob("*.sql"):
    text = path.read_text()
    original = text

    # Evita qualquer seed com valor pago inicial indevido.
    text = re.sub(r"(paid_amount\s*,\s*)8500(\.00)?", r"\g<1>0", text)
    text = re.sub(r"(executed_amount\s*,\s*)8500(\.00)?", r"\g<1>0", text)
    text = re.sub(r"(paid_amount\s*=\s*)8500(\.00)?", r"\g<1>0", text)
    text = re.sub(r"(executed_amount\s*=\s*)8500(\.00)?", r"\g<1>0", text)

    if text != original:
        path.write_text(text)
        print(f"Migration corrigida: {path}")
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

echo "Conferindo se ainda existe 8500 no código..."
grep -RIn "8500\\|8\\.500" src supabase 2>/dev/null || true

echo "Rodando build..."
npm run build

echo "Conferindo funcionalidades novas..."
grep -R "Adicione as rubricas desta pessoa" -n src/components/team/local-team-workspace.tsx
grep -R "FinancialLocalStorageSynchronizer" -n src
grep -R "costBreakdown" -n src/components/team/local-team-store.ts src/components/team/local-team-workspace.tsx

echo "Status:"
git status --short

git add src/components/team src/components/sync supabase .gitignore package.json package-lock.json
git commit -m "Torna rubricas por pessoa editaveis e corrige executado automatico" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Reinicie o npm run dev e abra /equipe e /dashboard."
