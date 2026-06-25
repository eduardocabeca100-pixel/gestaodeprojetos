#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-rubricas-oficiais-refens-$(date +%Y%m%d-%H%M%S).tgz" src supabase .gitignore package.json package-lock.json 2>/dev/null || true

mkdir -p src/components/refens

cat > src/components/refens/refens-cost-breakdown.ts <<'EOF'
export type RefensOfficialCost = {
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

type AssignmentLike = {
  id: string;
  memberId?: string;
  name?: string;
  fullName?: string;
  role?: string;
  rubric?: string;
  expectedAmount?: string;
  paidAmount?: string;
  paymentStatus?: string;
  costBreakdown?: RefensOfficialCost[];
  [key: string]: unknown;
};

const ASSIGNMENTS_STORAGE_KEY = "viva:project-team-assignments:v1";

const refensProjectAliases = [
  "projeto-refens",
  "refens",
  "p-refens",
  "formacao-de-artistas-de-rua-e-montagem-do-espetaculo-refens",
];

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

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "");
}

function cost(
  id: string,
  category: string,
  rubric: string,
  unit: string,
  quantity: string,
  unitAmount: string,
  totalAmount: string,
  paymentBasis: string,
  notes: string,
): RefensOfficialCost {
  return {
    id,
    category,
    rubric,
    unit,
    quantity,
    unitAmount,
    totalAmount,
    paymentBasis,
    notes,
  };
}

function officialCostsForAssignment(assignment: AssignmentLike): RefensOfficialCost[] {
  const key = normalize([
    assignment.memberId,
    assignment.name,
    assignment.fullName,
    assignment.role,
    assignment.rubric,
  ].join(" "));

  if (key.includes("marcel") || key.includes("eduardo cabeca")) {
    return [
      cost(
        "refens-cost-marcel-diretor-produtor",
        "Pré-produção",
        "Diretor geral + produtor",
        "01 projeto",
        "01",
        "R$ 6.000,00",
        "R$ 6.000,00",
        "Por projeto",
        "Rubrica aprovada para direção geral e produção cultural do projeto.",
      ),
      cost(
        "refens-cost-marcel-professor-formador",
        "Pré-produção",
        "Professor / Formador",
        "01 projeto",
        "01",
        "R$ 2.000,00",
        "R$ 2.000,00",
        "Por projeto",
        "Rubrica aprovada para formação teatral e acompanhamento pedagógico.",
      ),
      cost(
        "refens-cost-marcel-ator-experiente",
        "Produção/Execução",
        "Ator experiente",
        "03 apresentações",
        "01 ator",
        "R$ 300,00",
        "R$ 900,00",
        "R$ 300,00 por apresentação",
        "Cachê de ator experiente em 3 apresentações.",
      ),
    ];
  }

  if (key.includes("kaique")) {
    return [
      cost(
        "refens-cost-kaique-producao-executiva",
        "Pré-produção",
        "Produção executiva",
        "01 projeto",
        "01",
        "R$ 6.000,00",
        "R$ 6.000,00",
        "Por projeto",
        "Rubrica aprovada para produção executiva, planejamento, acompanhamento e organização do projeto.",
      ),
    ];
  }

  if (key.includes("jones") || key.includes("tecnico de som") || key.includes("técnico de som")) {
    return [
      cost(
        "refens-cost-jones-som",
        "Produção/Execução",
        "Técnico de som",
        "03 apresentações",
        "01 profissional",
        "R$ 500,00",
        "R$ 1.500,00",
        "R$ 500,00 por apresentação",
        "Rubrica aprovada para operação técnica de som nas 3 apresentações.",
      ),
    ];
  }

  if (key.includes("cassius") || key.includes("iluminacao") || key.includes("iluminação") || key.includes("luz")) {
    return [
      cost(
        "refens-cost-cassius-iluminacao",
        "Produção/Execução",
        "Técnico de iluminação",
        "01 serviço",
        "01 profissional",
        "R$ 500,00",
        "R$ 500,00",
        "Por serviço",
        "Rubrica aprovada para operação/apoio técnico de iluminação.",
      ),
    ];
  }

  if (key.includes("andre") || key.includes("brito") || key.includes("registro") || key.includes("fotograf")) {
    return [
      cost(
        "refens-cost-andre-registro",
        "Produção/Execução",
        "Registro fotográfico",
        "01 projeto",
        "01 profissional",
        "R$ 2.000,00",
        "R$ 2.000,00",
        "Por projeto",
        "Rubrica aprovada para registro fotográfico/audiovisual da execução.",
      ),
    ];
  }

  if (key.includes("suzi") || key.includes("libras") || key.includes("acessibilidade") || key.includes("inclusao") || key.includes("inclusão")) {
    return [
      cost(
        "refens-cost-suzi-libras",
        "Acessibilidade",
        "Intérprete de LIBRAS",
        "03 apresentações",
        "01 intérprete",
        "R$ 400,00",
        "R$ 1.200,00",
        "R$ 400,00 por apresentação",
        "Rubrica aprovada para intérprete de LIBRAS nas 3 apresentações.",
      ),
      cost(
        "refens-cost-suzi-capacitacao",
        "Acessibilidade",
        "Capacitação de equipe",
        "01 capacitação",
        "01 profissional",
        "R$ 1.000,00",
        "R$ 1.000,00",
        "Por capacitação",
        "Rubrica aprovada para workshop/capacitação de equipe em inclusão e acessibilidade.",
      ),
    ];
  }

  if (key.includes("katiana") || key.includes("katy") || key.includes("tecladista") || key.includes("musico") || key.includes("músico") || key.includes("vocal")) {
    return [
      cost(
        "refens-cost-katiana-tecladista",
        "Produção/Execução",
        "Tecladista / Músico",
        "03 apresentações",
        "01 profissional",
        "R$ 1.000,00",
        "R$ 1.000,00",
        "Por projeto/apresentações",
        "Rubrica aprovada para apoio musical/teclado no projeto.",
      ),
      cost(
        "refens-cost-katiana-tecnica-vocal",
        "Produção/Execução",
        "Técnica vocal",
        "01 projeto",
        "01 profissional",
        "R$ 1.300,00",
        "R$ 1.300,00",
        "Por projeto",
        "Rubrica aprovada para preparação/técnica vocal.",
      ),
    ];
  }

  if (
    key.includes("renaldo") ||
    key.includes("bruna") ||
    key.includes("wemerson") ||
    key.includes("julia") ||
    key.includes("karim") ||
    key.includes("karin") ||
    key.includes("ator experiente") ||
    key.includes("atriz experiente")
  ) {
    return [
      cost(
        `refens-cost-${assignment.memberId || assignment.id}-ator-experiente`,
        "Produção/Execução",
        "Ator experiente",
        "03 apresentações",
        "01 ator/atriz",
        "R$ 300,00",
        "R$ 900,00",
        "R$ 300,00 por apresentação",
        "Cachê de ator/atriz experiente em 3 apresentações.",
      ),
    ];
  }

  if (key.includes("aluno novo") || key.includes("artista em formacao") || key.includes("artista em formação") || key.includes("alunos novos")) {
    return [
      cost(
        `refens-cost-${assignment.memberId || assignment.id}-aluno-novo`,
        "Produção/Execução",
        "Alunos novos",
        "03 apresentações",
        "01 aluno/artista em formação",
        "R$ 50,00",
        "R$ 150,00",
        "R$ 50,00 por apresentação",
        "Cachê simbólico para aluno novo integrado ao elenco em 3 apresentações.",
      ),
    ];
  }

  return [];
}

