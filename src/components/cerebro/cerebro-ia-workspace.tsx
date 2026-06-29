"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  UsersRound,
  WalletCards,
} from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  area?: string;
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

type BudgetItem = {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitValue: number;
  justification: string;
};

type AttachmentItem = {
  id: string;
  name: string;
  category: string;
};

type DraftState = {
  title: string;
  editalName: string;
  proponente: string;
  linguagem: string;
  valorSolicitado: string;
  resumo: string;
  justificativa: string;
  objetivoGeral: string;
  objetivosEspecificos: string;
  metodologia: string;
  publicoAlvo: string;
  acessibilidade: string;
  democratizacao: string;
  contrapartida: string;
  cronograma: string;
  editalText: string;
  observacoes: string;
};

type DraftKey = keyof DraftState;

const emptyDraft: DraftState = {
  title: "",
  editalName: "",
  proponente: "Cia de Artes VIVA",
  linguagem: "Teatro / Artes Cênicas",
  valorSolicitado: "",
  resumo: "",
  justificativa: "",
  objetivoGeral: "",
  objetivosEspecificos: "",
  metodologia: "",
  publicoAlvo: "",
  acessibilidade: "",
  democratizacao: "",
  contrapartida: "",
  cronograma: "",
  editalText: "",
  observacoes: "",
};

const defaultBudget: BudgetItem[] = [
  {
    id: "budget-1",
    category: "Equipe artística",
    description: "Cachês de atores, direção, produção e equipe técnica",
    quantity: 1,
    unitValue: 0,
    justification: "Remuneração dos profissionais envolvidos na execução do projeto.",
  },
  {
    id: "budget-2",
    category: "Produção",
    description: "Materiais, figurinos, cenário e insumos",
    quantity: 1,
    unitValue: 0,
    justification: "Custos necessários para viabilizar a montagem e realização das ações.",
  },
];

const draftFields: Array<{
  key: DraftKey;
  label: string;
  helper: string;
  rows?: number;
}> = [
  {
    key: "resumo",
    label: "Resumo do projeto",
    helper: "Síntese clara do que será realizado.",
    rows: 6,
  },
  {
    key: "justificativa",
    label: "Justificativa",
    helper: "Por que o projeto é importante cultural, social e artisticamente.",
    rows: 8,
  },
  {
    key: "objetivoGeral",
    label: "Objetivo geral",
    helper: "O principal resultado que o projeto pretende alcançar.",
    rows: 4,
  },
  {
    key: "objetivosEspecificos",
    label: "Objetivos específicos",
    helper: "Liste metas práticas e mensuráveis.",
    rows: 6,
  },
  {
    key: "metodologia",
    label: "Metodologia",
    helper: "Como o projeto será executado, etapa por etapa.",
    rows: 8,
  },
  {
    key: "publicoAlvo",
    label: "Público-alvo",
    helper: "Quem será atendido ou alcançado.",
    rows: 5,
  },
  {
    key: "acessibilidade",
    label: "Acessibilidade",
    helper: "Recursos de acesso, inclusão e permanência.",
    rows: 5,
  },
  {
    key: "democratizacao",
    label: "Democratização de acesso",
    helper: "Como o projeto amplia acesso à cultura.",
    rows: 5,
  },
  {
    key: "contrapartida",
    label: "Contrapartida social",
    helper: "Ações oferecidas à comunidade.",
    rows: 5,
  },
  {
    key: "cronograma",
    label: "Cronograma",
    helper: "Etapas, meses e períodos de execução.",
    rows: 6,
  },
];

function storageKey(projectId: string) {
  return `viva:cerebro-ia:draft-completo:${projectId || "sem-projeto"}`;
}

function teamStorageKey(projectId: string) {
  return `viva:cerebro-ia:manual-team:${projectId || "sem-projeto"}`;
}

function budgetStorageKey(projectId: string) {
  return `viva:cerebro-ia:budget:${projectId || "sem-projeto"}`;
}

