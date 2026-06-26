"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  UsersRound,
} from "lucide-react";

import type { TeamMember } from "@/modules/team/types";

type ResumeFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  category: string;
};

type ResumePerson = {
  id: string;
  name: string;
  area: string;
  formation: string;
  courses: string;
  actingTime: string;
  experience: string;
  works: string;
  additionalInfo: string;
  cityState: string;
  files: ResumeFile[];
  source: "project" | "manual";
};

type ResumeTemplate = {
  id: string;
  editalName: string;
  referenceFile?: ResumeFile;
};

const peopleStorageKey = "viva:banco-curriculos:pessoas:clean-v1";
const templateStorageKey = "viva:banco-curriculos:modelo-atual:clean-v1";

const defaultTemplate: ResumeTemplate = {
  id: "modelo-atual",
  editalName: "Modelo por edital",
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function teamToResumePerson(member: TeamMember): ResumePerson {
  return {
    id: `team-${member.id}`,
    name: safeText(member.name) || "Pessoa sem nome",
    area: safeText(member.role) || "Equipe",
    formation: "",
    courses: "",
    actingTime: "",
    experience: safeText(member.notes),
    works: "",
    additionalInfo: "",
    cityState: "Jaraguá do Sul/SC",
    files: [],
    source: "project",
  };
}

function emptyPerson(): ResumePerson {
  return {
    id: makeId("manual"),
    name: "Nova pessoa",
    area: "",
    formation: "",
    courses: "",
    actingTime: "",
    experience: "",
    works: "",
    additionalInfo: "",
    cityState: "Jaraguá do Sul/SC",
    files: [],
    source: "manual",
  };
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toParagraphs(value: string) {
  const lines = String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "<p>Não informado.</p>";
  }

  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function todayLongBr() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

function fileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadBlob(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function buildResumeHtml(person: ResumePerson) {
  return `
    <section class="resume-page">
      <main class="resume-box">
        <section class="identity">
          <p><strong>Nome:</strong> ${escapeHtml(person.name || "Nome não informado")}</p>
          <p><strong>Área de atuação:</strong> ${escapeHtml(person.area || "Não informado")}</p>
        </section>

        <section class="content">
          <h2>Formação:</h2>
          ${toParagraphs(person.formation)}

          ${
            person.courses.trim()
              ? `<h2>Cursos:</h2>${toParagraphs(person.courses)}`
              : ""
          }

          ${
            person.actingTime.trim()
              ? `<p><strong>Tempo de atuação:</strong> ${escapeHtml(person.actingTime)}</p>`
              : ""
          }

          <h2>Experiência profissional:</h2>
          ${toParagraphs(person.experience)}

          <h2>Trabalhos:</h2>
          ${toParagraphs(person.works)}

          ${
            person.additionalInfo.trim()
              ? `<h2>Informações adicionais:</h2>${toParagraphs(person.additionalInfo)}`
              : ""
          }

          <p class="local-date">Local ${escapeHtml(person.cityState || "Jaraguá do Sul/SC")}, ${escapeHtml(todayLongBr())}.</p>
        </section>
      </main>
    </section>
  `;
}

function buildFullHtml(people: ResumePerson[], forWord = false) {
  const pages = people.map((person) => buildResumeHtml(person)).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Banco de Currículos</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    body {
      margin: 0;
      background: ${forWord ? "#fff" : "#f3f4f6"};
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      line-height: 1.23;
    }

    .print-actions {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 20;
      display: ${forWord ? "none" : "flex"};
    }

    .print-actions button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      color: #fff;
      background: #111827;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(0,0,0,.18);
    }

    .resume-page {
      width: 210mm;
      min-height: 297mm;
      margin: ${forWord ? "0" : "18px auto"};
      background: #fff;
      padding: 20mm 16mm;
      ${forWord ? "" : "box-shadow: 0 20px 60px rgba(0,0,0,.14);"}
      page-break-after: always;
    }

    .resume-box {
      min-height: 245mm;
      border: 1.6pt solid #111827;
    }

    .identity {
      border-bottom: 1.6pt solid #111827;
      padding: 4mm 13mm;
      font-size: 11pt;
      font-weight: 700;
    }

    .identity p { margin: 0 0 1.3mm; }
    .content { padding: 5mm 13mm; }

    h2 {
      margin: 2mm 0 .8mm;
      font-size: 10.8pt;
      line-height: 1.1;
      font-weight: 900;
    }

    p { margin: 0 0 1.15mm; }
    .local-date { margin-top: 2.8mm; }

    @media print {
      body { background: #fff; }
      .print-actions { display: none; }
      .resume-page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button onclick="window.print()">Salvar como PDF</button>
  </div>
  ${pages}
</body>
</html>`;
}

function printHtmlWithoutPopup(html: string) {
  const frameId = "viva-resume-print-frame";
  const oldFrame = window.document.getElementById(frameId);
  oldFrame?.remove();

  const iframe = window.document.createElement("iframe");
  iframe.id = frameId;
  iframe.title = "Banco de Currículos";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  window.document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    window.alert("Não foi possível preparar o PDF.");
    iframe.remove();
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => iframe.remove(), 1500);
  }, 450);
}

export function ResumeBankWorkspace({
  project,
  initialTeamMembers,
}: {
  project: { id: string; name: string };
  initialTeamMembers: TeamMember[];
}) {
  const [manualPeople, setManualPeople] = useState<ResumePerson[]>([]);
  const [template, setTemplate] = useState<ResumeTemplate>(defaultTemplate);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Banco de Currículos carregado.");

  useEffect(() => {
    const savedPeople = readStorage<ResumePerson[]>(peopleStorageKey, []);
    const savedTemplate = readStorage<ResumeTemplate>(templateStorageKey, defaultTemplate);

    setManualPeople(savedPeople);
    setTemplate(savedTemplate);
  }, []);

  const projectPeople = useMemo(
    () => initialTeamMembers.map((member) => teamToResumePerson(member)),
    [initialTeamMembers],
  );

  const allPeople = useMemo(() => {
    const map = new Map<string, ResumePerson>();

    for (const person of [...projectPeople, ...manualPeople]) {
      const key = `${person.name.toLowerCase()}|${person.area.toLowerCase()}`;
      map.set(key, {
        ...map.get(key),
        ...person,
      });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [projectPeople, manualPeople]);

  const filteredPeople = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return allPeople;

    return allPeople.filter((person) =>
      [person.name, person.area, person.cityState].join(" ").toLowerCase().includes(value),
    );
  }, [allPeople, search]);

  const selectedPerson = allPeople.find((person) => person.id === selectedPersonId) ?? filteredPeople[0] ?? null;

  useEffect(() => {
    if (!selectedPersonId && filteredPeople[0]) {
      setSelectedPersonId(filteredPeople[0].id);
    }
  }, [filteredPeople, selectedPersonId]);

  function saveManualPeople(nextPeople: ResumePerson[], nextMessage = "Currículo salvo.") {
    setManualPeople(nextPeople);
    writeStorage(peopleStorageKey, nextPeople);
    setMessage(nextMessage);
  }

  function saveTemplate(nextTemplate: ResumeTemplate, nextMessage = "Modelo do edital salvo.") {
    setTemplate(nextTemplate);
    writeStorage(templateStorageKey, nextTemplate);
    setMessage(nextMessage);
  }

  function addPerson() {
    const newPerson = emptyPerson();

    saveManualPeople([newPerson, ...manualPeople], "Nova pessoa criada.");
    setSelectedPersonId(newPerson.id);
  }

  function updatePerson(patch: Partial<ResumePerson>) {
    if (!selectedPerson) return;

    const existingManual = manualPeople.find((person) => person.id === selectedPerson.id);
    const updatedPerson: ResumePerson = {
      ...selectedPerson,
      ...patch,
      source: existingManual?.source ?? "manual",
      id: existingManual?.id ?? selectedPerson.id.replace(/^team-/, "manual-copy-"),
    };

    const nextPeople = existingManual
      ? manualPeople.map((person) =>
          person.id === existingManual.id ? updatedPerson : person,
        )
      : [updatedPerson, ...manualPeople];

    saveManualPeople(nextPeople);
    setSelectedPersonId(updatedPerson.id);
  }

  function removeManualPerson(personId: string) {
    if (!window.confirm("Excluir esta pessoa manual do Banco de Currículos?")) return;

    saveManualPeople(
      manualPeople.filter((person) => person.id !== personId),
      "Pessoa removida.",
    );
  }

  async function uploadPersonFile(file: File | null, category: string) {
    if (!file || !selectedPerson) return;

    const dataUrl = await fileToDataUrl(file);
    const nextFile: ResumeFile = {
      id: makeId("file"),
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
      category,
    };

    updatePerson({ files: [nextFile, ...selectedPerson.files] });
  }

  async function uploadTemplateReference(file: File | null) {
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);

    saveTemplate(
      {
        ...template,
        editalName: file.name.replace(/\.[^.]+$/, ""),
        referenceFile: {
          id: makeId("reference"),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          category: "Modelo do edital",
        },
      },
      "Modelo do edital anexado. O currículo será gerado uma pessoa por folha.",
    );
  }

  function toggleSelected(personId: string) {
    setSelectedIds((current) =>
      current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId],
    );
  }

  function selectAllFiltered() {
    setSelectedIds(filteredPeople.map((person) => person.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function peopleToGenerate() {
    const selected = allPeople.filter((person) => selectedIds.includes(person.id));

    if (selected.length > 0) return selected;
    if (selectedPerson) return [selectedPerson];

    return [];
  }

  function generatePdf() {
    const people = peopleToGenerate();

    if (people.length === 0) {
      setMessage("Selecione pelo menos uma pessoa.");
      return;
    }

    printHtmlWithoutPopup(buildFullHtml(people));
  }

  function generateWord() {
    const people = peopleToGenerate();

    if (people.length === 0) {
      setMessage("Selecione pelo menos uma pessoa.");
      return;
    }

    downloadBlob(
      buildFullHtml(people, true),
      `${sanitizeFileName(`curriculos-${project.name}`)}.doc`,
      "application/msword;charset=utf-8",
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Banco de Currículos
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Profissionais do projeto e geração por edital
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              Projeto ativo: <strong>{project.name}</strong>. Selecione os profissionais, suba o modelo do edital e gere currículos em PDF ou Word, uma pessoa por folha.
            </p>
          </div>

          <button type="button" className="btn-primary" onClick={addPerson}>
            <Plus className="size-4" />
            Nova pessoa manual
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <InfoCard title="Profissionais" value={String(allPeople.length)} helper="equipe + manuais" />
        <InfoCard title="Selecionados" value={String(selectedIds.length)} helper="para gerar lote" />
        <InfoCard title="Modelo" value={template.referenceFile ? "Anexado" : "Pendente"} helper="modelo do edital" />
        <InfoCard title="Saída" value="PDF / Word" helper="uma pessoa por folha" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Profissionais</h3>
              <p className="text-sm text-slate-500">Equipe cadastrada no projeto e pessoas manuais.</p>
            </div>
            <UsersRound className="size-5 text-primary" />
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Buscar
            </span>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="form-input pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome ou área..."
              />
            </div>
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={selectAllFiltered}>
              Selecionar todos
            </button>
            <button type="button" className="btn-secondary" onClick={clearSelection}>
              Limpar seleção
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {filteredPeople.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                Nenhum profissional encontrado neste projeto.
              </div>
            ) : null}

            {filteredPeople.map((person) => {
              const active = person.id === selectedPerson?.id;
              const selected = selectedIds.includes(person.id);

              return (
                <div
                  key={person.id}
                  className={
                    active
                      ? "rounded-2xl border border-primary bg-primary/10 p-4"
                      : "rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  }
                >
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelected(person.id)}
                      className="mt-1"
                    />

                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setSelectedPersonId(person.id)}
                    >
                      <p className="font-black text-slate-950">{person.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{person.area || "Área não informada"}</p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        {person.source === "project" ? "Projeto" : "Manual"}
                      </p>
                    </button>

                    {selected ? <CheckCircle2 className="size-5 text-emerald-500" /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Cadastro / complementação
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  {selectedPerson?.name || "Selecione uma pessoa"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Complete os dados que não vierem automaticamente da equipe.
                </p>
              </div>

              {selectedPerson?.source === "manual" ? (
                <button type="button" className="btn-danger" onClick={() => removeManualPerson(selectedPerson.id)}>
                  <Trash2 className="size-4" />
                  Excluir manual
                </button>
              ) : null}
            </div>

            {selectedPerson ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Nome completo">
                  <input className="form-input" value={selectedPerson.name} onChange={(event) => updatePerson({ name: event.target.value })} />
                </Field>

                <Field label="Área de atuação">
                  <input className="form-input" value={selectedPerson.area} onChange={(event) => updatePerson({ area: event.target.value })} />
                </Field>

                <Field label="Tempo de atuação">
                  <input className="form-input" value={selectedPerson.actingTime} onChange={(event) => updatePerson({ actingTime: event.target.value })} />
                </Field>

                <Field label="Cidade/Estado">
                  <input className="form-input" value={selectedPerson.cityState} onChange={(event) => updatePerson({ cityState: event.target.value })} />
                </Field>

                <Field label="Formação">
                  <textarea className="form-input min-h-28" value={selectedPerson.formation} onChange={(event) => updatePerson({ formation: event.target.value })} />
                </Field>

                <Field label="Cursos">
                  <textarea className="form-input min-h-28" value={selectedPerson.courses} onChange={(event) => updatePerson({ courses: event.target.value })} />
                </Field>

                <Field label="Experiência profissional">
                  <textarea className="form-input min-h-36" value={selectedPerson.experience} onChange={(event) => updatePerson({ experience: event.target.value })} />
                </Field>

                <Field label="Trabalhos">
                  <textarea className="form-input min-h-36" value={selectedPerson.works} onChange={(event) => updatePerson({ works: event.target.value })} />
                </Field>

                <Field label="Informações adicionais">
                  <textarea className="form-input min-h-28" value={selectedPerson.additionalInfo} onChange={(event) => updatePerson({ additionalInfo: event.target.value })} />
                </Field>
              </div>
            ) : null}
          </section>

          {selectedPerson ? (
            <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Arquivos do profissional</h3>
              <p className="mt-1 text-sm text-slate-500">
                Guarde currículo original, certificados, diplomas, portfólio e documentos.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Currículo PDF", "Currículo Word", "Certificado", "Diploma", "Portfólio", "Foto", "Documento"].map((category) => (
                  <label key={category} className="btn-secondary cursor-pointer">
                    <UploadCloud className="size-4" />
                    {category}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      onChange={(event) => {
                        void uploadPersonFile(event.target.files?.[0] ?? null, category);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                ))}
              </div>

              {selectedPerson.files.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {selectedPerson.files.map((file) => (
                    <div key={file.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-black text-slate-950">{file.category}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {file.name} • {fileSize(file.size)}
                      </p>
                      <a className="mt-3 inline-flex text-sm font-bold text-primary" href={file.dataUrl} download={file.name}>
                        Baixar
                      </a>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Modelos por edital
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  Subir anexo/modelo do edital
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Envie o modelo que o edital pede. O sistema gera os currículos usando o padrão base: nome, área de atuação, currículo completo e data atual, uma pessoa por folha.
                </p>
              </div>

              <label className="btn-primary cursor-pointer">
                <UploadCloud className="size-4" />
                Subir anexo
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    void uploadTemplateReference(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            {template.referenceFile ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-black text-emerald-800">Modelo anexado</p>
                <p className="mt-1 text-sm text-emerald-700">{template.referenceFile.name}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Nenhum modelo anexado ainda.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Gerar currículos
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  Currículos selecionados
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedIds.length > 0
                    ? `${selectedIds.length} pessoa(s) selecionada(s).`
                    : "Nenhuma seleção em lote. Será gerada a pessoa ativa."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={generatePdf}>
                  <FileText className="size-4" />
                  Gerar PDF
                </button>

                <button type="button" className="btn-primary" onClick={generateWord}>
                  <Download className="size-4" />
                  Gerar Word
                </button>
              </div>
            </div>
          </section>
        </section>
      </div>
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

function InfoCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
