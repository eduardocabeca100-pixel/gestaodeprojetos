#!/usr/bin/env bash
set -e

if [ ! -f "package.json" ] || [ ! -d "src" ]; then
  echo "ERRO: rode este script na raiz do projeto, onde ficam package.json e src/."
  exit 1
fi

echo "Criando backup dos arquivos atuais..."
tar -czf ".backup-antes-equipe-projetos-$(date +%Y%m%d-%H%M%S).tgz" src .gitignore 2>/dev/null || true

mkdir -p src/admin/data
mkdir -p src/admin/pages/login
mkdir -p src/admin/pages/projetos
mkdir -p src/admin/pages/equipe

cat > src/admin/data/teamProjects.ts <<'EOF'
export type PaymentStatus = "Pendente" | "Parcial" | "Pago";

export type PermanentMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  baseRubric: string;
  defaultValue: string;
  active: boolean;
};

export type ProjectMember = {
  id: string;
  memberId: string;
  name: string;
  role: string;
  rubric: string;
  value: string;
  paymentStatus: PaymentStatus;
};

export type ManagedProject = {
  id: string;
  title: string;
  status: "Pré-produção" | "Em produção" | "Em execução" | "Finalizado";
  city: string;
  startDate: string;
  endDate: string;
  budget: string;
  description: string;
  team: ProjectMember[];
};

const MEMBERS_KEY = "cia-viva-equipe-permanente-v2";
const PROJECTS_KEY = "cia-viva-projetos-gestao-v2";

export const defaultPermanentMembers: PermanentMember[] = [
  {
    id: "m-julia",
    name: "Júlia",
    role: "Atriz / Produção",
    email: "",
    phone: "",
    baseRubric: "Elenco",
    defaultValue: "",
    active: true,
  },
  {
    id: "m-reinaldo",
    name: "Reinaldo",
    role: "Ator / Apoio de produção",
    email: "",
    phone: "",
    baseRubric: "Elenco",
    defaultValue: "",
    active: true,
  },
  {
    id: "m-eduardo",
    name: "Eduardo Cabeça",
    role: "Direção geral e produção executiva",
    email: "eduardocabeca100@gmail.com",
    phone: "",
    baseRubric: "Direção geral e executiva",
    defaultValue: "",
    active: true,
  },
];

export const defaultProjects: ManagedProject[] = [
  {
    id: "p-refens",
    title: "Reféns",
    status: "Em produção",
    city: "Joinville / SC",
    startDate: "",
    endDate: "",
    budget: "",
    description: "Projeto teatral em acompanhamento pela Cia Viva.",
    team: defaultPermanentMembers.slice(0, 2).map((member) => ({
      id: `pm-${member.id}`,
      memberId: member.id,
      name: member.name,
      role: member.role,
      rubric: member.baseRubric,
      value: member.defaultValue,
      paymentStatus: "Pendente" as PaymentStatus,
    })),
  },
];

function safeRandomId(prefix: string) {
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function createMemberId() {
  return safeRandomId("m");
}

export function createProjectId() {
  return safeRandomId("p");
}

export function createProjectMemberId() {
  return safeRandomId("pm");
}

export function loadPermanentMembers(): PermanentMember[] {
  return readJson<PermanentMember[]>(MEMBERS_KEY, defaultPermanentMembers);
}

export function savePermanentMembers(members: PermanentMember[]) {
  writeJson(MEMBERS_KEY, members);
}

export function loadManagedProjects(): ManagedProject[] {
  return readJson<ManagedProject[]>(PROJECTS_KEY, defaultProjects);
}

export function saveManagedProjects(projects: ManagedProject[]) {
  writeJson(PROJECTS_KEY, projects);
}

export function memberToProjectMember(member: PermanentMember): ProjectMember {
  return {
    id: createProjectMemberId(),
    memberId: member.id,
    name: member.name,
    role: member.role,
    rubric: member.baseRubric,
    value: member.defaultValue,
    paymentStatus: "Pendente",
  };
}
EOF

cat > src/admin/pages/login/AdminLoginPage.tsx <<'EOF'
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import "./admin-login.css";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@ciaviva.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      if (remember) localStorage.setItem("cia-viva-admin-last-email", email);
      navigate("/admin/dashboard");
    } catch {
      setMessage("Não foi possível entrar. Confira o e-mail e a senha cadastrados no Firebase.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setMessage("Digite seu e-mail para receber a recuperação de senha.");
      return;
    }

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setMessage("Enviamos um e-mail de recuperação de senha para o endereço informado.");
    } catch {
      setMessage("Não foi possível enviar a recuperação agora. Confira o e-mail cadastrado.");
    }
  }

  return (
    <main className="viva-login-page">
      <section className="viva-login-hero">
        <div className="viva-login-brand">
          <strong>VIVA</strong>
          <span>GESTÃO E PRODUÇÃO</span>
        </div>

        <div className="viva-login-orbit">
          <span />
          <i>✦</i>
        </div>

        <div className="viva-login-copy">
          <p>Painel privado</p>
          <h1>Gestão cultural com cara de sistema profissional.</h1>
          <span>
            Organize projetos, equipe, rubricas, formulários, mídia e configurações da Cia Viva em um painel único.
          </span>
        </div>

        <div className="viva-login-stats">
          <div><strong>Projetos</strong><span>produção e equipe</span></div>
          <div><strong>Equipe</strong><span>permanente e por obra</span></div>
          <div><strong>Site</strong><span>conteúdo e visual</span></div>
        </div>
      </section>

      <section className="viva-login-panel">
        <div className="viva-login-panel__header">
          <span>Acesso administrativo</span>
          <h2>Entrar no painel</h2>
          <p>Use o login cadastrado no Firebase para acessar o sistema.</p>
        </div>

        <form onSubmit={handleSubmit} className="viva-login-form">
          <label>
            E-mail
            <input
              type="email"
              value={email}
              autoComplete="email"
              placeholder="admin@ciaviva.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Senha
            <div className="viva-password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                onChange={(event) => setPassword(event.target.value)}
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </label>

          <div className="viva-login-options">
            <label>
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Manter meu e-mail salvo
            </label>
            <button type="button" onClick={handleResetPassword}>Esqueci a senha</button>
          </div>

          {message && <div className="viva-login-message">{message}</div>}

          <button className="viva-login-submit" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar no sistema"}
          </button>
        </form>
      </section>
    </main>
  );
}
EOF