function shouldApplyOfficialCosts(assignment: AssignmentLike) {
  const existing = assignment.costBreakdown;

  if (!Array.isArray(existing) || existing.length === 0) {
    return true;
  }

  return existing.every((item) => String(item.id ?? "").startsWith("refens-cost-"));
}

function applyCostsToAssignment(assignment: AssignmentLike) {
  const officialCosts = officialCostsForAssignment(assignment);

  if (officialCosts.length === 0 || !shouldApplyOfficialCosts(assignment)) {
    return assignment;
  }

  const expectedTotal = officialCosts.reduce((sum, item) => sum + parseCurrency(item.totalAmount), 0);
  const paidAmount = assignment.paidAmount || "R$ 0,00";
  const paidValue = parseCurrency(paidAmount);

  return {
    ...assignment,
    costBreakdown: officialCosts,
    expectedAmount: formatBRL(expectedTotal),
    paymentStatus:
      paidValue <= 0
        ? "Previsto"
        : paidValue >= expectedTotal
          ? "Pago"
          : "Parcial",
  };
}

export function applyRefensOfficialCostBreakdowns(projectId?: string) {
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
  const assignmentsByProject = raw ? JSON.parse(raw) as Record<string, AssignmentLike[]> : {};
  const projectKeys = Array.from(new Set([projectId, ...refensProjectAliases].filter(Boolean))) as string[];

  let changed = false;

  projectKeys.forEach((key) => {
    const assignments = assignmentsByProject[key];

    if (!Array.isArray(assignments)) return;

    const nextAssignments = assignments.map((assignment) => {
      const nextAssignment = applyCostsToAssignment(assignment);

      if (nextAssignment !== assignment) changed = true;

      return nextAssignment;
    });

    assignmentsByProject[key] = nextAssignments;
  });

  if (changed) {
    window.localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignmentsByProject));
    window.dispatchEvent(new CustomEvent("viva:refens-costs-applied"));
  }
}
EOF