function attachmentStorageKey(projectId: string) {
  return `viva:cerebro-ia:attachments:${projectId || "sem-projeto"}`;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function keyOf(member: TeamMember) {
  return (
    clean(member.cpf).toLowerCase() ||
    clean(member.email).toLowerCase() ||
    `${clean(member.name).toLowerCase()}|${clean(member.role).toLowerCase()}`
  );
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

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function buildProjectHtml({
  draft,
  selectedTeam,
  budget,
}: {
  draft: DraftState;
  selectedTeam: TeamMember[];
  budget: BudgetItem[];
}) {
  const budgetTotal = budget.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitValue || 0),
    0,
  );

  return `
    <h1>${escapeHtml(draft.title || "Projeto Cultural")}</h1>
    <p><strong>Edital:</strong> ${escapeHtml(draft.editalName || "Não informado")}</p>
    <p><strong>Proponente:</strong> ${escapeHtml(draft.proponente || "Não informado")}</p>
    <p><strong>Linguagem:</strong> ${escapeHtml(draft.linguagem || "Não informado")}</p>
    <p><strong>Valor solicitado:</strong> ${escapeHtml(draft.valorSolicitado || money(budgetTotal))}</p>

    <h2>Resumo</h2>${paragraphs(draft.resumo)}
    <h2>Justificativa</h2>${paragraphs(draft.justificativa)}
    <h2>Objetivo geral</h2>${paragraphs(draft.objetivoGeral)}
    <h2>Objetivos específicos</h2>${paragraphs(draft.objetivosEspecificos)}
    <h2>Metodologia</h2>${paragraphs(draft.metodologia)}
    <h2>Público-alvo</h2>${paragraphs(draft.publicoAlvo)}
    <h2>Acessibilidade</h2>${paragraphs(draft.acessibilidade)}
    <h2>Democratização de acesso</h2>${paragraphs(draft.democratizacao)}
    <h2>Contrapartida</h2>${paragraphs(draft.contrapartida)}
    <h2>Cronograma</h2>${paragraphs(draft.cronograma)}

    <h2>Equipe</h2>
    <ul>
      ${
        selectedTeam.length
          ? selectedTeam
              .map(
                (member) =>
                  `<li><strong>${escapeHtml(member.name)}</strong> — ${escapeHtml(member.role || member.area || "Equipe")}</li>`,
              )
              .join("")
          : "<li>Nenhuma equipe selecionada.</li>"
      }
    </ul>

    <h2>Orçamento</h2>
    <table border="1" cellspacing="0" cellpadding="6">
      <thead>
        <tr>
          <th>Categoria</th>
          <th>Descrição</th>
          <th>Qtd.</th>
          <th>Valor unitário</th>
          <th>Total</th>
          <th>Justificativa</th>
        </tr>
      </thead>
      <tbody>
        ${budget
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.category)}</td>
                <td>${escapeHtml(item.description)}</td>
                <td>${item.quantity}</td>
                <td>${money(item.unitValue)}</td>
                <td>${money(item.quantity * item.unitValue)}</td>
                <td>${escapeHtml(item.justification)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
    <p><strong>Total:</strong> ${money(budgetTotal)}</p>
  `;
}