cat > src/admin/pages/login/admin-login.css <<'EOF'
.viva-login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
  background:
    radial-gradient(circle at 16% 15%, rgba(229, 9, 20, 0.32), transparent 32%),
    radial-gradient(circle at 80% 90%, rgba(118, 71, 255, 0.24), transparent 34%),
    #08090d;
  color: #fff;
  overflow: hidden;
}

.viva-login-hero {
  position: relative;
  min-height: 100vh;
  padding: clamp(28px, 5vw, 70px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  isolation: isolate;
}

.viva-login-hero::before {
  content: "";
  position: absolute;
  inset: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 38px;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  z-index: -1;
}

.viva-login-brand {
  display: grid;
  gap: 8px;
  width: fit-content;
}

.viva-login-brand strong {
  font-size: clamp(3.4rem, 8vw, 7.8rem);
  line-height: 0.78;
  letter-spacing: -0.11em;
  font-weight: 1000;
}

.viva-login-brand span,
.viva-login-copy p,
.viva-login-panel__header span {
  color: #ff5360;
  font-size: 0.73rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 950;
}

.viva-login-orbit {
  position: absolute;
  right: 9%;
  top: 20%;
  width: min(34vw, 420px);
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(255,255,255,0.18), transparent 10%),
    radial-gradient(circle at 50% 55%, rgba(229,9,20,0.42), transparent 42%);
  border: 1px solid rgba(255,255,255,0.13);
  box-shadow: inset 0 0 80px rgba(255,255,255,0.06), 0 40px 120px rgba(0,0,0,0.42);
}

.viva-login-orbit span {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  border: 1px dashed rgba(255,255,255,0.18);
}

.viva-login-orbit i {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: clamp(4rem, 10vw, 9rem);
  font-style: normal;
  text-shadow: 0 20px 60px rgba(229,9,20,0.65);
}

.viva-login-copy {
  max-width: 680px;
  margin-top: auto;
}

.viva-login-copy h1 {
  max-width: 760px;
  margin: 10px 0 16px;
  font-size: clamp(3rem, 6vw, 6.4rem);
  line-height: 0.86;
  letter-spacing: -0.085em;
}

.viva-login-copy span {
  display: block;
  max-width: 560px;
  color: rgba(255,255,255,0.72);
  font-size: 1.02rem;
  line-height: 1.75;
}

.viva-login-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 34px;
  max-width: 760px;
}

.viva-login-stats div {
  min-height: 92px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(255,255,255,0.075);
  border: 1px solid rgba(255,255,255,0.09);
  backdrop-filter: blur(14px);
}

.viva-login-stats strong,
.viva-login-stats span {
  display: block;
}

.viva-login-stats strong { font-size: 1rem; }

.viva-login-stats span {
  margin-top: 7px;
  color: rgba(255,255,255,0.58);
  font-size: 0.83rem;
}

.viva-login-panel {
  min-height: 100vh;
  padding: clamp(24px, 5vw, 62px);
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.035);
  border-left: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(28px);
}

.viva-login-panel > * {
  width: min(100%, 460px);
}

.viva-login-panel__header {
  margin-bottom: 28px;
}

.viva-login-panel__header h2 {
  margin: 10px 0 10px;
  color: #fff;
  font-size: clamp(2.2rem, 4vw, 3.6rem);
  letter-spacing: -0.07em;
  line-height: 0.92;
}

.viva-login-panel__header p {
  margin: 0;
  color: rgba(255,255,255,0.62);
  line-height: 1.6;
}

.viva-login-form {
  display: grid;
  gap: 16px;
}

.viva-login-form label {
  display: grid;
  gap: 8px;
  color: rgba(255,255,255,0.86);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.viva-login-form input {
  width: 100%;
  height: 54px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 18px;
  padding: 0 16px;
  color: #fff;
  background: rgba(0,0,0,0.34);
  outline: none;
  font: inherit;
}

.viva-login-form input:focus {
  border-color: rgba(255,83,96,0.78);
  box-shadow: 0 0 0 4px rgba(255,83,96,0.12);
}

.viva-password-field {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  border-radius: 18px;
  background: rgba(0,0,0,0.34);
  border: 1px solid rgba(255,255,255,0.12);
}

.viva-password-field input {
  border: 0;
  background: transparent;
  box-shadow: none !important;
}

.viva-password-field button,
.viva-login-options button {
  border: 0;
  background: transparent;
  color: #ff7680;
  font-weight: 950;
  cursor: pointer;
}

.viva-password-field button {
  height: 42px;
  padding: 0 14px;
}

.viva-login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.viva-login-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.68);
  font-size: 0.82rem;
  font-weight: 800;
}

.viva-login-options input {
  width: 16px;
  height: 16px;
}

.viva-login-message {
  padding: 13px 15px;
  border-radius: 16px;
  background: rgba(255,83,96,0.12);
  border: 1px solid rgba(255,83,96,0.22);
  color: #ffd7db;
  line-height: 1.45;
}

.viva-login-submit {
  min-height: 54px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #ff3845, #9e0710);
  box-shadow: 0 20px 50px rgba(229,9,20,0.24);
  font-weight: 1000;
  cursor: pointer;
}

.viva-login-submit:disabled {
  opacity: 0.65;
  cursor: wait;
}

@media (max-width: 960px) {
  .viva-login-page { grid-template-columns: 1fr; }
  .viva-login-hero { min-height: auto; }
  .viva-login-panel { min-height: auto; }
  .viva-login-orbit { opacity: 0.25; right: -8%; }
}

@media (max-width: 620px) {
  .viva-login-stats { grid-template-columns: 1fr; }
  .viva-login-options { align-items: flex-start; flex-direction: column; }
}
EOF

cat > src/admin/pages/projetos/ProjetosAdminPage.tsx <<'EOF'
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createProjectId,
  createProjectMemberId,
  loadManagedProjects,
  loadPermanentMembers,
  memberToProjectMember,
  saveManagedProjects,
  type ManagedProject,
  type PaymentStatus,
  type ProjectMember,
} from "../../data/teamProjects";
import "./projetos-admin.css";