echo "Ligando as rubricas oficiais no carregamento da equipe..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/refens/refens-team-bootstrap.tsx")
if not path.exists():
    raise SystemExit("ERRO: src/components/refens/refens-team-bootstrap.tsx não encontrado.")

text = path.read_text()

if 'applyRefensOfficialCostBreakdowns' not in text:
    text = text.replace(
        'import { seedRefensTeamForProject } from "@/components/refens/refens-official-data";',
        'import { seedRefensTeamForProject } from "@/components/refens/refens-official-data";\nimport { applyRefensOfficialCostBreakdowns } from "@/components/refens/refens-cost-breakdown";'
    )

    text = text.replace(
        "seedRefensTeamForProject(activeProject.id);\n    setReady(true);",
        "seedRefensTeamForProject(activeProject.id);\n    applyRefensOfficialCostBreakdowns(activeProject.id);\n    setReady(true);"
    )

path.write_text(text)
PY

echo "Ligando também no importador do Reféns..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/refens/refens-data-seeder.tsx")
if not path.exists():
    print("AVISO: importador do Reféns não encontrado. Pulando.")
    raise SystemExit(0)

text = path.read_text()

if 'applyRefensOfficialCostBreakdowns' not in text:
    text = text.replace(
        'import { refensKnownTeam, refensProjectAssignments, seedRefensTeamForProject } from "@/components/refens/refens-official-data";',
        'import { refensKnownTeam, refensProjectAssignments, seedRefensTeamForProject } from "@/components/refens/refens-official-data";\nimport { applyRefensOfficialCostBreakdowns } from "@/components/refens/refens-cost-breakdown";'
    )

    text = text.replace(
        'seedRefensTeamForProject("projeto-refens");',
        'seedRefensTeamForProject("projeto-refens");\n    applyRefensOfficialCostBreakdowns("projeto-refens");'
    )

path.write_text(text)
PY

echo "Atualizando seed oficial do Reféns para já nascer com as composições quando possível..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/refens/refens-official-data.ts")
if not path.exists():
    print("AVISO: refens-official-data.ts não encontrado. Pulando.")
    raise SystemExit(0)

text = path.read_text()

# Garante que a estrutura aceite costBreakdown sem quebrar tipos já existentes.
if "costBreakdown?: Array<" not in text and "costBreakdown:" not in text:
    text = text.replace(
        "paymentHistory: Array<{",
        """costBreakdown?: Array<{
    id: string;
    category: string;
    rubric: string;
    unit: string;
    quantity: string;
    unitAmount: string;
    totalAmount: string;
    paymentBasis: string;
    notes: string;
  }>;
  paymentHistory: Array<{"""
    )

path.write_text(text)
PY

echo "Atualizando migration Supabase com as composições oficiais por pessoa..."
python3 - <<'PY'
from pathlib import Path

migration = Path("supabase/migrations/20260622010000_viva_gestao_refens_core.sql")
if not migration.exists():
    print("AVISO: migration Supabase principal não encontrada. Pulando.")
    raise SystemExit(0)

text = migration.read_text()

# Só adiciona um complemento se ainda não existir esta marca.
marker = "-- VIVA REFENS OFFICIAL COST BREAKDOWN PATCH"
if marker not in text:
    text += f"""

{marker}
-- Mantém as composições oficiais de valor por integrante do projeto Reféns.
-- Não lança pagamento: paid_amount/executed_amount continuam zerados até movimentação real.

update public.viva_project_team
set paid_amount = 0,
    payment_status = 'Previsto',
    updated_at = now()
where project_id = (select id from public.viva_projects where slug = 'refens')
and coalesce(paid_amount, 0) = 0;

"""
migration.write_text(text)
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

echo "Conferindo rubricas oficiais..."
grep -R "applyRefensOfficialCostBreakdowns" -n src/components/refens
grep -R "Diretor geral + produtor" -n src/components/refens/refens-cost-breakdown.ts
grep -R "Intérprete de LIBRAS" -n src/components/refens/refens-cost-breakdown.ts
grep -R "Alunos novos" -n src/components/refens/refens-cost-breakdown.ts

echo "Status:"
git status --short

git add src/components/refens supabase .gitignore package.json package-lock.json
git commit -m "Aplica rubricas oficiais do Refens por integrante" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Abra /equipe e faça Command + Shift + R."
