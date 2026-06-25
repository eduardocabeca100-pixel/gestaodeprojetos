#!/usr/bin/env bash
set -e

echo "Criando backup..."
tar -czf ".backup-antes-corrigir-equipe-refens-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore package.json package-lock.json 2>/dev/null || true

mkdir -p src/components/refens

cat > src/components/refens/refens-official-data.ts <<'EOF'
export type RefensTeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  document: string;
  rubric: string;
  defaultAmount: string;
  notes: string;
  active: boolean;
};

export type RefensProjectAssignment = {
  id: string;
  memberId: string;
  name: string;
  role: string;
  rubric: string;
  expectedAmount: string;
  paidAmount: string;
  paymentStatus: "Previsto" | "Pendente" | "Parcial" | "Pago";
  notes: string;
  paymentHistory: Array<{
    id: string;
    date: string;
    amount: string;
    note: string;
  }>;
};

const TEAM_ROSTER_STORAGE_KEY = "viva:team-roster:v1";
const PROJECT_ASSIGNMENTS_STORAGE_KEY = "viva:project-team-assignments:v1";
const PROJECT_TEAM_DRAFT_STORAGE_KEY = "viva:project-team-draft:v1";

export const refensKnownTeam: RefensTeamMember[] = [
  {
    id: "refens-marcel-eduardo",
    name: "Marcel Eduardo Cabeça Domingues",
    role: "Formador, diretor, ator e produtor",
    email: "eduardo@ciaviva.com",
    phone: "(47) 992747545",
    document: "CNPJ 59.053.899/0001-53",
    rubric: "Diretor geral + produtor / Professor formador / Ator experiente",
    defaultAmount: "R$ 8.900,00",
    notes: "Proponente, diretor geral, formador, produtor e ator do projeto Reféns.",
    active: true,
  },
  {
    id: "refens-kaique-varela",
    name: "Kaique Varela Zaluski",
    role: "Direção executiva / Produção executiva",
    email: "",
    phone: "",
    document: "CNPJ 55.069.179/0001-25",
    rubric: "Produção executiva",
    defaultAmount: "R$ 6.000,00",
    notes: "Planejamento, comunicação, orçamento, produção e acompanhamento executivo.",
    active: true,
  },
  {
    id: "refens-jones-andre",
    name: "Jones André Alves Pereira",
    role: "Técnico de som",
    email: "",
    phone: "",
    document: "",
    rubric: "Técnico de som",
    defaultAmount: "R$ 1.500,00",
    notes: "Técnico responsável pelo som nas apresentações.",
    active: true,
  },
  {
    id: "refens-cassius-venera",
    name: "Cassius Venera",
    role: "Técnico de iluminação",
    email: "",
    phone: "",
    document: "",
    rubric: "Técnico de iluminação",
    defaultAmount: "R$ 500,00",
    notes: "Técnico responsável pela iluminação.",
    active: true,
  },
  {
    id: "refens-andre-brito",
    name: "André Felipe de Mila Brito",
    role: "Registro audiovisual / fotográfico",
    email: "",
    phone: "",
    document: "",
    rubric: "Registro fotográfico",
    defaultAmount: "R$ 2.000,00",
    notes: "Registro audiovisual e fotográfico do projeto.",
    active: true,
  },
  {
    id: "refens-suzi-daiane",
    name: "Suzi Daiane",
    role: "Professora de inclusão, LIBRAS e acessibilidade",
    email: "",
    phone: "",
    document: "",
    rubric: "Capacitação de equipe / Acessibilidade / LIBRAS",
    defaultAmount: "R$ 2.200,00",
    notes: "Inclusão, LIBRAS, audiodescrição, acessibilidade teatral e formação da equipe.",
    active: true,
  },
  {
    id: "refens-katiana-souza",
    name: "Katiana de Souza Coelho",
    role: "Professora de técnica vocal / Tecladista / Música",
    email: "",
    phone: "",
    document: "",
    rubric: "Técnica vocal / Tecladista / Músico",
    defaultAmount: "R$ 2.300,00",
    notes: "Preparação vocal, música e teclado.",
    active: true,
  },
  {
    id: "refens-renaldo-boddemberg",
    name: "Renaldo Boddemberg",
    role: "Ator experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
  {
    id: "refens-bruna-lazzarotto",
    name: "Bruna Lazzarotto",
    role: "Atriz experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
  {
    id: "refens-wemerson-goncalves",
    name: "Wemerson Gonçalves",
    role: "Ator experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
  {
    id: "refens-julia-titz",
    name: "Julia Titz",
    role: "Atriz experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
  {
    id: "refens-karim-kamada",
    name: "Karim Kamada",
    role: "Artista / Atriz experiente",
    email: "",
    phone: "",
    document: "",
    rubric: "Ator experiente",
    defaultAmount: "R$ 900,00",
    notes: "Elenco experiente. Cachê previsto por 3 apresentações.",
    active: true,
  },
];

export const refensStudentAssignments: RefensProjectAssignment[] = Array.from({ length: 12 }).map((_, index) => {
  const number = String(index + 1).padStart(2, "0");

  return {
    id: `assignment-refens-aluno-${number}`,
    memberId: `refens-aluno-${number}`,
    name: `Aluno novo ${number}`,
    role: "Artista em formação",
    rubric: "Alunos novos",
    expectedAmount: "R$ 150,00",
    paidAmount: "R$ 0,00",
    paymentStatus: "Previsto",
    notes: "Aluno novo a ser selecionado nas inscrições. Editar nome após seleção.",
    paymentHistory: [],
  };
});

export const refensKnownAssignments: RefensProjectAssignment[] = refensKnownTeam.map((member) => ({
  id: `assignment-${member.id}`,
  memberId: member.id,
  name: member.name,
  role: member.role,
  rubric: member.rubric,
  expectedAmount: member.defaultAmount,
  paidAmount: "R$ 0,00",
  paymentStatus: "Previsto",
  notes: member.notes,
  paymentHistory: [],
}));

export const refensProjectAssignments: RefensProjectAssignment[] = [
  ...refensKnownAssignments,
  ...refensStudentAssignments,
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mergeTeam(existing: RefensTeamMember[]) {
  const withoutOldRefens = existing.filter((member) => !member.id.startsWith("refens-"));
  return [...refensKnownTeam, ...withoutOldRefens];
}

export function seedRefensTeamForProject(projectId: string) {
  if (typeof window === "undefined") return;

  const safeProjectId = projectId || "projeto-refens";
  const currentTeam = readJson<RefensTeamMember[]>(TEAM_ROSTER_STORAGE_KEY, []);
  const currentAssignments = readJson<Record<string, RefensProjectAssignment[]>>(PROJECT_ASSIGNMENTS_STORAGE_KEY, {});

  const nextTeam = mergeTeam(currentTeam);

  const nextAssignments = {
    ...currentAssignments,
    [safeProjectId]: refensProjectAssignments,
    "projeto-refens": refensProjectAssignments,
    refens: refensProjectAssignments,
    "formacao-de-artistas-de-rua-e-montagem-do-espetaculo-refens": refensProjectAssignments,
  };

  writeJson(TEAM_ROSTER_STORAGE_KEY, nextTeam);
  writeJson(PROJECT_ASSIGNMENTS_STORAGE_KEY, nextAssignments);
  writeJson(PROJECT_TEAM_DRAFT_STORAGE_KEY, refensKnownTeam.map((member) => member.id));
}
EOF

cat > src/components/refens/refens-team-bootstrap.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";
import { LocalTeamWorkspace } from "@/components/team/local-team-workspace";
import { seedRefensTeamForProject } from "@/components/refens/refens-official-data";

type RefensTeamWorkspaceProps = {
  initialTab?: "project" | "permanent";
  activeProject: {
    id: string;
    name: string;
  };
};

export function RefensTeamWorkspace({
  initialTab = "project",
  activeProject,
}: RefensTeamWorkspaceProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedRefensTeamForProject(activeProject.id);
    setReady(true);
  }, [activeProject.id]);

  if (!ready) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando equipe oficial do projeto Reféns...
      </div>
    );
  }

  return (
    <LocalTeamWorkspace
      key={`refens-team-${activeProject.id}-${initialTab}`}
      initialTab={initialTab}
      activeProject={activeProject}
    />
  );
}
EOF

echo "Atualizando páginas de equipe para carregar a equipe oficial do Reféns..."
python3 - <<'PY'
from pathlib import Path

pages = [
    Path("src/app/(protected)/equipe/page.tsx"),
    Path("src/app/(protected)/equipe/projeto/page.tsx"),
]

for path in pages:
    if not path.exists():
        print(f"AVISO: não encontrei {path}")
        continue

    text = path.read_text()

    text = text.replace(
        'import { LocalTeamWorkspace } from "@/components/team/local-team-workspace";',
        'import { RefensTeamWorkspace } from "@/components/refens/refens-team-bootstrap";',
    )

    text = text.replace("<LocalTeamWorkspace", "<RefensTeamWorkspace")

    path.write_text(text)
    print(f"Atualizado: {path}")
PY

echo "Atualizando importador do Reféns para usar a mesma base oficial..."
python3 - <<'PY'
from pathlib import Path

path = Path("src/components/refens/refens-data-seeder.tsx")
if not path.exists():
    print("AVISO: importador antigo não encontrado. Pulando.")
    raise SystemExit(0)

text = path.read_text()

if 'seedRefensTeamForProject' not in text:
    text = text.replace(
        'import { CheckCircle2, Database, FileText, RefreshCcw, Trash2 } from "lucide-react";',
        'import { CheckCircle2, Database, FileText, RefreshCcw, Trash2 } from "lucide-react";\nimport { refensKnownTeam, refensProjectAssignments, seedRefensTeamForProject } from "@/components/refens/refens-official-data";',
    )

# Deixa o botão importar também gravar pelo ID padrão do Reféns
old = '''  function handleImport() {
    const imported = importRefensData();
    setResult(imported);
    setCleared(false);
  }'''

new = '''  function handleImport() {
    const imported = importRefensData();
    seedRefensTeamForProject("projeto-refens");
    setResult({
      team: refensKnownTeam.length,
      assignments: refensProjectAssignments.length,
      rubrics: imported.rubrics,
      tasks: imported.tasks,
      pending: imported.pending,
    });
    setCleared(false);
  }'''

if old in text:
    text = text.replace(old, new)

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

echo "Conferindo equipe Reféns..."
grep -R "refensProjectAssignments" -n src/components/refens
grep -R "RefensTeamWorkspace" -n 'src/app/(protected)/equipe/page.tsx' 'src/app/(protected)/equipe/projeto/page.tsx'
grep -R "Aluno novo 12" -n src/components/refens/refens-official-data.ts

echo "Status:"
git status --short

git add src/components/refens 'src/app/(protected)/equipe/page.tsx' 'src/app/(protected)/equipe/projeto/page.tsx' .gitignore package.json package-lock.json
git commit -m "Carrega equipe oficial do Refens na tela de equipe" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "Finalizado. Abra /equipe e faça Command + Shift + R."