type ProjectStatus = ManagedProject["status"];

const emptyProject = {
  title: "",
  status: "Pré-produção" as ProjectStatus,
  city: "",
  startDate: "",
  endDate: "",
  budget: "",
  description: "",
};

export function ProjetosAdminPage() {
  const [projects, setProjects] = useState<ManagedProject[]>(() => loadManagedProjects());
  const [members] = useState(() => loadPermanentMembers());
  const [draft, setDraft] = useState(emptyProject);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const activeMembers = useMemo(() => members.filter((member) => member.active), [members]);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === editingProjectId) ?? projects[0],
    [editingProjectId, projects],
  );

  function persist(next: ManagedProject[]) {
    setProjects(next);
    saveManagedProjects(next);
  }

  function resetForm() {
    setDraft(emptyProject);
    setSelectedMemberIds([]);
    setShowTeamPicker(false);
    setEditingProjectId(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!draft.title.trim()) {
      setMessage("Digite o nome do projeto antes de salvar.");
      return;
    }

    const selectedTeam = activeMembers
      .filter((member) => selectedMemberIds.includes(member.id))
      .map(memberToProjectMember);

    if (editingProjectId) {
      const next = projects.map((project) =>
        project.id === editingProjectId
          ? {
              ...project,
              ...draft,
              team: selectedTeam.length ? mergeProjectTeam(project.team, selectedTeam) : project.team,
            }
          : project,
      );
      persist(next);
      setMessage("Projeto atualizado com sucesso.");
      resetForm();
      return;
    }

    const nextProject: ManagedProject = {
      id: createProjectId(),
      ...draft,
      team: selectedTeam,
    };

    persist([nextProject, ...projects]);
    setMessage("Projeto criado com equipe vinculada.");
    resetForm();
  }

  function editProject(project: ManagedProject) {
    setEditingProjectId(project.id);
    setDraft({
      title: project.title,
      status: project.status,
      city: project.city,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      description: project.description,
    });
    setSelectedMemberIds(project.team.map((member) => member.memberId));
    setShowTeamPicker(true);
    setMessage("Editando projeto. Ajuste os dados e salve novamente.");
  }

  function removeProject(projectId: string) {
    persist(projects.filter((project) => project.id !== projectId));
    if (editingProjectId === projectId) resetForm();
  }

  function toggleSelectedMember(memberId: string) {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  }

  function addMemberToExistingProject(projectId: string, memberId: string) {
    const member = activeMembers.find((item) => item.id === memberId);
    if (!member) return;

    const next = projects.map((project) => {
      if (project.id !== projectId) return project;
      if (project.team.some((item) => item.memberId === memberId)) return project;
      return { ...project, team: [...project.team, memberToProjectMember(member)] };
    });

    persist(next);
  }

  function updateProjectMember(projectId: string, projectMemberId: string, field: keyof ProjectMember, value: string) {
    const next = projects.map((project) => {
      if (project.id !== projectId) return project;
      return {
        ...project,
        team: project.team.map((member) =>
          member.id === projectMemberId
            ? { ...member, [field]: field === "paymentStatus" ? value as PaymentStatus : value }
            : member,
        ),
      };
    });

    persist(next);
  }

  function removeMemberFromProject(projectId: string, projectMemberId: string) {
    persist(projects.map((project) =>
      project.id === projectId
        ? { ...project, team: project.team.filter((member) => member.id !== projectMemberId) }
        : project,
    ));
  }

  return (
    <main className="projects-admin-page">
      <header className="projects-hero">
        <div>
          <span>Gestão e produção</span>
          <h1>Projetos</h1>
          <p>Cadastre projetos e selecione a equipe permanente que vai trabalhar em cada produção.</p>
        </div>
        <div className="projects-hero__counter">
          <strong>{projects.length}</strong>
          <small>projetos cadastrados</small>
        </div>
      </header>

      {message && <div className="projects-message">{message}</div>}

      <section className="projects-layout">
        <form className="project-form-card" onSubmit={handleSubmit}>
          <div className="project-form-card__title">
            <div>
              <span>{editingProjectId ? "Editar projeto" : "Novo projeto"}</span>
              <h2>{editingProjectId ? "Atualizar produção" : "Cadastrar produção"}</h2>
            </div>
            {editingProjectId && <button type="button" onClick={resetForm}>Cancelar edição</button>}
          </div>

          <label>
            Nome do projeto
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex: Reféns" />
          </label>

          <div className="project-form-grid">
            <label>
              Status
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProjectStatus })}>
                <option>Pré-produção</option>
                <option>Em produção</option>
                <option>Em execução</option>
                <option>Finalizado</option>
              </select>
            </label>
            <label>
              Cidade
              <input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} placeholder="Joinville / SC" />
            </label>
          </div>

          <div className="project-form-grid">
            <label>
              Início
              <input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
            </label>
            <label>
              Fim
              <input type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} />
            </label>
          </div>

          <label>
            Orçamento previsto
            <input value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: event.target.value })} placeholder="R$ 0,00" />
          </label>

          <label>
            Observações
            <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Resumo, etapa atual, pendências..." />
          </label>

          <button className="team-picker-button" type="button" onClick={() => setShowTeamPicker((current) => !current)}>
            Adicionar equipe
            <small>{selectedMemberIds.length} selecionado(s)</small>
          </button>

          {showTeamPicker && (
            <div className="team-picker-box">
              <div className="team-picker-box__header">
                <strong>Selecionar equipe permanente</strong>
                <span>Você pode usar a mesma pessoa em vários projetos.</span>
              </div>
              {activeMembers.length === 0 ? (
                <p className="empty-text">Cadastre pessoas em Equipe Permanente primeiro.</p>
              ) : activeMembers.map((member) => (
                <label className="team-picker-item" key={member.id}>
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={() => toggleSelectedMember(member.id)}
                  />
                  <span>
                    <strong>{member.name}</strong>
                    <small>{member.role} • {member.baseRubric}</small>
                  </span>
                </label>
              ))}
            </div>
          )}

          <button className="project-submit" type="submit">
            {editingProjectId ? "Salvar alterações" : "Salvar projeto"}
          </button>
        </form>

        <section className="projects-list-card">
          <div className="projects-list-card__header">
            <div>
              <span>Projetos cadastrados</span>
              <h2>Produções</h2>
            </div>
          </div>

          <div className="projects-list">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <div className="project-card__top">
                  <div>
                    <strong>{project.title}</strong>
                    <span>{project.city || "Cidade não informada"}</span>
                  </div>
                  <em>{project.status}</em>
                </div>

                <p>{project.description || "Sem observações cadastradas."}</p>

                <div className="project-card__meta">
                  <span>Equipe: {project.team.length}</span>
                  <span>Orçamento: {project.budget || "não informado"}</span>
                </div>

                <div className="project-card__actions">
                  <button type="button" onClick={() => editProject(project)}>Editar</button>
                  <button type="button" className="danger" onClick={() => removeProject(project.id)}>Apagar</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="project-team-board">
        <div className="project-team-board__header">
          <div>
            <span>Equipe do projeto</span>
            <h2>{selectedProject?.title ?? "Nenhum projeto"}</h2>
            <p>Edite rubrica, valor e status de pagamento da equipe vinculada ao projeto.</p>
          </div>
          {selectedProject && (
            <select value={selectedProject.id} onChange={(event) => setEditingProjectId(event.target.value)}>
              {projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
            </select>
          )}
        </div>

        {selectedProject ? (
          <>
            <div className="quick-add-member">
              <select defaultValue="" onChange={(event) => {
                if (event.target.value) {
                  addMemberToExistingProject(selectedProject.id, event.target.value);
                  event.currentTarget.value = "";
                }
              }}>
                <option value="">Adicionar pessoa da equipe permanente</option>
                {activeMembers
                  .filter((member) => !selectedProject.team.some((item) => item.memberId === member.id))
                  .map((member) => <option value={member.id} key={member.id}>{member.name} — {member.role}</option>)}
              </select>
            </div>

            <div className="project-team-table">
              <div className="project-team-table__head">
                <span>Nome</span><span>Função</span><span>Rubrica</span><span>Valor</span><span>Status</span><span>Ações</span>
              </div>
              {selectedProject.team.length === 0 ? (
                <p className="empty-text">Nenhuma pessoa vinculada ainda.</p>
              ) : selectedProject.team.map((member) => (
                <div className="project-team-row" key={member.id}>
                  <input value={member.name} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "name", event.target.value)} />
                  <input value={member.role} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "role", event.target.value)} />
                  <input value={member.rubric} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "rubric", event.target.value)} />
                  <input value={member.value} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "value", event.target.value)} placeholder="R$ 0,00" />
                  <select value={member.paymentStatus} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "paymentStatus", event.target.value)}>
                    <option>Pendente</option>
                    <option>Parcial</option>
                    <option>Pago</option>
                  </select>
                  <button type="button" onClick={() => removeMemberFromProject(selectedProject.id, member.id)}>Remover</button>
                </div>
              ))}
            </div>
          </>
        ) : <p className="empty-text">Cadastre um projeto para começar.</p>}
      </section>
    </main>
  );
}

