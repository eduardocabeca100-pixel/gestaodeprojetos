/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BarChart3,
  Bold,
  CheckCircle2,
  Download,
  FileCheck2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Paperclip,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Type,
  Underline,
  UploadCloud,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getActiveProjectScope, projectScopedKey } from "@/lib/project-scope";
import { formatCurrency } from "@/lib/utils/format-currency";

type IconComponent = ComponentType<{ className?: string }>;

type Section = {
  id: string;
  title: string;
  content: string;
  done: boolean;
};

type Photo = {
  id: string;
  fileName: string;
  fileSize: number;
  dataUrl: string;
  caption: string;
};

type EvidenceLink = {
  id: string;
  title: string;
  url: string;
  type: "Drive" | "YouTube" | "Instagram" | "Site" | "Outro";
};

type AccountabilityState = {
  projectName: string;
  responsible: string;
  periodStart: string;
  periodEnd: string;
  emittedAt: string;
  sections: Section[];
  photos: Photo[];
  links: EvidenceLink[];
};

type ConnectedDoc = {
  name?: string;
  category?: string;
  status?: string;
  validUntil?: string;
  fileName?: string;
};

type ConnectedData = {
  documents: ConnectedDoc[];
  participants: number;
  team: number;
  schedule: number;
  financeApproved: number;
  financeExecuted: number;
};

const storageKeyBase = "viva:central-cultural:accountability-editor:v3";

const defaultState: AccountabilityState = {
  projectName: getActiveProjectScope().name,
  responsible: "Cia de Artes Viva",
  periodStart: "",
  periodEnd: "",
  emittedAt: new Date().toISOString().slice(0, 10),
  sections: [
    {
      id: "narrativo",
      title: "Relatório narrativo",
      done: false,
      content: "<p>Descreva o que foi realizado no projeto, quais etapas aconteceram, em quais datas e quais resultados foram percebidos.</p>",
    },
    {
      id: "resultados",
      title: "Resultados alcançados",
      done: false,
      content: "<p>Registre os resultados culturais, sociais, pedagógicos e artísticos alcançados.</p>",
    },
    {
      id: "participantes",
      title: "Participantes e presença",
      done: false,
      content: "<p>Insira informações de participantes, presença, frequência e atividades realizadas.</p>",
    },
    {
      id: "documentos",
      title: "Documentos e certidões",
      done: false,
      content: "<p>Insira o resumo dos documentos, certidões, validade e pendências.</p>",
    },
    {
      id: "financeiro",
      title: "Resumo financeiro",
      done: false,
      content: "<p>Insira o resumo financeiro do projeto, pagamentos, comprovantes e demonstrativos administrativos.</p>",
    },
    {
      id: "evidencias",
      title: "Fotos, vídeos e evidências",
      done: false,
      content: "<p>Insira fotos, links de Drive, vídeos, prints de divulgação e demais evidências.</p>",
    },
    {
      id: "conclusao",
      title: "Conclusão e observações finais",
      done: false,
      content: "<p>Inclua dificuldades, soluções, melhorias, próximos passos e conclusão.</p>",
    },
  ],
  photos: [],
  links: [],
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function countStoredItems(pattern: RegExp) {
  if (typeof window === "undefined") return 0;
  let total = 0;

  for (const key of Object.keys(window.localStorage)) {
    if (!pattern.test(key)) continue;

    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
      if (Array.isArray(parsed)) total += parsed.length;
      else if (parsed && typeof parsed === "object") total += Object.values(parsed).flat().length;
    } catch {
      continue;
    }
  }

  return total;
}

function getConnectedData(): ConnectedData {
  const documents = readJson<ConnectedDoc[]>(projectScopedKey("viva:central-cultural:documents:v1"), []);
  const central = readJson<{
    financeSummary?: { approved?: number; executed?: number };
  }>("viva:central-cultural:v2", {});
  const assignments = readJson<Record<string, unknown[]>>("viva:project-team-assignments:v1", {});
  const roster = readJson<unknown[]>("viva:team-roster:v1", []);
  const team = Object.values(assignments).flat().length || roster.length;

  return {
    documents,
    participants: countStoredItems(/participant|participante|aluno|presenca|attendance/i),
    team,
    schedule: countStoredItems(/viva:schedule.*activities/i),
    financeApproved: Number(central.financeSummary?.approved ?? 0),
    financeExecuted: Number(central.financeSummary?.executed ?? 0),
  };
}

