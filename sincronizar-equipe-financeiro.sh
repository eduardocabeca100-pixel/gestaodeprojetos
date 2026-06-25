#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-sync-equipe-financeiro-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

python3 - <<'PY'
from pathlib import Path
import re

path = Path("src/components/team/local-team-workspace.tsx")

if not path.exists():
    raise SystemExit("ERRO: src/components/team/local-team-workspace.tsx não encontrado.")

text = path.read_text()

helper = r'''
function normalizeFinancialKey(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function inferPaymentStatus(
  expectedAmount: string,
  paidAmount: string,
  currentStatus: LocalPaymentStatus = "Previsto",
): LocalPaymentStatus {
  const expected = parseCurrency(expectedAmount);
  const paid = parseCurrency(paidAmount);

  if (paid <= 0) {
    return currentStatus === "Pago" || currentStatus === "Parcial" ? "Pendente" : currentStatus;
  }

  if (expected > 0 && paid >= expected) {
    return "Pago";
  }

  return "Parcial";
}

function syncProjectFinancialsWithTeam(
  currentProjectId: string,
  assignments: LocalProjectAssignment[],
) {
  if (typeof window === "undefined") return;

  const key = `viva:gestao-avancada:${currentProjectId}`;
  const saved = window.localStorage.getItem(key);

  if (!saved) return;

  try {
    const data = JSON.parse(saved) as {
      pending?: unknown[];
      tasks?: unknown[];
      rubrics?: Array<Record<string, string>>;
    };

    const currentRubrics = Array.isArray(data.rubrics) ? data.rubrics : [];
    const byRubric = new Map<
      string,
      {
        name: string;
        expected: number;
        paid: number;
        count: number;
      }
    >();

    let totalExpected = 0;
    let totalPaid = 0;

    assignments.forEach((assignment) => {
      const expected = parseCurrency(assignment.expectedAmount);
      const paid = parseCurrency(assignment.paidAmount);

      totalExpected += expected;
      totalPaid += paid;

      const rubricName = assignment.rubric?.trim() || "Equipe sem rubrica";
      const rubricKey = normalizeFinancialKey(rubricName);

      const current = byRubric.get(rubricKey) ?? {
        name: rubricName,
        expected: 0,
        paid: 0,
        count: 0,
      };

      current.expected += expected;
      current.paid += paid;
      current.count += 1;

      byRubric.set(rubricKey, current);
    });

    const matchedKeys = new Set<string>();

    const updatedRubrics = currentRubrics.map((rubric) => {
      const name = rubric.name || "";
      const rubricKey = normalizeFinancialKey(name);
      const match = byRubric.get(rubricKey);

      if (!match) return rubric;

      matchedKeys.add(rubricKey);

      const currentApproved = rubric.approved || rubric.planned || "";
      const approved =
        parseCurrency(currentApproved) > 0
          ? currentApproved
          : formatBRLFromNumber(match.expected);

      const executed = formatBRLFromNumber(match.paid);

      return {
        ...rubric,
        approved,
        planned: approved,
        executed,
        paid: executed,
        quantity: rubric.quantity || `${match.count} pessoa(s)`,
        unit: rubric.unit || "Equipe",
        paymentBasis: rubric.paymentBasis || "Conforme pagamentos lançados na equipe",
      };
    });

    const missingRubrics = Array.from(byRubric.entries())
      .filter(([rubricKey]) => !matchedKeys.has(rubricKey))
      .map(([rubricKey, item]) => ({
        id: `rub-auto-${rubricKey.replace(/[^a-z0-9]+/g, "-")}`,
        category: "Equipe do projeto",
        name: item.name,
        unit: "Equipe",
        quantity: `${item.count} pessoa(s)`,
        paymentBasis: "Conforme pagamentos lançados na equipe",
        approved: formatBRLFromNumber(item.expected),
        planned: formatBRLFromNumber(item.expected),
        executed: formatBRLFromNumber(item.paid),
        paid: formatBRLFromNumber(item.paid),
        notes: "Rubrica criada automaticamente a partir dos pagamentos da equipe.",
      }));

    const summaryId = "rub-auto-pagamentos-equipe";
    const summaryRubric = {
      id: summaryId,
      category: "Resumo automático",
      name: "Pagamentos da equipe",
      unit: "Equipe",
      quantity: `${assignments.length} pessoa(s)`,
      paymentBasis: "Somatório dos valores previstos e pagos na equipe do projeto",
      approved: formatBRLFromNumber(totalExpected),
      planned: formatBRLFromNumber(totalExpected),
      executed: formatBRLFromNumber(totalPaid),
      paid: formatBRLFromNumber(totalPaid),
      notes: "Resumo automático. Atualiza sempre que pagamentos da equipe são alterados.",
    };

    const withoutOldSummary = updatedRubrics.filter((rubric) => rubric.id !== summaryId);

    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...data,
        rubrics: [summaryRubric, ...withoutOldSummary, ...missingRubrics],
      }),
    );
  } catch (error) {
    console.warn("Não foi possível sincronizar equipe com financeiro.", error);
  }
}

'''