function mergeProjectTeam(currentTeam: ProjectMember[], selectedTeam: ProjectMember[]) {
  const currentByMember = new Map(currentTeam.map((member) => [member.memberId, member]));
  selectedTeam.forEach((member) => {
    if (!currentByMember.has(member.memberId)) currentByMember.set(member.memberId, member);
  });
  return Array.from(currentByMember.values()).map((member) => ({
    ...member,
    id: member.id || createProjectMemberId(),
  }));
}
EOF

cat > src/admin/pages/projetos/projetos-admin.css <<'EOF'
.projects-admin-page {
  display: grid;
  gap: 24px;
  color: #17181d;
}

.projects-hero,
.project-form-card,
.projects-list-card,
.project-team-board {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
}

.projects-hero {
  min-height: 210px;
  padding: 30px;
  border-radius: 32px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  color: #fff;
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 56, 69, 0.42), transparent 34%),
    linear-gradient(135deg, #171a22, #0a0b10);
}

.projects-hero span,
.project-form-card__title span,
.projects-list-card__header span,
.project-team-board__header span {
  color: #ff5360;
  font-size: 0.72rem;
  font-weight: 1000;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.projects-hero h1,
.project-form-card h2,
.projects-list-card h2,
.project-team-board h2 {
  margin: 7px 0 0;
  letter-spacing: -0.06em;
}

.projects-hero h1 {
  font-size: clamp(3rem, 7vw, 6rem);
  line-height: 0.85;
}

.projects-hero p,
.project-team-board__header p {
  max-width: 680px;
  margin: 14px 0 0;
  color: rgba(255,255,255,0.68);
  line-height: 1.6;
}

.project-team-board__header p { color: #6d7280; }

.projects-hero__counter {
  width: 160px;
  min-height: 136px;
  padding: 20px;
  border-radius: 26px;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.1);
  display: grid;
  place-items: center;
  text-align: center;
}

.projects-hero__counter strong {
  font-size: 3rem;
  line-height: 1;
}

.projects-hero__counter small { color: rgba(255,255,255,0.66); }

.projects-message {
  padding: 14px 18px;
  border-radius: 18px;
  color: #8b0d16;
  background: rgba(229,9,20,0.08);
  border: 1px solid rgba(229,9,20,0.14);
  font-weight: 850;
}

.projects-layout {
  display: grid;
  grid-template-columns: minmax(340px, 430px) minmax(0, 1fr);
  gap: 22px;
}

.project-form-card,
.projects-list-card,
.project-team-board {
  border-radius: 30px;
  padding: 24px;
}

.project-form-card {
  align-self: start;
  display: grid;
  gap: 15px;
}

.project-form-card__title,
.projects-list-card__header,
.project-card__top,
.project-team-board__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.project-form-card__title button,
.project-card__actions button,
.project-team-row button {
  min-height: 38px;
  border: 0;
  border-radius: 999px;
  padding: 0 14px;
  color: #fff;
  background: #17181d;
  font-weight: 950;
  cursor: pointer;
}

.project-card__actions button.danger,
.project-team-row button {
  background: #e50914;
}

.project-form-card label {
  display: grid;
  gap: 7px;
  color: #3a3f4a;
  font-size: 0.78rem;
  font-weight: 950;
  text-transform: uppercase;
}

.project-form-card input,
.project-form-card select,
.project-form-card textarea,
.quick-add-member select,
.project-team-board__header select,
.project-team-row input,
.project-team-row select {
  width: 100%;
  border: 1px solid #dde1e8;
  border-radius: 16px;
  background: #fff;
  color: #14161b;
  font: inherit;
  outline: none;
}

.project-form-card input,
.project-form-card select,
.quick-add-member select,
.project-team-board__header select,
.project-team-row input,
.project-team-row select {
  min-height: 46px;
  padding: 0 13px;
}

.project-form-card textarea {
  min-height: 94px;
  padding: 13px;
  resize: vertical;
}

.project-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.team-picker-button,
.project-submit {
  min-height: 50px;
  border: 0;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #ff3845, #9e0710);
  font-weight: 1000;
  cursor: pointer;
}

.team-picker-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 17px;
}