export function CerebroIaWorkspace({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<
    "painel" | "edital" | "texto" | "revisao" | "orcamento" | "equipe" | "docs" | "ia" | "exportar"
  >("painel");

  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [manualTeam, setManualTeam] = useState<TeamMember[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [newMember, setNewMember] = useState({ name: "", role: "", email: "", phone: "" });
  const [budget, setBudget] = useState<BudgetItem[]>(defaultBudget);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [iaPrompt, setIaPrompt] = useState("");
  const [iaOutput, setIaOutput] = useState("");
  const [applyTarget, setApplyTarget] = useState<DraftKey>("justificativa");
  const [message, setMessage] = useState("Cérebro IA pronto para escrita de projetos.");
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingIa, setLoadingIa] = useState(false);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(storageKey(projectId));
      const savedTeam = localStorage.getItem(teamStorageKey(projectId));
      const savedBudget = localStorage.getItem(budgetStorageKey(projectId));
      const savedAttachments = localStorage.getItem(attachmentStorageKey(projectId));

      if (savedDraft) setDraft({ ...emptyDraft, ...JSON.parse(savedDraft) });
      if (savedTeam) setManualTeam(JSON.parse(savedTeam));
      if (savedBudget) setBudget(JSON.parse(savedBudget));
      if (savedAttachments) setAttachments(JSON.parse(savedAttachments));
    } catch {
      setMessage("Algum dado salvo estava corrompido. Mantive a tela funcionando.");
    }
  }, [projectId]);

  useEffect(() => {
    void syncTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const allTeam = useMemo(() => {
    const map = new Map<string, TeamMember>();

    for (const member of [...team, ...manualTeam]) {
      if (!member.name) continue;
      map.set(keyOf(member), { ...map.get(keyOf(member)), ...member });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [team, manualTeam]);

  const filteredTeam = useMemo(() => {
    const search = teamSearch.trim().toLowerCase();

    if (!search) return allTeam;

    return allTeam.filter((member) =>
      [member.name, member.role, member.area, member.email, member.phone]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [allTeam, teamSearch]);

  const selectedTeam = useMemo(
    () => allTeam.filter((member) => selectedTeamIds.includes(member.id)),
    [allTeam, selectedTeamIds],
  );

  const filledBlocks = draftFields.filter((field) => clean(draft[field.key])).length;
  const budgetTotal = budget.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitValue || 0),
    0,
  );

  async function syncTeam() {
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

  function saveAll() {
    localStorage.setItem(storageKey(projectId), JSON.stringify(draft));
    localStorage.setItem(teamStorageKey(projectId), JSON.stringify(manualTeam));
    localStorage.setItem(budgetStorageKey(projectId), JSON.stringify(budget));
    localStorage.setItem(attachmentStorageKey(projectId), JSON.stringify(attachments));
    setMessage("Projeto salvo neste navegador.");
  }

  function newProject() {
    if (!window.confirm("Limpar o rascunho atual e começar outro projeto?")) return;

    setDraft(emptyDraft);
    setSelectedTeamIds([]);
    setBudget(defaultBudget);
    setAttachments([]);
    setIaOutput("");
    setIaPrompt("");
    setMessage("Novo projeto iniciado.");
  }

  function updateDraft(field: DraftKey, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function addMember() {
    if (!newMember.name.trim()) {
      setMessage("Informe o nome do integrante.");
      return;
    }

    const localMember: TeamMember = {
      id: uid("manual"),
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
      setMessage("Integrante salvo localmente; sincronização com VIVA pendente.");
    }
  }

  function toggleMember(id: string) {
    setSelectedTeamIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function addBudgetItem() {
    setBudget((current) => [
      ...current,
      {
        id: uid("budget"),
        category: "Nova rubrica",
        description: "",
        quantity: 1,
        unitValue: 0,
        justification: "",
      },
    ]);
  }

  function updateBudgetItem(id: string, patch: Partial<BudgetItem>) {
    setBudget((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeBudgetItem(id: string) {
    setBudget((current) => current.filter((item) => item.id !== id));
  }

  function addAttachment(file: File | null, category: string) {
    if (!file) return;

    const next = [{ id: uid("doc"), name: file.name, category }, ...attachments];

    setAttachments(next);
    localStorage.setItem(attachmentStorageKey(projectId), JSON.stringify(next));
    setMessage("Documento registrado no Cérebro IA.");
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
          message: iaPrompt || `Trabalhe o bloco: ${mode}`,
          project: draft,
          team: selectedTeam,
          budget,
          attachments,
        }),
      });

      const data = await response.json().catch(() => ({}));

      setIaOutput(data.output || data.message || "A IA não retornou texto.");
      setMessage("Resposta da IA gerada.");
    } catch {
      setIaOutput("Não consegui conectar com a IA. Confira GROQ_API_KEY e GROQ_MODEL na Vercel.");
      setMessage("Falha ao conectar com a IA.");
    } finally {
      setLoadingIa(false);
    }
  }

  function applyIaOutput() {
    if (!iaOutput.trim()) {
      setMessage("Nenhuma resposta da IA para aplicar.");
      return;
    }

    updateDraft(applyTarget, iaOutput);
    setMessage(`Resposta aplicada em: ${labelForDraftKey(applyTarget)}.`);
    setActiveTab("texto");
  }

  function exportWord() {
    const html = buildProjectHtml({ draft, selectedTeam, budget });
    const full = `<!doctype html><html><head><meta charset="utf-8"><title>Projeto</title></head><body>${html}</body></html>`;

    downloadFile("projeto-cultural-cerebro-ia.doc", full, "application/msword;charset=utf-8");
  }

  function exportJson() {
    downloadFile(
      "backup-cerebro-ia.json",
      JSON.stringify({ draft, selectedTeamIds, manualTeam, budget, attachments }, null, 2),
      "application/json;charset=utf-8",
    );
  }

  function printPdf() {
    const html = buildProjectHtml({ draft, selectedTeam, budget });
    const frame = document.createElement("iframe");

    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";

    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document;

    if (!doc || !frame.contentWindow) {
      setMessage("Não consegui preparar o PDF.");
      frame.remove();
      return;
    }

    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Projeto</title><style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.45} h1,h2{color:#111827} table{width:100%;border-collapse:collapse} td,th{border:1px solid #ddd;padding:6px}</style></head><body>${html}</body></html>`);
    doc.close();

    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1200);
    }, 300);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                Cérebro IA
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <BrainCircuit className="size-6" />
                </span>
                Escrita de Projetos
              </h1>

              <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-500">
                Central para analisar edital, escrever projeto, selecionar equipe, montar orçamento,
                organizar documentos, revisar com IA e exportar o material final.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={saveAll} className="btn-secondary">
                <Save className="size-4" />
                Salvar
              </button>

              <button type="button" onClick={newProject} className="btn-primary">
                <Plus className="size-4" />
                Novo projeto
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-4">
          <Metric label="Blocos preenchidos" value={`${filledBlocks}/10`} />
          <Metric label="Equipe VIVA" value={loadingTeam ? "..." : String(allTeam.length)} />
          <Metric label="Selecionados" value={String(selectedTeamIds.length)} />
          <Metric label="Orçamento" value={money(budgetTotal)} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/80 bg-white p-4 shadow-sm">
          <div className="mb-4 rounded-3xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
              Projeto ativo
            </p>
            <p className="mt-2 text-lg font-black">
              {draft.title || "Novo projeto cultural"}
            </p>
            <p className="mt-1 text-sm text-white/60">
              {draft.editalName || "Edital ainda não informado"}
            </p>
          </div>

          <nav className="grid gap-2">
            <NavButton icon={<Archive className="size-4" />} active={activeTab === "painel"} onClick={() => setActiveTab("painel")}>Painel</NavButton>
            <NavButton icon={<Search className="size-4" />} active={activeTab === "edital"} onClick={() => setActiveTab("edital")}>Edital</NavButton>
            <NavButton icon={<FileText className="size-4" />} active={activeTab === "texto"} onClick={() => setActiveTab("texto")}>Texto</NavButton>
            <NavButton icon={<ClipboardCheck className="size-4" />} active={activeTab === "revisao"} onClick={() => setActiveTab("revisao")}>Revisão</NavButton>
            <NavButton icon={<WalletCards className="size-4" />} active={activeTab === "orcamento"} onClick={() => setActiveTab("orcamento")}>Orçamento</NavButton>
            <NavButton icon={<UsersRound className="size-4" />} active={activeTab === "equipe"} onClick={() => setActiveTab("equipe")}>Equipe</NavButton>
            <NavButton icon={<FolderOpen className="size-4" />} active={activeTab === "docs"} onClick={() => setActiveTab("docs")}>Docs</NavButton>
            <NavButton icon={<Sparkles className="size-4" />} active={activeTab === "ia"} onClick={() => setActiveTab("ia")}>IA</NavButton>
            <NavButton icon={<Download className="size-4" />} active={activeTab === "exportar"} onClick={() => setActiveTab("exportar")}>Exportar</NavButton>
          </nav>
        </aside>

        <main className="min-w-0">
          {activeTab === "painel" ? (
            <section className="grid gap-6 lg:grid-cols-3">
              <PanelCard
                icon={<Search className="size-5" />}
                title="Analisar edital"
                text="Cole o edital, exigências e anexos para transformar em roteiro de escrita."
                button="Abrir edital"
                onClick={() => setActiveTab("edital")}
              />

              <PanelCard
                icon={<FileText className="size-5" />}
                title="Escrever projeto"
                text="Monte resumo, justificativa, objetivos, metodologia, acesso e contrapartida."
                button="Abrir texto"
                onClick={() => setActiveTab("texto")}
              />

              <PanelCard
                icon={<Sparkles className="size-5" />}
                title="Revisar com IA"
                text="Use Groq/API pelo backend para melhorar a escrita e fortalecer a nota."
                button="Abrir IA"
                onClick={() => setActiveTab("ia")}
              />

              <PanelCard
                icon={<UsersRound className="size-5" />}
                title="Equipe conectada"
                text="Use automaticamente a equipe já cadastrada no VIVA Gestão Cultural."
                button="Ver equipe"
                onClick={() => setActiveTab("equipe")}
              />

              <PanelCard
                icon={<WalletCards className="size-5" />}
                title="Orçamento"
                text="Organize rubricas, quantidades, valores e justificativas."
                button="Abrir orçamento"
                onClick={() => setActiveTab("orcamento")}
              />

              <PanelCard
                icon={<Download className="size-5" />}
                title="Exportação"
                text="Gere Word, PDF ou backup JSON do projeto em escrita."
                button="Exportar"
                onClick={() => setActiveTab("exportar")}
              />
            </section>
          ) : null}

          {activeTab === "edital" ? (
            <Section title="Edital e análise inicial" subtitle="Cole aqui o edital, critérios, perguntas e exigências.">
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Nome do edital">
                  <input className="form-input" value={draft.editalName} onChange={(event) => updateDraft("editalName", event.target.value)} />
                </Field>

                <Field label="Valor solicitado">
                  <input className="form-input" value={draft.valorSolicitado} onChange={(event) => updateDraft("valorSolicitado", event.target.value)} placeholder="Ex.: R$ 50.000,00" />
                </Field>

                <Field label="Proponente">
                  <input className="form-input" value={draft.proponente} onChange={(event) => updateDraft("proponente", event.target.value)} />
                </Field>

                <Field label="Linguagem">
                  <input className="form-input" value={draft.linguagem} onChange={(event) => updateDraft("linguagem", event.target.value)} />
                </Field>

                <div className="lg:col-span-2">
                  <Field label="Texto do edital / exigências">
                    <textarea className="form-input min-h-80" value={draft.editalText} onChange={(event) => updateDraft("editalText", event.target.value)} placeholder="Cole aqui o edital, critérios de avaliação, anexos exigidos e perguntas do formulário..." />
                  </Field>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={() => askIa("analisar edital e criar roteiro de preenchimento")}>
                  <Sparkles className="size-4" />
                  Analisar edital com IA
                </button>
                <button type="button" className="btn-secondary" onClick={() => setActiveTab("ia")}>
                  Ver resposta da IA
                </button>
              </div>
            </Section>
          ) : null}

          {activeTab === "texto" ? (
            <Section title="Texto do projeto" subtitle="Blocos principais para inscrição em edital.">
              <div className="grid gap-4">
                <Field label="Nome do projeto">
                  <input className="form-input" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="Ex.: Reféns" />
                </Field>

                {draftFields.map((field) => (
                  <Field key={field.key} label={field.label}>
                    <p className="mb-1 text-xs font-semibold text-slate-400">{field.helper}</p>
                    <textarea
                      className="form-input"
                      rows={field.rows || 5}
                      value={draft[field.key]}
                      onChange={(event) => updateDraft(field.key, event.target.value)}
                    />
                  </Field>
                ))}
              </div>
            </Section>
          ) : null}

          {activeTab === "revisao" ? (
            <Section title="Revisão e nota" subtitle="Checklist para fortalecer projeto antes do envio.">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Resumo claro", draft.resumo],
                  ["Justificativa consistente", draft.justificativa],
                  ["Objetivo geral preenchido", draft.objetivoGeral],
                  ["Metodologia detalhada", draft.metodologia],
                  ["Acessibilidade prevista", draft.acessibilidade],
                  ["Contrapartida descrita", draft.contrapartida],
                  ["Equipe selecionada", selectedTeam.length ? "ok" : ""],
                  ["Orçamento montado", budgetTotal > 0 ? "ok" : ""],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      {value ? (
                        <CheckCircle2 className="size-5 text-emerald-500" />
                      ) : (
                        <div className="size-5 rounded-full border-2 border-slate-300" />
                      )}
                      <p className="font-black text-slate-950">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" className="btn-primary mt-5" onClick={() => askIa("revisar projeto completo e apontar melhorias para edital")}>
                <Sparkles className="size-4" />
                Revisar projeto completo com IA
              </button>
            </Section>
          ) : null}

          {activeTab === "orcamento" ? (
            <Section title="Orçamento do projeto" subtitle="Rubricas, valores e justificativas.">
              <div className="space-y-4">
                {budget.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_100px_140px_44px]">
                      <input className="form-input" value={item.category} onChange={(event) => updateBudgetItem(item.id, { category: event.target.value })} placeholder="Categoria" />
                      <input className="form-input" value={item.description} onChange={(event) => updateBudgetItem(item.id, { description: event.target.value })} placeholder="Descrição" />
                      <input className="form-input" type="number" value={item.quantity} onChange={(event) => updateBudgetItem(item.id, { quantity: Number(event.target.value) })} />
                      <input className="form-input" type="number" value={item.unitValue} onChange={(event) => updateBudgetItem(item.id, { unitValue: Number(event.target.value) })} />
                      <button type="button" className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600" onClick={() => removeBudgetItem(item.id)}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <textarea className="form-input mt-3 min-h-20" value={item.justification} onChange={(event) => updateBudgetItem(item.id, { justification: event.target.value })} placeholder="Justificativa da rubrica..." />

                    <p className="mt-2 text-right text-sm font-black text-slate-950">
                      Total: {money(item.quantity * item.unitValue)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button type="button" className="btn-secondary" onClick={addBudgetItem}>
                  <Plus className="size-4" />
                  Nova rubrica
                </button>

                <div className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                  Total: {money(budgetTotal)}
                </div>
              </div>
            </Section>
          ) : null}

          {activeTab === "equipe" ? (
            <Section title="Equipe do projeto" subtitle="Equipe sincronizada com o VIVA e selecionável para a escrita.">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-xl flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input className="form-input pl-10" value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="Buscar nome, função, e-mail..." />
                </div>

                <button type="button" className="btn-secondary" onClick={() => void syncTeam()}>
                  <RefreshCw className={loadingTeam ? "size-4 animate-spin" : "size-4"} />
                  Sincronizar
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredTeam.map((member) => {
                  const selected = selectedTeamIds.includes(member.id);

                  return (
                    <button key={member.id} type="button" onClick={() => toggleMember(member.id)} className={selected ? "rounded-3xl border border-primary bg-primary/10 p-4 text-left shadow-sm" : "rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-primary/40 hover:bg-white"}>
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
                          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {member.source === "cerebro" ? "Cérebro IA" : "VIVA"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-black text-slate-950">Adicionar nova pessoa</h3>
                <div className="mt-3 grid gap-3 lg:grid-cols-5">
                  <input className="form-input" value={newMember.name} onChange={(event) => setNewMember((current) => ({ ...current, name: event.target.value }))} placeholder="Nome" />
                  <input className="form-input" value={newMember.role} onChange={(event) => setNewMember((current) => ({ ...current, role: event.target.value }))} placeholder="Função" />
                  <input className="form-input" value={newMember.email} onChange={(event) => setNewMember((current) => ({ ...current, email: event.target.value }))} placeholder="E-mail" />
                  <input className="form-input" value={newMember.phone} onChange={(event) => setNewMember((current) => ({ ...current, phone: event.target.value }))} placeholder="Telefone" />
                  <button type="button" className="btn-primary" onClick={() => void addMember()}>
                    <Plus className="size-4" />
                    Adicionar
                  </button>
                </div>
              </div>
            </Section>
          ) : null}

          {activeTab === "docs" ? (
            <Section title="Documentos e anexos" subtitle="Controle do que precisa ser enviado junto ao projeto.">
              <div className="grid gap-4 md:grid-cols-3">
                {["Edital", "Anexo", "Currículo", "Portfólio", "Orçamento", "Documento oficial"].map((category) => (
                  <label key={category} className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-primary hover:bg-white">
                    <UploadCloud className="mx-auto size-6 text-primary" />
                    <p className="mt-2 font-black text-slate-950">{category}</p>
                    <p className="mt-1 text-sm text-slate-500">Registrar arquivo</p>
                    <input type="file" className="hidden" onChange={(event) => {
                      addAttachment(event.target.files?.[0] || null, category);
                      event.currentTarget.value = "";
                    }} />
                  </label>
                ))}
              </div>

              <div className="mt-6 grid gap-3">
                {attachments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                    Nenhum documento registrado ainda.
                  </div>
                ) : null}

                {attachments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="font-black text-slate-950">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.category}</p>
                    </div>
                    <button type="button" className="text-sm font-black text-rose-600" onClick={() => setAttachments((current) => current.filter((doc) => doc.id !== item.id))}>
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {activeTab === "ia" ? (
            <Section title="Assistente IA" subtitle="Use sua chave Groq/OpenAI configurada na Vercel.">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div>
                  <textarea className="form-input min-h-64" value={iaPrompt} onChange={(event) => setIaPrompt(event.target.value)} placeholder="Ex.: melhore a justificativa, reescreva o resumo, monte uma metodologia, revise o projeto com foco em edital público..." />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className="btn-primary" disabled={loadingIa} onClick={() => askIa("revisar projeto completo")}>
                      {loadingIa ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                      Revisar projeto
                    </button>

                    <button type="button" className="btn-secondary" disabled={loadingIa} onClick={() => askIa("melhorar justificativa")}>
                      Melhorar justificativa
                    </button>

                    <button type="button" className="btn-secondary" disabled={loadingIa} onClick={() => askIa("criar metodologia")}>
                      Criar metodologia
                    </button>

                    <button type="button" className="btn-secondary" disabled={loadingIa} onClick={() => askIa("revisar orçamento")}>
                      Revisar orçamento
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Resposta</p>
                  <div className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {iaOutput || "A resposta da IA aparecerá aqui."}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <select className="form-input" value={applyTarget} onChange={(event) => setApplyTarget(event.target.value as DraftKey)}>
                      {draftFields.map((field) => (
                        <option key={field.key} value={field.key}>{field.label}</option>
                      ))}
                    </select>

                    <button type="button" className="btn-primary" onClick={applyIaOutput}>
                      Aplicar resposta no bloco
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          ) : null}

          {activeTab === "exportar" ? (
            <Section title="Exportar projeto" subtitle="Gere arquivos para copiar, revisar ou anexar.">
              <div className="grid gap-4 md:grid-cols-3">
                <ExportCard title="Projeto completo" text="Baixar em Word com texto, equipe e orçamento." button="Baixar Word" onClick={exportWord} />
                <ExportCard title="Salvar como PDF" text="Abre a impressão do navegador para salvar PDF." button="Gerar PDF" onClick={printPdf} />
                <ExportCard title="Backup do projeto" text="Arquivo JSON com todos os dados salvos." button="Baixar backup" onClick={exportJson} />
              </div>
            </Section>
          ) : null}
        </main>
      </section>
    </div>
  );
}

function labelForDraftKey(key: DraftKey) {
  return draftFields.find((field) => field.key === key)?.label || key;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={active ? "flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white" : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"}>
      {icon}
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
  icon: ReactNode;
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
      <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">{text}</p>
      <button type="button" className="btn-secondary mt-5" onClick={onClick}>
        {button}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ExportCard({
  title,
  text,
  button,
  onClick,
}: {
  title: string;
  text: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{text}</p>
      <button type="button" className="btn-primary mt-4" onClick={onClick}>
        <Download className="size-4" />
        {button}
      </button>
    </div>
  );
}
