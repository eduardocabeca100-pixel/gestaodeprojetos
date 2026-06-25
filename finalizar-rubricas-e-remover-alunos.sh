#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-final-rubricas-alunos-$(date +%Y%m%d-%H%M%S).tgz" src supabase .gitignore package.json package-lock.json 2>/dev/null || true

echo "1) Ajustando a tela de equipe para categoria e rubrica com opções prontas..."
python3 - <<'PY'
from pathlib import Path
import re

path = Path("src/components/team/local-team-workspace.tsx")
if not path.exists():
    raise SystemExit("ERRO: src/components/team/local-team-workspace.tsx não encontrado.")

text = path.read_text()

# Ajuste de tipo para o rascunho não exigir costBreakdown.
text = text.replace(
    'type AssignmentDraft = Omit<LocalProjectAssignment, "id" | "memberId" | "paymentHistory"> & {',
    'type AssignmentDraft = Omit<LocalProjectAssignment, "id" | "memberId" | "paymentHistory" | "costBreakdown"> & {',
)

if "const costCategoryOptions" not in text:
    text = text.replace(
        "const brlFormatter = new Intl.NumberFormat",
        '''const costCategoryOptions = [
  "Pré-produção",
  "Produção/Execução",
  "Acessibilidade",
  "Pós-produção",
  "Administrativo",
  "Equipe do projeto",
  "Outros",
];

const costRubricOptions = [
  "Diretor geral + produtor",
  "Direção artística",
  "Direção musical",
  "Professor / Formador",
  "Oficineiro",
  "Palestrante",
  "Produção executiva",
  "Produção de campo",
  "Ator experiente",
  "Atriz experiente",
  "Alunos novos",
  "Técnico de som",
  "Técnico de iluminação",
  "Tecladista / Músico",
  "Técnica vocal",
  "Figurino e maquiagem",
  "Cenografia",
  "Material de divulgação",
  "Transporte e logística",
  "Lanche / alunos e equipe",
  "Sonorização",
  "Registro fotográfico",
  "Registro audiovisual",
  "Intérprete de LIBRAS",
  "Capacitação de equipe",
  "Espaço para capacitação",
  "Materiais acessíveis",
  "Prestação de contas",
  "Contingências / imprevistos",
  "Outros",
];

const brlFormatter = new Intl.NumberFormat'''
    )

old_category = '''                            <input
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).category}
                              onChange={(event) => updateCostDraft(assignment.id, "category", event.target.value)}
                              placeholder="Categoria"
                            />'''

new_category = '''                            <select
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).category}
                              onChange={(event) => updateCostDraft(assignment.id, "category", event.target.value)}
                            >
                              <option value="">Categoria</option>
                              {costCategoryOptions.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>'''

if old_category in text:
    text = text.replace(old_category, new_category)

old_rubric = '''                            <input
                              className="viva-input"
                              value={(costDrafts[assignment.id] ?? emptyCostDraft).rubric}
                              onChange={(event) => updateCostDraft(assignment.id, "rubric", event.target.value)}
                              placeholder="Rubrica"
                            />'''

new_rubric = '''                            <div>
                              <input
                                className="viva-input"
                                list={`rubricas-refens-${assignment.id}`}
                                value={(costDrafts[assignment.id] ?? emptyCostDraft).rubric}
                                onChange={(event) => updateCostDraft(assignment.id, "rubric", event.target.value)}
                                placeholder="Rubrica"
                              />
                              <datalist id={`rubricas-refens-${assignment.id}`}>
                                {costRubricOptions.map((rubric) => (
                                  <option key={rubric} value={rubric} />
                                ))}
                              </datalist>
                            </div>'''

if old_rubric in text:
    text = text.replace(old_rubric, new_rubric)

# Fallback regex caso o trecho tenha variação de espaços.
if "costCategoryOptions.map" not in text:
    text = re.sub(
        r'''<input\s+className="viva-input"\s+value=\{\(costDrafts\[assignment\.id\] \?\? emptyCostDraft\)\.category\}\s+onChange=\{\(event\) => updateCostDraft\(assignment\.id, "category", event\.target\.value\)\}\s+placeholder="Categoria"\s+/>''',
        new_category,
        text,
        flags=re.DOTALL,
    )

if "rubricas-refens" not in text:
    text = re.sub(
        r'''<input\s+className="viva-input"\s+value=\{\(costDrafts\[assignment\.id\] \?\? emptyCostDraft\)\.rubric\}\s+onChange=\{\(event\) => updateCostDraft\(assignment\.id, "rubric", event\.target\.value\)\}\s+placeholder="Rubrica"\s+/>''',
        new_rubric,
        text,
        flags=re.DOTALL,
    )

path.write_text(text)
PY