.team-picker-button small { color: rgba(255,255,255,0.75); }

.team-picker-box {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 20px;
  background: #f5f6f8;
  border: 1px solid #e2e5ea;
}

.team-picker-box__header strong,
.team-picker-box__header span { display: block; }

.team-picker-box__header span {
  margin-top: 3px;
  color: #737987;
  font-size: 0.84rem;
}

.team-picker-item {
  display: grid !important;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px !important;
  min-height: 56px;
  padding: 10px;
  border-radius: 16px;
  background: #fff;
  text-transform: none !important;
}

.team-picker-item input {
  width: 17px;
  height: 17px;
  min-height: 17px;
  padding: 0;
}

.team-picker-item strong,
.team-picker-item small { display: block; }

.team-picker-item small {
  margin-top: 3px;
  color: #747a86;
}

.projects-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.project-card {
  padding: 18px;
  border-radius: 22px;
  background: #f7f8fa;
  border: 1px solid #eceff3;
}

.project-card__top strong,
.project-card__top span { display: block; }

.project-card__top strong { font-size: 1.12rem; }

.project-card__top span {
  margin-top: 4px;
  color: #717786;
}

.project-card__top em {
  border-radius: 999px;
  padding: 8px 11px;
  color: #9e0710;
  background: rgba(229,9,20,0.09);
  font-size: 0.73rem;
  font-style: normal;
  font-weight: 950;
  white-space: nowrap;
}

.project-card p {
  margin: 14px 0;
  color: #646b78;
  line-height: 1.55;
}

.project-card__meta,
.project-card__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.project-card__meta span {
  border-radius: 999px;
  padding: 7px 10px;
  background: #fff;
  color: #626978;
  font-size: 0.78rem;
  font-weight: 850;
}

.project-card__actions { margin-top: 16px; }

.project-team-board {
  display: grid;
  gap: 18px;
}

.quick-add-member {
  max-width: 420px;
}

.project-team-table {
  overflow-x: auto;
  display: grid;
  gap: 9px;
}

.project-team-table__head,
.project-team-row {
  min-width: 980px;
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1fr 0.85fr 0.8fr auto;
  gap: 10px;
  align-items: center;
}

.project-team-table__head {
  color: #737987;
  font-size: 0.75rem;
  font-weight: 950;
  text-transform: uppercase;
}

.project-team-row {
  padding: 10px;
  border-radius: 18px;
  background: #f7f8fa;
  border: 1px solid #eceff3;
}

.empty-text {
  margin: 0;
  color: #727987;
  line-height: 1.5;
}

@media (max-width: 1120px) {
  .projects-layout { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .projects-hero,
  .project-form-card__title,
  .project-card__top,
  .project-team-board__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .project-form-grid { grid-template-columns: 1fr; }
}
EOF

cat > src/admin/pages/equipe/EquipeAdminPage.tsx <<'EOF'
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createMemberId,
  createProjectMemberId,
  loadManagedProjects,
  loadPermanentMembers,
  saveManagedProjects,
  savePermanentMembers,
  type ManagedProject,
  type PaymentStatus,
  type PermanentMember,
  type ProjectMember,
} from "../../data/teamProjects";
import "./equipe-admin.css";

type Tab = "projeto" | "permanente";

const emptyMember = {
  name: "",
  role: "",
  email: "",
  phone: "",
  baseRubric: "",
  defaultValue: "",
  active: true,
};