if "function syncProjectFinancialsWithTeam" not in text:
    text = text.replace("function tagClass(profileType: LocalPersonType) {", helper + "\nfunction tagClass(profileType: LocalPersonType) {")

old_persist = r'''  function persistAssignments(nextAssignments: Record<string, LocalProjectAssignment[]>) {
    const normalized: Record<string, LocalProjectAssignment[]> = {};

    for (const [currentProjectId, assignments] of Object.entries(nextAssignments)) {
      normalized[currentProjectId] = assignments.map(normalizeAssignment);
    }

    setAssignmentsByProject(normalized);
    writeProjectAssignments(normalized);
  }'''

new_persist = r'''  function persistAssignments(nextAssignments: Record<string, LocalProjectAssignment[]>) {
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

if old_persist not in text:
    print("AVISO: não encontrei persistAssignments no formato esperado. Vou tentar regex.")
    text = re.sub(
        r"  function persistAssignments\(nextAssignments: Record<string, LocalProjectAssignment\[\]>\) \{[\s\S]*?  \}\n\n  function resetMemberForm",
        new_persist + "\n\n  function resetMemberForm",
        text,
    )
else:
    text = text.replace(old_persist, new_persist)

old_update = r'''  function updateAssignment(assignmentId: string, field: EditableAssignmentField, value: string) {
    const normalizedValue =
      field === "expectedAmount" || field === "paidAmount"
        ? formatCurrencyInput(value)
        : value;

    persistAssignments({
      ...assignmentsByProject,
      [projectId]: projectAssignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              [field]: field === "paymentStatus"
                ? (normalizedValue as LocalPaymentStatus)
                : field === "profileType"
                  ? (normalizedValue as LocalPersonType)
                  : normalizedValue,
            }
          : assignment,
      ),
    });
  }'''

new_update = r'''  function updateAssignment(assignmentId: string, field: EditableAssignmentField, value: string) {
    const normalizedValue =
      field === "expectedAmount" || field === "paidAmount"
        ? formatCurrencyInput(value)
        : value;

    persistAssignments({
      ...assignmentsByProject,
      [projectId]: projectAssignments.map((assignment) => {
        if (assignment.id !== assignmentId) return assignment;

        const updatedAssignment = {
          ...assignment,
          [field]: field === "paymentStatus"
            ? (normalizedValue as LocalPaymentStatus)
            : field === "profileType"
              ? (normalizedValue as LocalPersonType)
              : normalizedValue,
        };

        if (field === "expectedAmount" || field === "paidAmount") {
          updatedAssignment.paymentStatus = inferPaymentStatus(
            updatedAssignment.expectedAmount,
            updatedAssignment.paidAmount,
            updatedAssignment.paymentStatus,
          );
        }

        return updatedAssignment;
      }),
    });
  }'''

if old_update in text:
    text = text.replace(old_update, new_update)
else:
    print("AVISO: updateAssignment não encontrado no formato esperado.")

# Depois de criar normalized no saveProjectPerson, força status calculado
text = re.sub(
    r'(    const normalized = normalizeAssignment\(\{[\s\S]*?\n    \}\);\n)\n    if \(editingAssignmentId\)',
    r'\1\n    normalized.paymentStatus = inferPaymentStatus(\n      normalized.expectedAmount,\n      normalized.paidAmount,\n      normalized.paymentStatus,\n    );\n\n    if (editingAssignmentId)',
    text,
    count=1,
)

# Mostra status financeiro no card da pessoa
old_line = r'''                          <p><strong>Pago:</strong> {assignment.paidAmount || "R$ 0,00"} • <strong>Aberto:</strong> {formatBRLFromNumber(open)}</p>'''
new_line = r'''                          <p><strong>Pago:</strong> {assignment.paidAmount || "R$ 0,00"} • <strong>Aberto:</strong> {formatBRLFromNumber(open)}</p>
                          <p><strong>Status:</strong> {assignment.paymentStatus}</p>'''

if old_line in text and "<strong>Status:</strong> {assignment.paymentStatus}" not in text:
    text = text.replace(old_line, new_line)

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

echo "Conferindo sincronização..."
grep -R "syncProjectFinancialsWithTeam" -n src/components/team/local-team-workspace.tsx
grep -R "Pagamentos da equipe" -n src/components/team/local-team-workspace.tsx
grep -R "inferPaymentStatus" -n src/components/team/local-team-workspace.tsx

echo "Status:"
git status --short

git add src/components/team/local-team-workspace.tsx .gitignore package.json package-lock.json
git commit -m "Sincroniza pagamentos da equipe com financeiro do projeto" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. O Vercel deve iniciar o deploy automaticamente."