echo "2) Removendo os 12 alunos placeholders da base oficial do Reféns..."
python3 - <<'PY'
from pathlib import Path
import re

path = Path("src/components/refens/refens-official-data.ts")
if not path.exists():
    raise SystemExit("ERRO: src/components/refens/refens-official-data.ts não encontrado.")

text = path.read_text()

# Remove export dos alunos placeholders.
text = re.sub(
    r"export const refensStudentAssignments: RefensProjectAssignment\[\] = Array\.from\(\{ length: 12 \}\)[\s\S]*?\n\}\);\n\n",
    "",
    text,
    flags=re.DOTALL,
)

# Remove students da lista final se ainda existir.
text = re.sub(
    r"export const refensProjectAssignments: RefensProjectAssignment\[\] = \[\s*\.\.\.refensKnownAssignments,\s*\.\.\.refensStudentAssignments,\s*\];",
    "export const refensProjectAssignments: RefensProjectAssignment[] = [\n  ...refensKnownAssignments,\n];",
    text,
    flags=re.DOTALL,
)

text = text.replace("  ...refensStudentAssignments,\n", "")

# Garante que mergeTeam limpe alunos antigos já salvos no navegador.
text = text.replace(
    "const current = Array.isArray(existing) ? existing : [];",
    '''const current = (Array.isArray(existing) ? existing : []).filter((member) => {
    const id = String(member.id ?? "");
    const name = String(member.name ?? member.fullName ?? "").toLowerCase();

    return !id.startsWith("refens-aluno-") && !name.startsWith("aluno novo");
  });'''
)

# Garante que mergeAssignments limpe alunos antigos já salvos no navegador.
text = text.replace(
    "const current = Array.isArray(existing) ? existing : [];",
    '''const current = (Array.isArray(existing) ? existing : []).filter((assignment) => {
    const memberId = String(assignment.memberId ?? "");
    const name = String(assignment.name ?? assignment.fullName ?? "").toLowerCase();

    return !memberId.startsWith("refens-aluno-") && !name.startsWith("aluno novo");
  });''',
    1
)

# Se a substituição acima atingiu mergeTeam e não mergeAssignments por duplicidade, corrige manualmente os dois blocos.
text = re.sub(
    r"function mergeTeam\(existing: RefensTeamMember\[\]\) \{\s*const current = \([\s\S]*?\);\s*const byId",
    '''function mergeTeam(existing: RefensTeamMember[]) {
  const current = (Array.isArray(existing) ? existing : []).filter((member) => {
    const id = String(member.id ?? "");
    const name = String(member.name ?? member.fullName ?? "").toLowerCase();

    return !id.startsWith("refens-aluno-") && !name.startsWith("aluno novo");
  });
  const byId''',
    text,
    flags=re.DOTALL,
)

text = re.sub(
    r"function mergeAssignments\(existing: RefensProjectAssignment\[\]\) \{\s*const current = \([\s\S]*?\);\s*const byMemberId",
    '''function mergeAssignments(existing: RefensProjectAssignment[]) {
  const current = (Array.isArray(existing) ? existing : []).filter((assignment) => {
    const memberId = String(assignment.memberId ?? "");
    const name = String(assignment.name ?? assignment.fullName ?? "").toLowerCase();

    return !memberId.startsWith("refens-aluno-") && !name.startsWith("aluno novo");
  });
  const byMemberId''',
    text,
    flags=re.DOTALL,
)

path.write_text(text)
PY

echo "3) Ajustando aplicador de rubricas oficiais para também limpar alunos placeholders..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/refens/refens-cost-breakdown.ts")
if not path.exists():
    print("AVISO: refens-cost-breakdown.ts não encontrado. Pulando.")
    raise SystemExit(0)

text = path.read_text()

if "function isStudentPlaceholder" not in text:
    text = text.replace(
        "function shouldApplyOfficialCosts",
        '''function isStudentPlaceholder(assignment: AssignmentLike) {
  const memberId = normalize(assignment.memberId);
  const name = normalize(`${assignment.name ?? ""} ${assignment.fullName ?? ""}`);

  return memberId.startsWith("refens-aluno-") || name.startsWith("aluno novo");
}

function shouldApplyOfficialCosts'''
    )

if "filter((assignment) => !isStudentPlaceholder(assignment))" not in text:
    text = text.replace(
        "const nextAssignments = assignments.map((assignment) => {",
        "const nextAssignments = assignments.filter((assignment) => !isStudentPlaceholder(assignment)).map((assignment) => {"
    )

path.write_text(text)
PY

echo "4) Criando migration Supabase para remover alunos placeholders..."
mkdir -p supabase/migrations

cat > supabase/migrations/20260622025000_remove_refens_student_placeholders.sql <<'EOF'
-- Remove placeholders de alunos novos do projeto Reféns.
-- Os alunos serão cadastrados manualmente quando forem selecionados.