export function EquipeAdminPage() {
  const [tab, setTab] = useState<Tab>("projeto");
  const [members, setMembers] = useState<PermanentMember[]>(() => loadPermanentMembers());
  const [projects, setProjects] = useState<ManagedProject[]>(() => loadManagedProjects());
  const [selectedProjectId, setSelectedProjectId] = useState(() => loadManagedProjects()[0]?.id ?? "");
  const [memberDraft, setMemberDraft] = useState(emptyMember);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const activeMembers = useMemo(() => members.filter((member) => member.active), [members]);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId],
  );

  function persistMembers(next: PermanentMember[]) {
    setMembers(next);
    savePermanentMembers(next);
  }

  function persistProjects(next: ManagedProject[]) {
    setProjects(next);
    saveManagedProjects(next);
  }

  function resetMemberForm() {
    setMemberDraft(emptyMember);
    setEditingMemberId(null);
  }

  function handleSaveMember(event: FormEvent) {
    event.preventDefault();

    if (!memberDraft.name.trim() || !memberDraft.role.trim()) {
      setMessage("Preencha pelo menos nome e função da pessoa.");
      return;
    }

    if (editingMemberId) {
      const nextMembers = members.map((member) =>
        member.id === editingMemberId ? { ...member, ...memberDraft } : member,
      );
      persistMembers(nextMembers);
      syncMemberInsideProjects(editingMemberId, memberDraft.name, memberDraft.role, memberDraft.baseRubric, memberDraft.defaultValue);
      setMessage("Equipe permanente atualizada.");
      resetMemberForm();
      return;
    }

    const nextMember: PermanentMember = {
      id: createMemberId(),
      ...memberDraft,
    };

    persistMembers([nextMember, ...members]);
    setMessage("Pessoa adicionada à equipe permanente.");
    resetMemberForm();
  }

  function editMember(member: PermanentMember) {
    setTab("permanente");
    setEditingMemberId(member.id);
    setMemberDraft({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      baseRubric: member.baseRubric,
      defaultValue: member.defaultValue,
      active: member.active,
    });
    setMessage("Editando equipe permanente.");
  }

  function removeMember(memberId: string) {
    persistMembers(members.filter((member) => member.id !== memberId));
    persistProjects(projects.map((project) => ({
      ...project,
      team: project.team.filter((member) => member.memberId !== memberId),
    })));
    if (editingMemberId === memberId) resetMemberForm();
    setMessage("Pessoa removida da equipe permanente e dos projetos vinculados.");
  }

  function toggleMemberActive(memberId: string) {
    persistMembers(members.map((member) => member.id === memberId ? { ...member, active: !member.active } : member));
  }

  function addPermanentMemberToProject(memberId: string) {
    if (!selectedProject) return;
    const member = activeMembers.find((item) => item.id === memberId);
    if (!member) return;

    const projectMember: ProjectMember = {
      id: createProjectMemberId(),
      memberId: member.id,
      name: member.name,
      role: member.role,
      rubric: member.baseRubric,
      value: member.defaultValue,
      paymentStatus: "Pendente",
    };

    persistProjects(projects.map((project) => {
      if (project.id !== selectedProject.id) return project;
      if (project.team.some((item) => item.memberId === memberId)) return project;
      return { ...project, team: [...project.team, projectMember] };
    }));
    setMessage("Pessoa adicionada à equipe do projeto.");
  }

  function updateProjectMember(projectId: string, projectMemberId: string, field: keyof ProjectMember, value: string) {
    persistProjects(projects.map((project) => {
      if (project.id !== projectId) return project;
      return {
        ...project,
        team: project.team.map((member) =>
          member.id === projectMemberId
            ? { ...member, [field]: field === "paymentStatus" ? value as PaymentStatus : value }
            : member,
        ),
      };
    }));
  }

  function removeProjectMember(projectId: string, projectMemberId: string) {
    persistProjects(projects.map((project) =>
      project.id === projectId
        ? { ...project, team: project.team.filter((member) => member.id !== projectMemberId) }
        : project,
    ));
  }

  function syncMemberInsideProjects(memberId: string, name: string, role: string, rubric: string, value: string) {
    persistProjects(projects.map((project) => ({
      ...project,
      team: project.team.map((member) =>
        member.memberId === memberId
          ? { ...member, name, role, rubric: member.rubric || rubric, value: member.value || value }
          : member,
      ),
    })));
  }

  return (
    <main className="team-admin-page">
      <header className="team-hero">
        <div>
          <span>Gestão e produção</span>
          <h1>Equipe</h1>
          <p>Controle a equipe permanente e edite quem participa de cada projeto, com rubrica, valor e pagamento.</p>
        </div>
        <div className="team-hero__cards">
          <div><strong>{members.length}</strong><small>permanentes</small></div>
          <div><strong>{selectedProject?.team.length ?? 0}</strong><small>no projeto</small></div>
        </div>
      </header>

      <div className="team-tabs" role="tablist">
        <button className={tab === "projeto" ? "active" : ""} onClick={() => setTab("projeto")} type="button">
          Equipe do projeto
        </button>
        <button className={tab === "permanente" ? "active" : ""} onClick={() => setTab("permanente")} type="button">
          Equipe permanente
        </button>
      </div>

      {message && <div className="team-message">{message}</div>}

      {tab === "projeto" ? (
        <section className="team-project-panel">
          <div className="team-panel-header">
            <div>
              <span>Equipe do projeto</span>
              <h2>{selectedProject?.title ?? "Nenhum projeto cadastrado"}</h2>
              <p>Edite a equipe deste projeto sem alterar a base permanente, quando precisar.</p>
            </div>
            <select value={selectedProject?.id ?? ""} onChange={(event) => setSelectedProjectId(event.target.value)}>
              {projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
            </select>
          </div>

          {selectedProject ? (
            <>
              <div className="team-add-to-project">
                <select defaultValue="" onChange={(event) => {
                  if (event.target.value) {
                    addPermanentMemberToProject(event.target.value);
                    event.currentTarget.value = "";
                  }
                }}>
                  <option value="">Adicionar equipe permanente ao projeto</option>
                  {activeMembers
                    .filter((member) => !selectedProject.team.some((item) => item.memberId === member.id))
                    .map((member) => <option value={member.id} key={member.id}>{member.name} — {member.role}</option>)}
                </select>
              </div>

              <div className="team-project-table">
                <div className="team-project-table__head">
                  <span>Nome</span><span>Função</span><span>Rubrica</span><span>Valor</span><span>Status</span><span>Ações</span>
                </div>
                {selectedProject.team.length === 0 ? (
                  <p className="team-empty">Nenhuma pessoa vinculada a este projeto ainda.</p>
                ) : selectedProject.team.map((member) => (
                  <div className="team-project-row" key={member.id}>
                    <input value={member.name} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "name", event.target.value)} />
                    <input value={member.role} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "role", event.target.value)} />
                    <input value={member.rubric} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "rubric", event.target.value)} />
                    <input value={member.value} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "value", event.target.value)} placeholder="R$ 0,00" />
                    <select value={member.paymentStatus} onChange={(event) => updateProjectMember(selectedProject.id, member.id, "paymentStatus", event.target.value)}>
                      <option>Pendente</option>
                      <option>Parcial</option>
                      <option>Pago</option>
                    </select>
                    <button type="button" onClick={() => removeProjectMember(selectedProject.id, member.id)}>Remover</button>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="team-empty">Crie um projeto na aba Projetos para montar a equipe.</p>}
        </section>
      ) : (
        <section className="team-permanent-layout">
          <form className="team-member-form" onSubmit={handleSaveMember}>
            <div className="team-panel-header compact">
              <div>
                <span>{editingMemberId ? "Editar" : "Adicionar"}</span>
                <h2>{editingMemberId ? "Editar pessoa" : "Equipe permanente"}</h2>
              </div>
              {editingMemberId && <button type="button" onClick={resetMemberForm}>Cancelar</button>}
            </div>

            <label>
              Nome
              <input value={memberDraft.name} onChange={(event) => setMemberDraft({ ...memberDraft, name: event.target.value })} placeholder="Nome completo" />
            </label>
            <label>
              Função principal
              <input value={memberDraft.role} onChange={(event) => setMemberDraft({ ...memberDraft, role: event.target.value })} placeholder="Ator, direção, produção..." />
            </label>
            <div className="team-form-grid">
              <label>
                E-mail
                <input value={memberDraft.email} onChange={(event) => setMemberDraft({ ...memberDraft, email: event.target.value })} placeholder="email@exemplo.com" />
              </label>
              <label>
                Telefone
                <input value={memberDraft.phone} onChange={(event) => setMemberDraft({ ...memberDraft, phone: event.target.value })} placeholder="(47) 99999-9999" />
              </label>
            </div>
            <div className="team-form-grid">
              <label>
                Rubrica padrão
                <input value={memberDraft.baseRubric} onChange={(event) => setMemberDraft({ ...memberDraft, baseRubric: event.target.value })} placeholder="Elenco, produção..." />
              </label>
              <label>
                Valor padrão
                <input value={memberDraft.defaultValue} onChange={(event) => setMemberDraft({ ...memberDraft, defaultValue: event.target.value })} placeholder="R$ 0,00" />
              </label>
            </div>
            <label className="team-checkbox-line">
              <input type="checkbox" checked={memberDraft.active} onChange={(event) => setMemberDraft({ ...memberDraft, active: event.target.checked })} />
              Pessoa ativa para seleção em projetos
            </label>
            <button className="team-save-button" type="submit">{editingMemberId ? "Salvar edição" : "Adicionar pessoa"}</button>
          </form>

          <section className="team-members-list">
            {members.map((member) => (
              <article className="team-member-card" key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                  <small>{member.baseRubric || "Sem rubrica"} {member.defaultValue ? `• ${member.defaultValue}` : ""}</small>
                </div>
                <em className={member.active ? "active" : ""}>{member.active ? "Ativo" : "Inativo"}</em>
                <div className="team-member-actions">
                  <button type="button" onClick={() => editMember(member)}>Editar</button>
                  <button type="button" onClick={() => toggleMemberActive(member.id)}>{member.active ? "Inativar" : "Ativar"}</button>
                  <button type="button" className="danger" onClick={() => removeMember(member.id)}>Apagar</button>
                </div>
              </article>
            ))}
          </section>
        </section>
      )}
    </main>
  );
}
EOF

