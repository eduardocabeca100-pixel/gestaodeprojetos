"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  Sparkles,
  UsersRound,
} from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  area: string;
  cpf?: string;
  email?: string;
  phone?: string;
  city?: string;
  fee?: number;
  resumeShort?: string;
  resume?: string;
  portfolioText?: string;
  editalFunction?: string;
  observations?: string;
  source?: string;
};

type DraftState = {
  title: string;
  resumo: string;
  justificativa: string;
  objetivoGeral: string;
  objetivosEspecificos: string;
  metodologia: string;
  publicoAlvo: string;
  acessibilidade: string;
  contrapartida: string;
  cronograma: string;
  orcamento: string;
};

const emptyDraft: DraftState = {
  title: "",
  resumo: "",
  justificativa: "",
  objetivoGeral: "",
  objetivosEspecificos: "",
  metodologia: "",
  publicoAlvo: "",
  acessibilidade: "",
  contrapartida: "",
  cronograma: "",
  orcamento: "",
};

function storageKey(projectId: string) {
  return `viva:cerebro-ia:draft:${projectId || "sem-projeto"}`;
}

function teamStorageKey(projectId: string) {
  return `viva:cerebro-ia:manual-team:${projectId || "sem-projeto"}`;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function keyOf(member: TeamMember) {
  return (
    clean(member.cpf).toLowerCase() ||
    clean(member.email).toLowerCase() ||
    `${clean(member.name).toLowerCase()}|${clean(member.role).toLowerCase()}`
  );
}

function downloadWord(filename: string, htmlBody: string) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${htmlBody}</body></html>`;
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  link.click();

  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function paragraphs(value: string) {
  const lines = clean(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return "<p>Não informado.</p>";

  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

export function CerebroIaWorkspace({
  projectId,
}: {
  projectId: string;
}) {
  const [activeTab, setActiveTab] = useState<"painel" | "projeto" | "equipe" | "ia" | "exportar">("painel");
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [manualTeam, setManualTeam] = useState<TeamMember[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [newMember, setNewMember] = useState({ name: "", role: "", email: "", phone: "" });
  const [message, setMessage] = useState("Cérebro IA carregado dentro do VIVA.");
  const [iaPrompt, setIaPrompt] = useState("");
  const [iaOutput, setIaOutput] = useState("");
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingIa, setLoadingIa] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(projectId));
      const savedTeam = localStorage.getItem(teamStorageKey(projectId));

      if (saved) setDraft({ ...emptyDraft, ...JSON.parse(saved) });
      if (savedTeam) setManualTeam(JSON.parse(savedTeam));
    } catch {
      // ignora localStorage corrompido
    }
  }, [projectId]);

  useEffect(() => {
    async function loadTeam() {
      setLoadingTeam(true);

      try {
        const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
        const response = await fetch(`/api/cerebro/equipe${query}`, {
          credentials: "same-origin",
          cache: "no-store",
        });

        const data = await response.json();

        if (data.ok && Array.isArray(data.team)) {
          setTeam(data.team);
          setMessage(`Equipe sincronizada com o VIVA: ${data.team.length} integrante(s).`);
        } else {
          setMessage(data.message || "Não consegui carregar equipe do VIVA.");
        }
      } catch {
        setMessage("Não consegui carregar equipe do VIVA agora.");
      } finally {
        setLoadingTeam(false);
      }
    }

    void loadTeam();
  }, [projectId]);

  const allTeam = useMemo(() => {
    const map = new Map<string, TeamMember>();

    for (const member of [...team, ...manualTeam]) {
      if (!member.name) continue;
      const key = keyOf(member);
      map.set(key, { ...map.get(key), ...member });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [team, manualTeam]);

  const selectedTeam = useMemo(
    () => allTeam.filter((member) => selectedTeamIds.includes(member.id)),
    [allTeam, selectedTeamIds],
  );

  const completedBlocks = Object.values(draft).filter((value) => clean(value).length > 0).length;

  function updateDraft(field: keyof DraftState, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function saveDraft() {
    localStorage.setItem(storageKey(projectId), JSON.stringify(draft));
    localStorage.setItem(teamStorageKey(projectId), JSON.stringify(manualTeam));
    setMessage("Rascunho salvo neste navegador.");
  }

  async function addMember() {
    if (!newMember.name.trim()) {
      setMessage("Informe o nome do integrante.");
      return;
    }

    const localMember: TeamMember = {
      id: `manual-${Date.now()}`,
      name: newMember.name.trim(),
      role: newMember.role.trim() || "Equipe",
      area: newMember.role.trim() || "Equipe",
      email: newMember.email.trim(),
      phone: newMember.phone.trim(),
      source: "cerebro",
    };

    const nextManualTeam = [localMember, ...manualTeam];
    setManualTeam(nextManualTeam);
    localStorage.setItem(teamStorageKey(projectId), JSON.stringify(nextManualTeam));
    setSelectedTeamIds((current) => [...current, localMember.id]);
    setNewMember({ name: "", role: "", email: "", phone: "" });

    try {
      const response = await fetch("/api/cerebro/equipe", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, member: localMember }),
      });

      const data = await response.json().catch(() => ({}));

      setMessage(data.message || "Integrante salvo no Cérebro IA.");
    } catch {
      setMessage("Integrante salvo no Cérebro IA. Sincronização com VIVA pendente.");
    }
  }

  function toggleMember(id: string) {
    setSelectedTeamIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function askIa(mode: string) {
    setLoadingIa(true);
    setIaOutput("");

    try {
      const response = await fetch("/api/ia", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: mode,
          message: iaPrompt || `Ajude a melhorar o bloco: ${mode}`,
          project: draft,
          team: selectedTeam,
        }),
      });

      const data = await response.json().catch(() => ({}));

      setIaOutput(data.output || data.message || "A IA não retornou texto.");
    } catch {
      setIaOutput("Não consegui conectar com a IA. Confira GROQ_API_KEY/GROQ_MODEL na Vercel.");
    } finally {
      setLoadingIa(false);
    }
  }

  function exportProject() {
    const html = `
      <h1>${escapeHtml(draft.title || "Projeto cultural")}</h1>
      <h2>Resumo</h2>${paragraphs(draft.resumo)}
      <h2>Justificativa</h2>${paragraphs(draft.justificativa)}
      <h2>Objetivo geral</h2>${paragraphs(draft.objetivoGeral)}
      <h2>Objetivos específicos</h2>${paragraphs(draft.objetivosEspecificos)}
      <h2>Metodologia</h2>${paragraphs(draft.metodologia)}
      <h2>Público-alvo</h2>${paragraphs(draft.publicoAlvo)}
      <h2>Acessibilidade</h2>${paragraphs(draft.acessibilidade)}
      <h2>Contrapartida</h2>${paragraphs(draft.contrapartida)}
      <h2>Cronograma</h2>${paragraphs(draft.cronograma)}
      <h2>Orçamento</h2>${paragraphs(draft.orcamento)}
      <h2>Equipe selecionada</h2>
      <ul>
        ${selectedTeam
          .map((member) => `<li><strong>${escapeHtml(member.name)}</strong> — ${escapeHtml(member.role || member.area || "Equipe")}</li>`)
          .join("")}
      </ul>
    `;

    downloadWord("projeto-cultural-cerebro-ia.doc", html);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Cérebro IA</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Escrita de Projetos</h2>
            <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-500">
              Crie, revise e organize projetos culturais usando dados do VIVA, equipe sincronizada e IA no backend.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Save className="size-4" />
              Salvar
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ia")}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-black text-white shadow-sm"
            >
              <Sparkles className="size-4" />
              Usar IA
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Blocos preenchidos" value={`${completedBlocks}/11`} />
        <Metric label="Equipe VIVA" value={loadingTeam ? "..." : String(allTeam.length)} />
        <Metric label="Selecionados" value={String(selectedTeamIds.length)} />
        <Metric label="IA" value="Groq/API" />
      </section>

      <section className="flex flex-wrap gap-2 rounded-[2rem] border border-white/80 bg-white p-3 shadow-sm">
        <TabButton active={activeTab === "painel"} onClick={() => setActiveTab("painel")}>Painel</TabButton>
        <TabButton active={activeTab === "projeto"} onClick={() => setActiveTab("projeto")}>Texto do projeto</TabButton>
        <TabButton active={activeTab === "equipe"} onClick={() => setActiveTab("equipe")}>Equipe</TabButton>
        <TabButton active={activeTab === "ia"} onClick={() => setActiveTab("ia")}>IA</TabButton>
        <TabButton active={activeTab === "exportar"} onClick={() => setActiveTab("exportar")}>Exportar</TabButton>
      </section>

      {activeTab === "painel" ? (
        <section className="grid gap-6 xl:grid-cols-3">
          <PanelCard
            icon={<FileText className="size-5" />}
            title="Projeto em escrita"
            text="Monte resumo, justificativa, objetivos, metodologia, acessibilidade e orçamento."
            button="Abrir texto"
            onClick={() => setActiveTab("projeto")}
          />
          <PanelCard
            icon={<UsersRound className="size-5" />}
            title="Equipe sincronizada"
            text="Use integrantes já cadastrados no VIVA sem recadastrar manualmente."
            button="Ver equipe"
            onClick={() => setActiveTab("equipe")}
          />
          <PanelCard
            icon={<BrainCircuit className="size-5" />}
            title="IA de apoio"
            text="Use Groq/OpenAI pelo backend para revisar e fortalecer a escrita."
            button="Abrir IA"
            onClick={() => setActiveTab("ia")}
          />
        </section>
      ) : null}

      {activeTab === "projeto" ? (
        <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-950">Texto do projeto</h3>
          <p className="mt-1 text-sm text-slate-500">Preencha os blocos principais do edital.</p>

          <div className="mt-5 grid gap-4">
            <Field label="Nome do projeto">
              <input className="form-input" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} />
            </Field>

            <Textarea label="Resumo" value={draft.resumo} onChange={(value) => updateDraft("resumo", value)} />
            <Textarea label="Justificativa" value={draft.justificativa} onChange={(value) => updateDraft("justificativa", value)} />
            <Textarea label="Objetivo geral" value={draft.objetivoGeral} onChange={(value) => updateDraft("objetivoGeral", value)} />
            <Textarea label="Objetivos específicos" value={draft.objetivosEspecificos} onChange={(value) => updateDraft("objetivosEspecificos", value)} />
            <Textarea label="Metodologia" value={draft.metodologia} onChange={(value) => updateDraft("metodologia", value)} />
            <Textarea label="Público-alvo" value={draft.publicoAlvo} onChange={(value) => updateDraft("publicoAlvo", value)} />
            <Textarea label="Acessibilidade" value={draft.acessibilidade} onChange={(value) => updateDraft("acessibilidade", value)} />
            <Textarea label="Contrapartida" value={draft.contrapartida} onChange={(value) => updateDraft("contrapartida", value)} />
            <Textarea label="Cronograma" value={draft.cronograma} onChange={(value) => updateDraft("cronograma", value)} />
            <Textarea label="Orçamento" value={draft.orcamento} onChange={(value) => updateDraft("orcamento", value)} />
          </div>
        </section>
      ) : null}

      {activeTab === "equipe" ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Equipe do VIVA</h3>
            <p className="mt-1 text-sm text-slate-500">
              Selecione quem fará parte do projeto em escrita.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {loadingTeam ? (
                <div className="col-span-full flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando equipe...
                </div>
              ) : null}

              {!loadingTeam && allTeam.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Nenhum integrante encontrado ainda.
                </div>
              ) : null}

              {allTeam.map((member) => {
                const selected = selectedTeamIds.includes(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={
                      selected
                        ? "rounded-3xl border border-primary bg-primary/10 p-4 text-left shadow-sm"
                        : "rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-primary/40 hover:bg-white"
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-lg font-black text-primary">
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-black text-slate-950">{member.name}</p>
                          {selected ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : null}
                        </div>

                        <p className="mt-1 text-sm text-slate-500">{member.role || member.area || "Equipe"}</p>

                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          {member.source === "cerebro" ? "Cérebro IA" : "VIVA"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Adicionar integrante</h3>
            <p className="mt-1 text-sm text-slate-500">
              Pessoa criada aqui será salva no Cérebro e tentará ir para a equipe do VIVA.
            </p>

            <div className="mt-5 space-y-4">
              <Field label="Nome">
                <input className="form-input" value={newMember.name} onChange={(event) => setNewMember((current) => ({ ...current, name: event.target.value }))} />
              </Field>

              <Field label="Função / área">
                <input className="form-input" value={newMember.role} onChange={(event) => setNewMember((current) => ({ ...current, role: event.target.value }))} />
              </Field>

              <Field label="E-mail">
                <input className="form-input" value={newMember.email} onChange={(event) => setNewMember((current) => ({ ...current, email: event.target.value }))} />
              </Field>

              <Field label="Telefone">
                <input className="form-input" value={newMember.phone} onChange={(event) => setNewMember((current) => ({ ...current, phone: event.target.value }))} />
              </Field>

              <button
                type="button"
                onClick={addMember}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-black text-white shadow-sm"
              >
                <Plus className="size-4" />
                Adicionar
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "ia" ? (
        <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-950">Assistente de escrita</h3>
          <p className="mt-1 text-sm text-slate-500">
            A IA usa a rota segura do VIVA. A chave fica na Vercel, não no navegador.
          </p>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <textarea
                className="form-input min-h-52"
                value={iaPrompt}
                onChange={(event) => setIaPrompt(event.target.value)}
                placeholder="Exemplo: melhore a justificativa do projeto, deixando mais forte para edital público..."
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white" onClick={() => askIa("revisar projeto")} disabled={loadingIa}>
                  {loadingIa ? "Gerando..." : "Pedir revisão"}
                </button>

                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700" onClick={() => askIa("melhorar justificativa")} disabled={loadingIa}>
                  Melhorar justificativa
                </button>

                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700" onClick={() => askIa("criar resumo")} disabled={loadingIa}>
                  Criar resumo
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Resposta</p>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {iaOutput || "A resposta da IA aparecerá aqui."}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "exportar" ? (
        <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black text-slate-950">Exportar projeto</h3>
          <p className="mt-1 text-sm text-slate-500">
            Gere um arquivo Word com os blocos preenchidos e a equipe selecionada.
          </p>

          <button
            type="button"
            onClick={exportProject}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-sm"
          >
            <Download className="size-4" />
            Baixar Word
          </button>
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
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
      className={
        active
          ? "rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-black text-white"
          : "rounded-2xl px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
      }
    >
      {children}
    </button>
  );
}

function PanelCard({
  icon,
  title,
  text,
  button,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>

      <h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
      >
        {button}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea className="form-input min-h-36" value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