function stripHtml(html: string) {
  if (typeof window === "undefined") return html.replace(/<[^>]+>/g, "");
  const element = window.document.createElement("div");
  element.innerHTML = html;
  return element.textContent || element.innerText || "";
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function command(commandName: string, value?: string) {
  window.document.execCommand(commandName, false, value);
}

function printPdf(title: string, html: string) {
  const win = window.open("", "_blank", "width=1000,height=900");

  if (!win) {
    window.alert("O navegador bloqueou a janela de impressão. Libere pop-ups para gerar o PDF.");
    return;
  }

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; background: #f3f4f6; color: #111827; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: white; padding: 18mm; }
  .cover { background: linear-gradient(135deg, #111827, #7f1d1d); color: white; padding: 28px; border-radius: 20px; margin-bottom: 24px; }
  .cover small { text-transform: uppercase; letter-spacing: 3px; opacity: .7; font-weight: 700; }
  .cover h1 { margin: 10px 0 8px; font-size: 30px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 18px 0; font-size: 12px; }
  .meta div { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
  h2 { margin-top: 28px; color: #7f1d1d; border-bottom: 2px solid #7f1d1d; padding-bottom: 6px; }
  h3 { margin-top: 18px; color: #111827; }
  p { line-height: 1.65; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
  th { background: #f9fafb; }
  img { max-width: 100%; max-height: 420px; border-radius: 12px; margin: 12px 0; }
  figcaption { font-size: 11px; color: #6b7280; margin-top: 4px; }
  .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #6b7280; }
  @media print {
    body { background: white; }
    .page { width: auto; min-height: auto; margin: 0; padding: 0; }
  }
</style>
</head>
<body>
  <main class="page">${html}</main>
  <script>
    window.onload = () => {
      setTimeout(() => window.print(), 300);
    };
  </script>
</body>
</html>`);

  win.document.close();
}

function buildSystemSummaryHtml(data: ConnectedData) {
  const pendingDocs = data.documents.filter((doc) => doc.status !== "Aprovado").length;

  return `
    <h2>Resumo conectado do sistema</h2>
    <table>
      <tbody>
        <tr><td><strong>Participantes encontrados</strong></td><td>${data.participants}</td></tr>
        <tr><td><strong>Pessoas na equipe</strong></td><td>${data.team}</td></tr>
        <tr><td><strong>Aulas/atividades no cronograma</strong></td><td>${data.schedule}</td></tr>
        <tr><td><strong>Documentos cadastrados</strong></td><td>${data.documents.length}</td></tr>
        <tr><td><strong>Documentos pendentes</strong></td><td>${pendingDocs}</td></tr>
        <tr><td><strong>Valor aprovado</strong></td><td>${formatCurrency(data.financeApproved)}</td></tr>
        <tr><td><strong>Valor executado</strong></td><td>${formatCurrency(data.financeExecuted)}</td></tr>
        <tr><td><strong>Saldo estimado</strong></td><td>${formatCurrency(data.financeApproved - data.financeExecuted)}</td></tr>
      </tbody>
    </table>
  `;
}

function buildDocumentsHtml(data: ConnectedData) {
  const rows = data.documents.length
    ? data.documents
        .slice(0, 80)
        .map(
          (doc) =>
            `<tr><td>${doc.name ?? "-"}</td><td>${doc.category ?? "-"}</td><td>${doc.status ?? "-"}</td><td>${doc.validUntil ?? "-"}</td><td>${doc.fileName ?? "sem arquivo"}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="5">Nenhum documento cadastrado.</td></tr>`;

  return `
    <h2>Documentos e certidões</h2>
    <table>
      <thead>
        <tr><th>Documento</th><th>Categoria</th><th>Status</th><th>Validade</th><th>Arquivo</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildReportHtml(state: AccountabilityState, data: ConnectedData) {
  const sections = state.sections
    .map(
      (section) => `
        <section>
          <h2>${section.title}</h2>
          <div>${section.content}</div>
        </section>
      `,
    )
    .join("");

  const photos = state.photos.length
    ? `<h2>Fotos anexadas</h2>${state.photos
        .map(
          (photo) =>
            `<figure><img src="${photo.dataUrl}" alt="${photo.caption || photo.fileName}" /><figcaption>${photo.caption || photo.fileName}</figcaption></figure>`,
        )
        .join("")}`
    : "";

  const links = state.links.length
    ? `<h2>Links de comprovação</h2><ul>${state.links
        .map((link) => `<li><strong>${link.type}:</strong> ${link.title} — ${link.url}</li>`)
        .join("")}</ul>`
    : "";

  return `
    <div class="cover">
      <small>Cia de Artes Viva</small>
      <h1>Relatório de Prestação de Contas</h1>
      <p>${state.projectName}</p>
    </div>

    <div class="meta">
      <div><strong>Responsável:</strong><br/>${state.responsible}</div>
      <div><strong>Emissão:</strong><br/>${state.emittedAt}</div>
      <div><strong>Período inicial:</strong><br/>${state.periodStart || "não informado"}</div>
      <div><strong>Fim previsto / data atual:</strong><br/>${state.periodEnd || "data atual"}</div>
    </div>

    ${buildSystemSummaryHtml(data)}
    ${sections}
    ${photos}
    ${links}

    <div class="footer">
      Documento administrativo gerado pelo sistema VIVA Gestão Cultural. Esta versão deve ser conferida antes do envio oficial ao órgão responsável.
    </div>
  `;
}

function buildPlainText(state: AccountabilityState, data: ConnectedData) {
  const sections = state.sections
    .map((section, index) => `${index + 1}. ${section.title.toUpperCase()}\n${stripHtml(section.content)}`)
    .join("\n\n");

  return `PRESTAÇÃO DE CONTAS / RELATÓRIO NARRATIVO

Projeto: ${state.projectName}
Responsável: ${state.responsible}
Período: ${state.periodStart || "não informado"} até ${state.periodEnd || "data atual"}
Emissão: ${state.emittedAt}

DADOS CONECTADOS
Participantes: ${data.participants}
Equipe: ${data.team}
Atividades: ${data.schedule}
Documentos: ${data.documents.length}
Valor aprovado: ${formatCurrency(data.financeApproved)}
Valor executado: ${formatCurrency(data.financeExecuted)}
Saldo: ${formatCurrency(data.financeApproved - data.financeExecuted)}

${sections}
`;
}

export function AccountabilityEditor() {
  const [state, setState] = useState<AccountabilityState>(defaultState);
  const [data, setData] = useState<ConnectedData>(() => ({
    documents: [],
    participants: 0,
    team: 0,
    schedule: 0,
    financeApproved: 0,
    financeExecuted: 0,
  }));
  const [activeSectionId, setActiveSectionId] = useState(defaultState.sections[0]?.id ?? "");
  const [message, setMessage] = useState("Prestação carregada.");
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const saved = readJson<Partial<AccountabilityState>>(projectScopedKey(storageKeyBase), {});
      const merged = {
        ...defaultState,
        ...saved,
        sections: saved.sections?.length ? saved.sections : defaultState.sections,
        photos: saved.photos ?? [],
        links: saved.links ?? [],
      };

      setState(merged);
      setActiveSectionId(merged.sections[0]?.id ?? "");
      setData(getConnectedData());
      setReady(true);
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(() => {
      window.localStorage.setItem(projectScopedKey(storageKeyBase), JSON.stringify(state));
      setMessage(`Salvo automaticamente às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
    }, 450);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [ready, state]);

  const activeSection = useMemo(
    () => state.sections.find((section) => section.id === activeSectionId) ?? state.sections[0],
    [activeSectionId, state.sections],
  );

  const completion = useMemo(() => {
    const done = state.sections.filter((section) => section.done).length;
    return state.sections.length ? Math.round((done / state.sections.length) * 100) : 0;
  }, [state.sections]);

  const reportHtml = useMemo(() => buildReportHtml(state, data), [state, data]);
  const plainText = useMemo(() => buildPlainText(state, data), [state, data]);

  function commit(nextState: AccountabilityState, nextMessage = "Alteração salva.") {
    setState(nextState);
    setMessage(nextMessage);
  }

  function updateSection(sectionId: string, patch: Partial<Section>) {
    commit({
      ...state,
      sections: state.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    });
  }

  function syncEditor() {
    if (!editorRef.current || !activeSection) return;
    updateSection(activeSection.id, { content: editorRef.current.innerHTML });
  }

  function editorCommand(commandName: string, value?: string) {
    command(commandName, value);
    window.setTimeout(syncEditor, 0);
  }

  function insertHtml(html: string) {
    command("insertHTML", html);
    window.setTimeout(syncEditor, 0);
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    const nextPhotos: Photo[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;

      if (file.size > 4 * 1024 * 1024) {
        setMessage("Uma imagem passou de 4 MB. Para teste local use arquivos menores.");
        continue;
      }

      nextPhotos.push({
        id: makeId("foto"),
        fileName: file.name,
        fileSize: file.size,
        dataUrl: await fileToDataUrl(file),
        caption: "",
      });
    }

    if (nextPhotos.length) {
      commit({ ...state, photos: [...nextPhotos, ...state.photos] }, "Foto adicionada.");
    }
  }

  function addLink() {
    commit({
      ...state,
      links: [
        {
          id: makeId("link"),
          title: "Novo link",
          url: "",
          type: "Drive",
        },
        ...state.links,
      ],
    });
  }

  function addSection() {
    const nextSection = {
      id: makeId("secao"),
      title: "Nova seção",
      content: "<p>Escreva aqui...</p>",
      done: false,
    };

    commit({ ...state, sections: [...state.sections, nextSection] }, "Nova seção criada.");
    setActiveSectionId(nextSection.id);
  }

  function removeSection(sectionId: string) {
    if (!window.confirm("Apagar esta seção?")) return;
    const nextSections = state.sections.filter((section) => section.id !== sectionId);
    commit({ ...state, sections: nextSections }, "Seção apagada.");
    setActiveSectionId(nextSections[0]?.id ?? "");
  }

  function refreshData() {
    setData(getConnectedData());
    setMessage("Dados conectados atualizados.");
  }

  if (!ready || !activeSection) {
    return (
      <div className="rounded-3xl border border-white bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando prestação...
      </div>
    );
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.9fr)_minmax(560px,0.7fr)]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-primary p-6 text-white">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">
                  Prestação de contas
                </p>
                <h3 className="mt-2 text-2xl font-black">Editor com prévia lateral e PDF</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
                  Escreva, insira fotos no texto, puxe dados do sistema e visualize o relatório na lateral.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={refreshData}>
                  <RefreshCw className="size-4" />
                  Atualizar dados
                </Button>
                <Button type="button" variant="outline" onClick={() => printPdf("prestacao-contas", reportHtml)}>
                  <Download className="size-4" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 bg-white p-4 md:grid-cols-4">
            <Metric label="Conclusão" value={`${completion}%`} />
            <Metric label="Fotos" value={String(state.photos.length)} />
            <Metric label="Links" value={String(state.links.length)} />
            <Metric label="Status" value={message} small />
          </div>
        </div>

        <div className="rounded-3xl border border-white bg-white p-6 shadow-sm">
          <h4 className="text-lg font-black text-slate-950">Dados principais</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Projeto" span="xl:col-span-2">
              <input className="form-input" value={state.projectName} onChange={(event) => commit({ ...state, projectName: event.target.value })} />
            </Field>
            <Field label="Início">
              <input className="form-input" type="date" value={state.periodStart} onChange={(event) => commit({ ...state, periodStart: event.target.value })} />
            </Field>
            <Field label="Fim previsto">
              <input className="form-input" type="date" value={state.periodEnd} onChange={(event) => commit({ ...state, periodEnd: event.target.value })} />
            </Field>
            <Field label="Emissão">
              <input className="form-input" type="date" value={state.emittedAt} onChange={(event) => commit({ ...state, emittedAt: event.target.value })} />
            </Field>
          </div>
        </div>

        <div className="rounded-3xl border border-white bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h4 className="text-lg font-black text-slate-950">Dados conectados</h4>
              <p className="text-sm text-slate-500">Insira informações puxadas das outras abas direto no relatório.</p>
            </div>
            <Button type="button" variant="outline" onClick={refreshData}>
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <DataCard icon={UsersRound} label="Participantes" value={String(data.participants)} />
            <DataCard icon={UsersRound} label="Equipe" value={String(data.team)} />
            <DataCard icon={Paperclip} label="Documentos" value={String(data.documents.length)} />
            <DataCard icon={BarChart3} label="Atividades" value={String(data.schedule)} />
            <DataCard icon={Wallet} label="Executado" value={formatCurrency(data.financeExecuted)} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => insertHtml(buildSystemSummaryHtml(data))}>
              Inserir resumo conectado
            </Button>
            <Button type="button" variant="outline" onClick={() => insertHtml(buildDocumentsHtml(data))}>
              Inserir documentos
            </Button>
            <Button type="button" variant="outline" onClick={() => insertHtml("<h2>Participantes e frequência</h2><p>Participantes encontrados no sistema: " + data.participants + ".</p>")}>
              Inserir participantes
            </Button>
            <Button type="button" variant="outline" onClick={() => insertHtml("<h2>Resumo financeiro</h2><p>Valor aprovado: " + formatCurrency(data.financeApproved) + ". Valor executado: " + formatCurrency(data.financeExecuted) + ". Saldo: " + formatCurrency(data.financeApproved - data.financeExecuted) + ".</p>")}>
              Inserir financeiro
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-black text-slate-950">Seções</h4>
                <p className="text-sm text-slate-500">Clique para editar.</p>
              </div>
              <Button type="button" size="sm" onClick={addSection}>
                <Plus className="size-4" />
                Nova
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {state.sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  className={
                    section.id === activeSection.id
                      ? "w-full rounded-2xl border border-primary bg-primary/10 p-3 text-left"
                      : "w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-primary/30 hover:bg-primary/5"
                  }
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={section.done ? "size-4 text-emerald-600" : "size-4 text-slate-300"} />
                    <span className="text-sm font-black text-slate-950">{section.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <input className="form-input max-w-xl text-lg font-black" value={activeSection.title} onChange={(event) => updateSection(activeSection.id, { title: event.target.value })} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => updateSection(activeSection.id, { done: !activeSection.done })}>
                    <CheckCircle2 className="size-4" />
                    {activeSection.done ? "Reabrir" : "Concluir"}
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => removeSection(activeSection.id)}>
                    <Trash2 className="size-4" />
                    Apagar
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
                <ToolbarButton label="P" icon={Type} onClick={() => editorCommand("formatBlock", "p")} />
                <ToolbarButton label="H1" icon={Heading1} onClick={() => editorCommand("formatBlock", "h1")} />
                <ToolbarButton label="H2" icon={Heading2} onClick={() => editorCommand("formatBlock", "h2")} />
                <ToolbarButton label="H3" icon={Heading3} onClick={() => editorCommand("formatBlock", "h3")} />
                <ToolbarButton label="B" icon={Bold} onClick={() => editorCommand("bold")} />
                <ToolbarButton label="I" icon={Italic} onClick={() => editorCommand("italic")} />
                <ToolbarButton label="U" icon={Underline} onClick={() => editorCommand("underline")} />
                <ToolbarButton label="Marca" icon={Highlighter} onClick={() => editorCommand("backColor", "#FEF3C7")} />
                <ToolbarButton label="Lista" icon={List} onClick={() => editorCommand("insertUnorderedList")} />
                <ToolbarButton label="1,2" icon={ListOrdered} onClick={() => editorCommand("insertOrderedList")} />
                <ToolbarButton label="Esq" icon={AlignLeft} onClick={() => editorCommand("justifyLeft")} />
                <ToolbarButton label="Centro" icon={AlignCenter} onClick={() => editorCommand("justifyCenter")} />
                <ToolbarButton label="Dir" icon={AlignRight} onClick={() => editorCommand("justifyRight")} />
                <ToolbarButton label="Just" icon={AlignJustify} onClick={() => editorCommand("justifyFull")} />
                <ToolbarButton label="Limpar" icon={X} onClick={() => editorCommand("removeFormat")} />
              </div>
            </div>

            <div className="bg-white p-5">
              <div
                ref={editorRef}
                key={activeSection.id}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[520px] rounded-3xl border border-slate-200 bg-white p-6 text-base leading-8 text-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 [&_h1]:text-3xl [&_h1]:font-black [&_h2]:text-2xl [&_h2]:font-black [&_h3]:text-xl [&_h3]:font-black [&_img]:my-4 [&_img]:max-h-96 [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-200 [&_ol]:ml-6 [&_ol]:list-decimal [&_table]:my-4 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_ul]:ml-6 [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: activeSection.content }}
                onInput={(event) => updateSection(activeSection.id, { content: event.currentTarget.innerHTML })}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-black text-slate-950">Fotos e evidências</h4>
                <p className="text-sm text-slate-500">Suba várias fotos e insira direto no texto.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90">
                <UploadCloud className="mr-2 size-4" />
                Subir fotos
                <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { void uploadPhotos(event.target.files); event.currentTarget.value = ""; }} />
              </label>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {state.photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                  <img src={photo.dataUrl} alt={photo.fileName} className="h-48 w-full object-cover" />
                  <div className="space-y-3 p-4">
                    <p className="text-sm font-black text-slate-950">{photo.fileName}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(photo.fileSize)}</p>
                    <input className="form-input" value={photo.caption} placeholder="Legenda..." onChange={(event) => commit({ ...state, photos: state.photos.map((item) => item.id === photo.id ? { ...item, caption: event.target.value } : item) })} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => insertHtml(`<figure><img src="${photo.dataUrl}" alt="${photo.caption || photo.fileName}" /><figcaption>${photo.caption || photo.fileName}</figcaption></figure><p><br></p>`)}>
                        <ImagePlus className="size-4" />
                        Inserir no texto
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => commit({ ...state, photos: state.photos.filter((item) => item.id !== photo.id) }, "Foto apagada.")}>
                        <Trash2 className="size-4" />
                        Apagar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!state.photos.length ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 md:col-span-2">
                  <ImagePlus className="mx-auto mb-3 size-8 text-slate-300" />
                  Nenhuma foto enviada.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-black text-slate-950">Links de comprovação</h4>
                <p className="text-sm text-slate-500">Adicione vários links de Drive, vídeos e redes.</p>
              </div>
              <Button type="button" onClick={addLink}>
                <Plus className="size-4" />
                Novo link
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {state.links.map((link) => (
                <div key={link.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 xl:grid-cols-[150px_minmax(0,1fr)]">
                    <select className="form-input" value={link.type} onChange={(event) => commit({ ...state, links: state.links.map((item) => item.id === link.id ? { ...item, type: event.target.value as EvidenceLink["type"] } : item) })}>
                      <option>Drive</option>
                      <option>YouTube</option>
                      <option>Instagram</option>
                      <option>Site</option>
                      <option>Outro</option>
                    </select>
                    <input className="form-input" value={link.title} placeholder="Título" onChange={(event) => commit({ ...state, links: state.links.map((item) => item.id === link.id ? { ...item, title: event.target.value } : item) })} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input className="form-input" value={link.url} placeholder="https://..." onChange={(event) => commit({ ...state, links: state.links.map((item) => item.id === link.id ? { ...item, url: event.target.value } : item) })} />
                    <Button type="button" variant="destructive" onClick={() => commit({ ...state, links: state.links.filter((item) => item.id !== link.id) }, "Link apagado.")}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => insertHtml(`<p><strong>${link.type}:</strong> <a href="${link.url}" target="_blank">${link.title}</a></p>`)}>
                      <LinkIcon className="size-4" />
                      Inserir no texto
                    </Button>
                    {link.url ? <a className="text-sm font-bold text-primary hover:underline" href={link.url} target="_blank" rel="noreferrer">Abrir link</a> : null}
                  </div>
                </div>
              ))}
              {!state.links.length ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Nenhum link cadastrado.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <aside className="sticky top-4 h-fit rounded-3xl border border-white bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Prévia ampliada</p>
            <h4 className="mt-1 text-lg font-black text-slate-950">Visualização PDF</h4>
          </div>
          <Button type="button" onClick={() => printPdf("prestacao-contas", reportHtml)}>
            <Download className="size-4" />
            PDF
          </Button>
        </div>

        <div className="mt-5 max-h-[84vh] overflow-auto rounded-3xl border border-slate-200 bg-slate-100 p-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/50">Cia de Artes Viva</p>
              <h2 className="mt-2 text-2xl font-black">Prestação de Contas</h2>
              <p className="mt-1 text-sm text-white/70">{state.projectName}</p>
            </div>
            <div className="mt-4 text-sm leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: reportHtml }} />
          </div>
        </div>

        <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => downloadText("prestacao-contas-relatorio.txt", plainText)}>
          <FileCheck2 className="size-4" />
          Baixar cópia TXT
        </Button>
      </aside>
    </div>
  );
}

function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={small ? "mt-2 text-sm font-bold text-slate-700" : "mt-2 text-2xl font-black text-slate-950"}>{value}</p>
    </div>
  );
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: string }) {
  return (
    <label className={`block ${span ?? ""}`}>
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function DataCard({ icon: Icon, label, value }: { icon: IconComponent; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function ToolbarButton({ label, icon: Icon, onClick }: { label: string; icon: IconComponent; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