cat > src/admin/pages/equipe/equipe-admin.css <<'EOF'
.team-admin-page {
  display: grid;
  gap: 22px;
  color: #17181d;
}

.team-hero,
.team-project-panel,
.team-member-form,
.team-members-list {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
}

.team-hero {
  min-height: 210px;
  padding: 30px;
  border-radius: 32px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  color: #fff;
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 56, 69, 0.42), transparent 34%),
    linear-gradient(135deg, #171a22, #0a0b10);
}

.team-hero span,
.team-panel-header span {
  color: #ff5360;
  font-size: 0.72rem;
  font-weight: 1000;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.team-hero h1 {
  margin: 7px 0 0;
  font-size: clamp(3rem, 7vw, 6rem);
  line-height: 0.85;
  letter-spacing: -0.075em;
}

.team-hero p {
  max-width: 720px;
  margin: 14px 0 0;
  color: rgba(255,255,255,0.68);
  line-height: 1.6;
}

.team-hero__cards {
  display: flex;
  gap: 12px;
}

.team-hero__cards div {
  width: 126px;
  min-height: 118px;
  padding: 18px;
  border-radius: 24px;
  text-align: center;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.1);
}

.team-hero__cards strong,
.team-hero__cards small { display: block; }

.team-hero__cards strong { font-size: 2.4rem; }

.team-hero__cards small { color: rgba(255,255,255,0.66); }

.team-tabs {
  width: fit-content;
  display: flex;
  gap: 8px;
  padding: 7px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e5e8ee;
  box-shadow: 0 14px 36px rgba(15,23,42,0.06);
}

.team-tabs button {
  min-height: 42px;
  border: 0;
  border-radius: 999px;
  padding: 0 18px;
  color: #5c6370;
  background: transparent;
  font-weight: 950;
  cursor: pointer;
}

