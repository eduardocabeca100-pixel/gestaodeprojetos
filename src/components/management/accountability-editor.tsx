/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckCircle2,
  Download,
  FileText,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Plus,
  Save,
  Trash2,
  Type,
  Underline,
  Table2,
  Highlighter,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccountabilityConnectedPanel } from "@/components/management/accountability-connected-panel";

type NarrativeSection = {
  id: string;
  title: string;
  content: string;
  done: boolean;
};

type EvidencePhoto = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  caption: string;
  uploadedAt: string;
};

type EvidenceLink = {
  id: string;
  title: string;
  url: string;
  type: "Drive" | "YouTube" | "Instagram" | "Site" | "Outro";
};

type AttendanceSummary = {
  totalParticipants: string;
  completedClasses: string;
  averageAttendance: string;
  certificatesIssued: string;
};

type AccountabilityEditorState = {
  projectName: string;
  periodStart: string;
  periodEnd: string;
  emittedAt: string;
  responsible: string;
  sections: NarrativeSection[];
  photos: EvidencePhoto[];
  links: EvidenceLink[];
  attendance: AttendanceSummary;
};

const storageKey = "viva:central-cultural:accountability-editor:v1";

const defaultState: AccountabilityEditorState = {
  projectName: "Nome do projeto",
  periodStart: "",
  periodEnd: "",
  emittedAt: new Date().toISOString().slice(0, 10),
  responsible: "Cia de Artes Viva",
  sections: [
    {
      id: "sec-relatorio-narrativo",
      title: "Relatório narrativo",
      done: false,
      content:
        "<p>Descreva de forma clara o que foi realizado no projeto, quais ações aconteceram, em quais datas e quais resultados foram percebidos até o momento.</p>",
    },
    {
      id: "sec-desenvolvimento",
      title: "Desenvolvimento do projeto",
      done: false,
      content:
        "<p>Explique como o projeto está sendo desenvolvido, quais etapas já foram cumpridas, quais ajustes foram necessários e como a equipe conduziu a execução.</p>",
    },
    {
      id: "sec-resultados",
      title: "Resultados alcançados",
      done: false,
      content:
        "<p>Registre resultados culturais, sociais, pedagógicos, artísticos e comunitários alcançados pelo projeto.</p>",
    },
    {
      id: "sec-presenca",
      title: "Participantes, presença e frequência",
      done: false,
      content:
        "<p>Informe quantidade de participantes, presença nas aulas, oficinas, workshops ou atividades e dados de frequência.</p>",
    },
    {
      id: "sec-financeiro",
      title: "Resumo financeiro",
      done: false,
      content:
        "<p>Registre informações financeiras importantes: pagamentos realizados, comprovantes organizados, recibos, demonstrativos e pendências.</p>",
    },
    {
      id: "sec-evidencias",
      title: "Fotos, vídeos e evidências",
      done: false,
      content:
        "<p>Liste as fotos, vídeos, links de Drive, materiais de divulgação, prints de redes sociais e demais comprovações.</p>",
    },
    {
      id: "sec-observacoes",
      title: "Observações finais",
      done: false,
      content:
        "<p>Inclua observações, dificuldades, soluções, melhorias e próximos passos para continuidade ou encerramento da prestação.</p>",
    },
  ],
  photos: [],
  links: [],
  attendance: {
    totalParticipants: "",
    completedClasses: "",
    averageAttendance: "",
    certificatesIssued: "",
  },
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readState() {
  if (typeof window === "undefined") return defaultState;

  try {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) return defaultState;

    return {
      ...defaultState,
      ...(JSON.parse(saved) as AccountabilityEditorState),
    };
  } catch {
    return defaultState;
  }
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

function runEditorCommand(command: string, value?: string) {
  window.document.execCommand(command, false, value);
}

export function AccountabilityEditor() {
  const [state, setState] = useState<AccountabilityEditorState>(defaultState);
  const [clientReady, setClientReady] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(defaultState.sections[0]?.id ?? "");
  const [message, setMessage] = useState("Editor de prestação carregado.");
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const saved = readState();
      setState(saved);
      setActiveSectionId(saved.sections[0]?.id ?? "");
      setClientReady(true);
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!clientReady) return;

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      setMessage(`Salvo automaticamente às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`);
    }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [clientReady, state]);

  const activeSection = useMemo(
    () => state.sections.find((section) => section.id === activeSectionId) ?? state.sections[0],
    [activeSectionId, state.sections],
  );

  const completion = useMemo(() => {
    const done = state.sections.filter((section) => section.done).length;
    return state.sections.length ? Math.round((done / state.sections.length) * 100) : 0;
  }, [state.sections]);

  const generatedText = useMemo(() => {
    const sectionsText = state.sections
      .map((section, index) => {
        return `${index + 1}. ${section.title.toUpperCase()}\n${stripHtml(section.content)}`;
      })
      .join("\n\n");

    const linksText = state.links.length
      ? state.links.map((link) => `- ${link.type}: ${link.title} — ${link.url}`).join("\n")
      : "Nenhum link cadastrado.";

    const photosText = state.photos.length
      ? state.photos.map((photo) => `- ${photo.fileName}: ${photo.caption || "sem legenda"}`).join("\n")
      : "Nenhuma foto/evidência anexada.";

    return `PRESTAÇÃO DE CONTAS / RELATÓRIO NARRATIVO

Projeto: ${state.projectName}
Responsável: ${state.responsible}
Período analisado: ${state.periodStart || "não informado"} até ${state.periodEnd || "data atual"}
Data de emissão: ${state.emittedAt}

RESUMO DE PARTICIPAÇÃO
Participantes: ${state.attendance.totalParticipants || "não informado"}
Aulas/atividades realizadas: ${state.attendance.completedClasses || "não informado"}
Frequência média: ${state.attendance.averageAttendance || "não informado"}
Certificados emitidos: ${state.attendance.certificatesIssued || "não informado"}

${sectionsText}

FOTOS E EVIDÊNCIAS ANEXADAS
${photosText}

LINKS DE COMPROVAÇÃO
${linksText}
`;
  }, [state]);

  function commit(nextState: AccountabilityEditorState, nextMessage = "Alteração salva automaticamente.") {
    setState(nextState);
    setMessage(nextMessage);
  }

  function updateSection(sectionId: string, patch: Partial<NarrativeSection>) {
    commit({
      ...state,
      sections: state.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    });
  }

  function insertHtml(html: string) {
    runEditorCommand("insertHTML", html);
    window.setTimeout(() => {
      const activeElement = window.document.activeElement;

      if (activeElement instanceof HTMLElement && activeSection?.id) {
        updateSection(activeSection.id, { content: activeElement.innerHTML });
      }
    }, 0);
  }

  function addSection() {
    const nextSection: NarrativeSection = {
      id: makeId("sec"),
      title: "Nova seção",
      content: "<p>Escreva aqui...</p>",
      done: false,
    };

    commit(
      {
        ...state,
        sections: [...state.sections, nextSection],
      },
      "Nova seção criada.",
    );
    setActiveSectionId(nextSection.id);
  }

  function removeSection(sectionId: string) {
    if (!window.confirm("Apagar esta seção da prestação?")) return;

    const nextSections = state.sections.filter((section) => section.id !== sectionId);

    commit(
      {
        ...state,
        sections: nextSections,
      },
      "Seção removida.",
    );
    setActiveSectionId(nextSections[0]?.id ?? "");
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;

    const maxSize = 4 * 1024 * 1024;
    const nextPhotos: EvidencePhoto[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setMessage("Envie apenas imagens nesta área.");
        continue;
      }

      if (file.size > maxSize) {
        setMessage("Uma das imagens passou de 4 MB. Para teste local, use imagens menores.");
        continue;
      }

      const dataUrl = await fileToDataUrl(file);

      nextPhotos.push({
        id: makeId("foto"),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dataUrl,
        caption: "",
        uploadedAt: new Date().toISOString(),
      });
    }

    if (nextPhotos.length) {
      commit(
        {
          ...state,
          photos: [...nextPhotos, ...state.photos],
        },
        "Foto/evidência adicionada.",
      );
    }
  }

  function addLink() {
    commit(
      {
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
      },
      "Link criado.",
    );
  }

  if (!clientReady || !activeSection) {
    return (
      <div className="rounded-3xl border border-white bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando editor de prestação...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-primary p-6 text-white">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">
                Prestação de contas
              </p>
              <h3 className="mt-2 text-2xl font-black">
                Editor narrativo e evidências
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
                Escreva a prestação dentro do sistema com salvamento automático, organize fotos, links e resumo de presença.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadText("prestacao-contas-relatorio.txt", generatedText)}
              >
                <Download className="size-4" />
                Baixar TXT
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.localStorage.setItem(storageKey, JSON.stringify(state));
                  setMessage("Prestação salva manualmente.");
                }}
              >
                <Save className="size-4" />
                Salvar agora
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 bg-white p-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Conclusão</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{completion}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Seções</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{state.sections.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Fotos</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{state.photos.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Status</p>
            <p className="mt-2 text-sm font-bold text-emerald-700">{message}</p>
          </div>
        </div>
      </div>

      <AccountabilityConnectedPanel onInsert={insertHtml} />

      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
        <h4 className="text-lg font-black text-slate-950">Dados principais</h4>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block xl:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Projeto
            </span>
            <input
              className="form-input mt-1"
              value={state.projectName}
              onChange={(event) =>
                commit({ ...state, projectName: event.target.value })
              }
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Início
            </span>
            <input
              className="form-input mt-1"
              type="date"
              value={state.periodStart}
              onChange={(event) =>
                commit({ ...state, periodStart: event.target.value })
              }
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Fim previsto
            </span>
            <input
              className="form-input mt-1"
              type="date"
              value={state.periodEnd}
              onChange={(event) =>
                commit({ ...state, periodEnd: event.target.value })
              }
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Emissão
            </span>
            <input
              className="form-input mt-1"
              type="date"
              value={state.emittedAt}
              onChange={(event) =>
                commit({ ...state, emittedAt: event.target.value })
              }
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Participantes
            </span>
            <input
              className="form-input mt-1"
              value={state.attendance.totalParticipants}
              onChange={(event) =>
                commit({
                  ...state,
                  attendance: { ...state.attendance, totalParticipants: event.target.value },
                })
              }
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Aulas/atividades
            </span>
            <input
              className="form-input mt-1"
              value={state.attendance.completedClasses}
              onChange={(event) =>
                commit({
                  ...state,
                  attendance: { ...state.attendance, completedClasses: event.target.value },
                })
              }
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Frequência média
            </span>
            <input
              className="form-input mt-1"
              value={state.attendance.averageAttendance}
              onChange={(event) =>
                commit({
                  ...state,
                  attendance: { ...state.attendance, averageAttendance: event.target.value },
                })
              }
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Certificados
            </span>
            <input
              className="form-input mt-1"
              value={state.attendance.certificatesIssued}
              onChange={(event) =>
                commit({
                  ...state,
                  attendance: { ...state.attendance, certificatesIssued: event.target.value },
                })
              }
            />
          </label>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
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
              <input
                className="form-input max-w-xl text-lg font-black"
                value={activeSection.title}
                onChange={(event) =>
                  updateSection(activeSection.id, { title: event.target.value })
                }
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateSection(activeSection.id, { done: !activeSection.done })
                  }
                >
                  <CheckCircle2 className="size-4" />
                  {activeSection.done ? "Reabrir" : "Concluir"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeSection(activeSection.id)}
                >
                  <Trash2 className="size-4" />
                  Apagar
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
              <ToolbarButton label="Parágrafo" icon={Type} onClick={() => runEditorCommand("formatBlock", "p")} />
              <ToolbarButton label="Título 2" icon={Heading2} onClick={() => runEditorCommand("formatBlock", "h2")} />
              <ToolbarButton label="Título 3" icon={Heading3} onClick={() => runEditorCommand("formatBlock", "h3")} />
              <ToolbarButton label="Negrito" icon={Bold} onClick={() => runEditorCommand("bold")} />
              <ToolbarButton label="Itálico" icon={Italic} onClick={() => runEditorCommand("italic")} />
              <ToolbarButton label="Sublinhado" icon={Underline} onClick={() => runEditorCommand("underline")} />
              <ToolbarButton label="Lista" icon={List} onClick={() => runEditorCommand("insertUnorderedList")} />
              <ToolbarButton label="Numerada" icon={ListOrdered} onClick={() => runEditorCommand("insertOrderedList")} />
              <ToolbarButton label="Esquerda" icon={AlignLeft} onClick={() => runEditorCommand("justifyLeft")} />
              <ToolbarButton label="Centro" icon={AlignCenter} onClick={() => runEditorCommand("justifyCenter")} />
              <ToolbarButton label="Direita" icon={AlignRight} onClick={() => runEditorCommand("justifyRight")} />
              <ToolbarButton label="Tabela" icon={Table2} onClick={() => insertHtml('<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;"><tbody><tr><td><strong>Campo</strong></td><td>Informação</td></tr><tr><td>Descrição</td><td>Digite aqui</td></tr></tbody></table><p><br></p>')} />
              <ToolbarButton label="Marca" icon={Highlighter} onClick={() => runEditorCommand("backColor", "#FEF3C7")} />
            </div>
          </div>

          <div className="bg-white p-5">
            <div
              key={activeSection.id}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[460px] rounded-3xl border border-slate-200 bg-white p-6 text-base leading-8 text-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:text-xl [&_h3]:font-black [&_ol]:ml-6 [&_ol]:list-decimal [&_ul]:ml-6 [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: activeSection.content }}
              onInput={(event) =>
                updateSection(activeSection.id, {
                  content: event.currentTarget.innerHTML,
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-black text-slate-950">Fotos e evidências</h4>
              <p className="text-sm text-slate-500">Suba fotos para organizar a prestação.</p>
            </div>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90">
              <UploadCloud className="mr-2 size-4" />
              Subir fotos
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  void uploadPhotos(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {state.photos.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 md:col-span-2">
                <ImagePlus className="mx-auto mb-3 size-8 text-slate-300" />
                Nenhuma foto enviada ainda.
              </div>
            ) : null}

            {state.photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <img src={photo.dataUrl} alt={photo.fileName} className="h-56 w-full object-cover" />

                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-sm font-black text-slate-950">{photo.fileName}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(photo.fileSize)}</p>
                  </div>

                  <input
                    className="form-input"
                    value={photo.caption}
                    placeholder="Legenda da foto..."
                    onChange={(event) =>
                      commit({
                        ...state,
                        photos: state.photos.map((item) =>
                          item.id === photo.id ? { ...item, caption: event.target.value } : item,
                        ),
                      })
                    }
                  />

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      commit({
                        ...state,
                        photos: state.photos.filter((item) => item.id !== photo.id),
                      }, "Foto removida.")
                    }
                  >
                    <Trash2 className="size-4" />
                    Apagar foto
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-black text-slate-950">Links de comprovação</h4>
              <p className="text-sm text-slate-500">Drive, vídeos, redes sociais e materiais públicos.</p>
            </div>

            <Button type="button" onClick={addLink}>
              <Plus className="size-4" />
              Novo link
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {state.links.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                <LinkIcon className="mx-auto mb-3 size-8 text-slate-300" />
                Nenhum link cadastrado.
              </div>
            ) : null}

            {state.links.map((link) => (
              <div key={link.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 xl:grid-cols-[150px_minmax(0,1fr)]">
                  <select
                    className="form-input"
                    value={link.type}
                    onChange={(event) =>
                      commit({
                        ...state,
                        links: state.links.map((item) =>
                          item.id === link.id
                            ? { ...item, type: event.target.value as EvidenceLink["type"] }
                            : item,
                        ),
                      })
                    }
                  >
                    <option>Drive</option>
                    <option>YouTube</option>
                    <option>Instagram</option>
                    <option>Site</option>
                    <option>Outro</option>
                  </select>

                  <input
                    className="form-input"
                    value={link.title}
                    placeholder="Título do link"
                    onChange={(event) =>
                      commit({
                        ...state,
                        links: state.links.map((item) =>
                          item.id === link.id ? { ...item, title: event.target.value } : item,
                        ),
                      })
                    }
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    className="form-input"
                    value={link.url}
                    placeholder="https://..."
                    onChange={(event) =>
                      commit({
                        ...state,
                        links: state.links.map((item) =>
                          item.id === link.id ? { ...item, url: event.target.value } : item,
                        ),
                      })
                    }
                  />

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      commit({
                        ...state,
                        links: state.links.filter((item) => item.id !== link.id),
                      }, "Link removido.")
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {link.url ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                  >
                    <LinkIcon className="size-4" />
                    Abrir link
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>


      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-black text-slate-950">Prévia institucional ao vivo</h4>
            <p className="text-sm text-slate-500">
              Visualização do relatório enquanto você escreve.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => downloadText("prestacao-contas-relatorio.txt", generatedText)}>
            <Download className="size-4" />
            Baixar TXT
          </Button>
        </div>

        <div className="mt-5 max-h-[640px] overflow-auto rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/50">Cia de Artes Viva</p>
            <h2 className="mt-2 text-2xl font-black">Prestação de Contas</h2>
            <p className="mt-1 text-sm text-white/70">{state.projectName}</p>
          </div>

          <div className="mt-5 space-y-4">
            {state.sections.map((section) => (
              <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-black text-slate-950">{section.title}</h3>
                <div
                  className="mt-3 text-sm leading-7 text-slate-700"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-black text-slate-950">Prévia textual</h4>
            <p className="text-sm text-slate-500">
              No próximo bloco, essa prévia vira PDF institucional bonito.
            </p>
          </div>

          <Button type="button" onClick={() => downloadText("prestacao-contas-relatorio.txt", generatedText)}>
            <FileText className="size-4" />
            Baixar relatório TXT
          </Button>
        </div>

        <pre className="mt-5 max-h-[560px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-950 p-5 text-sm leading-6 text-white">
          {generatedText}
        </pre>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Bold;
  onClick: () => void;
}) {
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