delete from public.viva_project_team_costs
where project_team_id in (
  select pt.id
  from public.viva_project_team pt
  join public.viva_team_members tm on tm.id = pt.team_member_id
  where tm.external_key like 'refens-aluno-%'
);

delete from public.viva_project_payments
where project_team_id in (
  select pt.id
  from public.viva_project_team pt
  join public.viva_team_members tm on tm.id = pt.team_member_id
  where tm.external_key like 'refens-aluno-%'
);

delete from public.viva_project_team
where team_member_id in (
  select id from public.viva_team_members
  where external_key like 'refens-aluno-%'
);

delete from public.viva_team_members
where external_key like 'refens-aluno-%';
EOF

echo "5) Criando limpeza local automática para remover alunos antigos do navegador..."
mkdir -p src/components/refens

cat > src/components/refens/refens-cleanup.tsx <<'EOF'
"use client";

import { useEffect } from "react";

const TEAM_KEY = "viva:team-roster:v1";
const ASSIGNMENTS_KEY = "viva:project-team-assignments:v1";

function isAlunoNovo(item: Record<string, unknown>) {
  const id = String(item.id ?? item.memberId ?? "");
  const name = String(item.name ?? item.fullName ?? "").toLowerCase();

  return id.startsWith("refens-aluno-") || name.startsWith("aluno novo");
}

function cleanupRefensStudents() {
  try {
    const teamRaw = window.localStorage.getItem(TEAM_KEY);
    if (teamRaw) {
      const team = JSON.parse(teamRaw);
      if (Array.isArray(team)) {
        const cleaned = team.filter((item) => !isAlunoNovo(item));
        window.localStorage.setItem(TEAM_KEY, JSON.stringify(cleaned));
      }
    }

    const assignmentsRaw = window.localStorage.getItem(ASSIGNMENTS_KEY);
    if (assignmentsRaw) {
      const assignmentsByProject = JSON.parse(assignmentsRaw) as Record<string, Record<string, unknown>[]>;

      Object.keys(assignmentsByProject).forEach((projectId) => {
        if (Array.isArray(assignmentsByProject[projectId])) {
          assignmentsByProject[projectId] = assignmentsByProject[projectId].filter((item) => !isAlunoNovo(item));
        }
      });

      window.localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignmentsByProject));
    }
  } catch {
    // não quebra a tela se algum dado local antigo estiver corrompido
  }
}

export function RefensCleanup() {
  useEffect(() => {
    cleanupRefensStudents();
  }, []);

  return null;
}
EOF

echo "6) Montando limpeza no bootstrap da equipe..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/refens/refens-team-bootstrap.tsx")
if not path.exists():
    print("AVISO: refens-team-bootstrap.tsx não encontrado. Pulando.")
    raise SystemExit(0)

text = path.read_text()

if 'RefensCleanup' not in text:
    text = text.replace(
        'import { applyRefensOfficialCostBreakdowns } from "@/components/refens/refens-cost-breakdown";',
        'import { applyRefensOfficialCostBreakdowns } from "@/components/refens/refens-cost-breakdown";\nimport { RefensCleanup } from "@/components/refens/refens-cleanup";'
    )

    text = text.replace(
        "<LocalTeamWorkspace",
        "<><RefensCleanup />\n    <LocalTeamWorkspace",
        1
    )

    text = text.replace(
        "/>",
        "/>\n    </>",
        1
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

echo "Conferindo ajustes finais..."
grep -R "costCategoryOptions" -n src/components/team/local-team-workspace.tsx
grep -R "costRubricOptions" -n src/components/team/local-team-workspace.tsx
grep -R "RefensCleanup" -n src/components/refens
grep -R "refensStudentAssignments" -n src/components/refens || true
grep -R "remove_refens_student_placeholders" -n supabase/migrations || true

echo "Tentando aplicar migration no Supabase..."
if npx supabase --version >/dev/null 2>&1; then
  if [ -f "supabase/config.toml" ]; then
    npx supabase db push || echo "AVISO: não consegui aplicar no Supabase automaticamente. Se precisar, rode: npx supabase link --project-ref SEU_PROJECT_REF && npx supabase db push"
  else
    echo "AVISO: supabase/config.toml não encontrado. Rode depois: npx supabase init && npx supabase link --project-ref SEU_PROJECT_REF && npx supabase db push"
  fi
else
  echo "AVISO: Supabase CLI não disponível. Rode depois: npx supabase link --project-ref SEU_PROJECT_REF && npx supabase db push"
fi

echo "Status:"
git status --short

git add src/components/team src/components/refens supabase/migrations .gitignore package.json package-lock.json
git commit -m "Finaliza rubricas por pessoa e remove alunos placeholders" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Abra /equipe e faça Command + Shift + R."