.team-tabs button.active {
  color: #fff;
  background: linear-gradient(135deg, #ff3845, #9e0710);
}

.team-message {
  padding: 14px 18px;
  border-radius: 18px;
  color: #8b0d16;
  background: rgba(229,9,20,0.08);
  border: 1px solid rgba(229,9,20,0.14);
  font-weight: 850;
}

.team-project-panel,
.team-member-form,
.team-members-list {
  border-radius: 30px;
  padding: 24px;
}

.team-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.team-panel-header.compact {
  margin-bottom: 6px;
}

.team-panel-header h2 {
  margin: 7px 0 0;
  font-size: 1.65rem;
  letter-spacing: -0.05em;
}

.team-panel-header p {
  margin: 8px 0 0;
  color: #6d7280;
  line-height: 1.55;
}

.team-panel-header select,
.team-add-to-project select,
.team-project-row input,
.team-project-row select,
.team-member-form input {
  min-height: 46px;
  border: 1px solid #dde1e8;
  border-radius: 16px;
  padding: 0 13px;
  color: #14161b;
  background: #fff;
  outline: none;
  font: inherit;
}

.team-panel-header button,
.team-save-button,
.team-project-row button,
.team-member-actions button {
  min-height: 40px;
  border: 0;
  border-radius: 999px;
  padding: 0 14px;
  color: #fff;
  background: #17181d;
  font-weight: 950;
  cursor: pointer;
}

.team-add-to-project {
  max-width: 460px;
  margin-bottom: 16px;
}

.team-project-table {
  display: grid;
  gap: 9px;
  overflow-x: auto;
}

.team-project-table__head,
.team-project-row {
  min-width: 980px;
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1fr 0.85fr 0.8fr auto;
  gap: 10px;
  align-items: center;
}

.team-project-table__head {
  color: #737987;
  font-size: 0.75rem;
  font-weight: 950;
  text-transform: uppercase;
}

.team-project-row {
  padding: 10px;
  border-radius: 18px;
  background: #f7f8fa;
  border: 1px solid #eceff3;
}

.team-project-row input,
.team-project-row select { width: 100%; }

.team-project-row button,
.team-member-actions button.danger { background: #e50914; }

.team-permanent-layout {
  display: grid;
  grid-template-columns: minmax(320px, 430px) minmax(0, 1fr);
  gap: 22px;
}

.team-member-form {
  align-self: start;
  display: grid;
  gap: 14px;
}

.team-member-form label {
  display: grid;
  gap: 7px;
  color: #3a3f4a;
  font-size: 0.78rem;
  font-weight: 950;
  text-transform: uppercase;
}

.team-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.team-checkbox-line {
  display: flex !important;
  align-items: center;
  gap: 10px !important;
  text-transform: none !important;
}

.team-checkbox-line input {
  width: 18px;
  height: 18px;
  min-height: 18px;
}

.team-save-button {
  min-height: 50px;
  background: linear-gradient(135deg, #ff3845, #9e0710);
}

.team-members-list {
  display: grid;
  gap: 14px;
}

.team-member-card {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border-radius: 22px;
  background: #f7f8fa;
  border: 1px solid #eceff3;
}

.team-member-card strong,
.team-member-card span,
.team-member-card small { display: block; }

.team-member-card strong { font-size: 1.1rem; }

.team-member-card span {
  margin-top: 4px;
  color: #626978;
}

.team-member-card small {
  margin-top: 5px;
  color: #858b96;
}

.team-member-card em {
  border-radius: 999px;
  padding: 8px 11px;
  background: #e9edf3;
  color: #667085;
  font-size: 0.73rem;
  font-style: normal;
  font-weight: 950;
  text-transform: uppercase;
}

.team-member-card em.active {
  background: rgba(34,197,94,0.13);
  color: #12813b;
}

.team-member-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.team-empty {
  margin: 0;
  color: #727987;
  line-height: 1.5;
}

@media (max-width: 1120px) {
  .team-permanent-layout { grid-template-columns: 1fr; }
  .team-member-card { grid-template-columns: 1fr; align-items: flex-start; }
  .team-member-actions { justify-content: flex-start; }
}

@media (max-width: 760px) {
  .team-hero,
  .team-panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .team-hero__cards { width: 100%; }

  .team-hero__cards div { width: 100%; }

  .team-tabs {
    width: 100%;
    flex-direction: column;
    border-radius: 22px;
  }

  .team-form-grid { grid-template-columns: 1fr; }
}
EOF

python3 - <<'PY'
from pathlib import Path

routes = Path("src/app/routes.tsx")
text = routes.read_text()

imports_to_add = [
    'import { ProjetosAdminPage } from "../admin/pages/projetos/ProjetosAdminPage";',
    'import { EquipeAdminPage } from "../admin/pages/equipe/EquipeAdminPage";',
]

for imp in imports_to_add:
    if imp not in text:
        marker = "export function AppRoutes()"
        text = text.replace(marker, imp + "\n" + marker)

project_route = '        <Route path="projetos" element={<ProjetosAdminPage />} />'
team_route = '        <Route path="equipe" element={<EquipeAdminPage />} />'

if project_route not in text:
    if '        <Route path="paginas" element={<PaginasSitePage />} />' in text:
        text = text.replace(
            '        <Route path="paginas" element={<PaginasSitePage />} />\n',
            '        <Route path="paginas" element={<PaginasSitePage />} />\n' + project_route + "\n" + team_route + "\n",
        )
    else:
        text = text.replace(
            '        <Route path="dashboard" element={<DashboardPage />} />\n',
            '        <Route path="dashboard" element={<DashboardPage />} />\n' + project_route + "\n" + team_route + "\n",
        )
elif team_route not in text:
    text = text.replace(project_route + "\n", project_route + "\n" + team_route + "\n")

routes.write_text(text)

sidebar = Path("src/admin/layout/AdminSidebar.tsx")
text = sidebar.read_text()

if "FolderKanban" not in text:
    text = text.replace("  FilePenLine,\n", "  FilePenLine,\n  FolderKanban,\n")

project_menu = '''  {
    label: "Projetos",
    path: "/admin/projetos",
    icon: FolderKanban,
  },
  {
    label: "Equipe",
    path: "/admin/equipe",
    icon: UsersRound,
  },
'''

if 'path: "/admin/projetos"' not in text:
    marker = '''  {
    label: "Páginas do site",
    path: "/admin/paginas",
    icon: FilePenLine,
  },
'''
    if marker in text:
        text = text.replace(marker, marker + project_menu)
    else:
        text = text.replace("const adminMenuItems = [\n", "const adminMenuItems = [\n" + project_menu)

text = text.replace("<span>Painel de controle</span>", "<span>Gestão e produção</span>")
sidebar.write_text(text)
PY

touch .gitignore
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore
grep -qxF "node_modules" .gitignore || echo "node_modules" >> .gitignore
grep -qxF "dist" .gitignore || echo "dist" >> .gitignore

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  git rm --cached .env
fi

echo "Instalando dependências para corrigir possíveis opcionais do Mac/Vite..."
npm install

echo "Testando build..."
npm run build

echo "Conferindo se rotas e telas foram criadas..."
grep -R "ProjetosAdminPage" -n src/app/routes.tsx src/admin/pages/projetos/ProjetosAdminPage.tsx
grep -R "EquipeAdminPage" -n src/app/routes.tsx src/admin/pages/equipe/EquipeAdminPage.tsx
grep -R "GESTÃO E PRODUÇÃO" -n src/admin/pages/login/AdminLoginPage.tsx

echo "Status dos arquivos:"
git status --short

git add src .gitignore package.json package-lock.json
git commit -m "Ajusta login projetos e equipe permanente" || echo "Nada novo para commitar."

BRANCH="$(git branch --show-current)"
[ -z "$BRANCH" ] && BRANCH="main"

git -c http.proxy= -c https.proxy= push origin "$BRANCH"

echo "OK: ajustes aplicados. Abra /admin/login, /admin/projetos e /admin/equipe."
