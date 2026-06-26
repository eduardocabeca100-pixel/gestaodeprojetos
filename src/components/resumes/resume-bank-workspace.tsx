"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  UsersRound,
} from "lucide-react";

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
};

type ResumeTemplate = {
  id: string;
  name: string;
  editalName: string;
  title: string;
  headerMode: "text" | "images";
  headerText: string;
  headerImages: ResumeFile[];
  referenceFile?: ResumeFile;
  showCourses: boolean;
  showActingTime: boolean;
  showAdditionalInfo: boolean;
};

const peopleStorageKey = "viva:banco-curriculos:pessoas:final-v2";
const templatesStorageKey = "viva:banco-curriculos:modelos:final-v2";

const defaultTemplate: ResumeTemplate = {
  id: "fcc-anexo-v",
  name: "Modelo FCC - Anexo V",
  editalName: "Circuito Catarinense de Cultura PNAB SC 2026",
  title: "ANEXO V",
  headerMode: "text",
  headerText:
    "Fundação Catarinense de Cultura • Governo de Santa Catarina • Sistema Nacional de Cultura • Ministério da Cultura • Governo do Brasil",
  headerImages: [],
  showCourses: false,
  showActingTime: true,
  showAdditionalInfo: true,
};

const emptyPerson: ResumePerson = {
  id: "",
  name: "",
  area: "",
  formation: "",
  courses: "",
  actingTime: "",
  experience: "",
  works: "",
  additionalInfo: "",
  cityState: "Jaraguá do Sul/SC",
  files: [],
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

  if (lines.length === 0) return "<p>Não informado.</p>";

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

function buildHeader(template: ResumeTemplate) {
  if (template.headerMode === "images" && template.headerImages.length > 0) {
    return `
      <div class="logo-strip">
        ${template.headerImages
          .map((image) => `<img src="${image.dataUrl}" alt="${escapeHtml(image.name)}" />`)
          .join("")}
      </div>
    `;
  }

  return `<div class="header-text">${escapeHtml(template.headerText)}</div>`;
}

function buildResumeHtml(person: ResumePerson, template: ResumeTemplate) {
  return `
    <section class="resume-page">
      <header class="resume-header">
        ${buildHeader(template)}
        <h1>${escapeHtml(template.title || "CURRÍCULO")}</h1>
      </header>

      <main class="resume-box">
        <section class="identity">
          <p><strong>Nome:</strong> ${escapeHtml(person.name || "Nome não informado")}</p>
          <p><strong>Área de atuação:</strong> ${escapeHtml(person.area || "Não informado")}</p>
        </section>

        <section class="content">
          <h2>Formação:</h2>
          ${toParagraphs(person.formation)}

          ${
            template.showCourses
              ? `<h2>Cursos:</h2>${toParagraphs(person.courses)}`
              : ""
          }

          ${
            template.showActingTime
              ? `<p><strong>Tempo de atuação:</strong> ${escapeHtml(person.actingTime || "Não informado.")}</p>`
              : ""
          }

          <h2>Experiência profissional:</h2>
          ${toParagraphs(person.experience)}

          <h2>Trabalhos:</h2>
          ${toParagraphs(person.works)}

          ${
            template.showAdditionalInfo
              ? `<h2>Informações adicionais:</h2>${toParagraphs(person.additionalInfo)}`
              : ""
          }

          <p class="local-date">Local ${escapeHtml(person.cityState || "Jaraguá do Sul/SC")}, ${escapeHtml(todayLongBr())}.</p>
        </section>
      </main>
    </section>
  `;
}

function buildFullHtml(people: ResumePerson[], template: ResumeTemplate, forWord = false) {
  const pages = people.map((person) => buildResumeHtml(person, template)).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(template.name)}</title>
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
      padding: 10mm 12mm;
      ${forWord ? "" : "box-shadow: 0 20px 60px rgba(0,0,0,.14);"}
      page-break-after: always;
    }

    .resume-header {
      text-align: center;
      margin-bottom: 7mm;
    }

    .logo-strip {
      min-height: 18mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9mm;
      margin-bottom: 3mm;
    }

    .logo-strip img {
      max-height: 17mm;
      max-width: 38mm;
      object-fit: contain;
    }

    .header-text {
      min-height: 17mm;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #111827;
      font-size: 8.6pt;
      font-weight: 900;
      line-height: 1.3;
      text-transform: uppercase;
      text-align: center;
    }

    .resume-header h1 {
      margin: 2mm 0 0;
      font-size: 13pt;
      font-weight: 900;
      text-align: center;
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

export function ResumeBankWorkspace() {
  const [people, setPeople] = useState<ResumePerson[]>([]);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([defaultTemplate]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplate.id);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Banco de Currículos carregado.");

  useEffect(() => {
    const savedPeople = readStorage<ResumePerson[]>(peopleStorageKey, []);
    const savedTemplates = readStorage<ResumeTemplate[]>(templatesStorageKey, [defaultTemplate]);

    setPeople(savedPeople);
    setTemplates(savedTemplates.length ? savedTemplates : [defaultTemplate]);
    setSelectedPersonId(savedPeople[0]?.id ?? "");
  }, []);

  const selectedPerson = people.find((person) => person.id === selectedPersonId) ?? null;
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? templates[0] ?? defaultTemplate;

  const filteredPeople = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return people;
    return people.filter((person) =>
      [person.name, person.area, person.cityState].join(" ").toLowerCase().includes(value),
    );
  }, [people, search]);

  function commitPeople(nextPeople: ResumePerson[], nextMessage = "Currículo salvo.") {
    setPeople(nextPeople);
    writeStorage(peopleStorageKey, nextPeople);
    setMessage(nextMessage);
  }

  function commitTemplates(nextTemplates: ResumeTemplate[], nextMessage = "Modelo salvo.") {
    setTemplates(nextTemplates);
    writeStorage(templatesStorageKey, nextTemplates);
    setMessage(nextMessage);
  }

  function addPerson() {
    const newPerson: ResumePerson = {
      ...emptyPerson,
      id: makeId("person"),
      name: "Nova pessoa",
    };

    commitPeople([newPerson, ...people], "Nova pessoa criada.");
    setSelectedPersonId(newPerson.id);
  }

  function updatePerson(patch: Partial<ResumePerson>) {
    if (!selectedPerson) return;

    commitPeople(
      people.map((person) =>
        person.id === selectedPerson.id ? { ...person, ...patch } : person,
      ),
    );
  }

  function removePerson(personId: string) {
    if (!window.confirm("Excluir esta pessoa do Banco de Currículos?")) return;

    const nextPeople = people.filter((person) => person.id !== personId);
    commitPeople(nextPeople, "Pessoa removida.");
    setSelectedPersonId(nextPeople[0]?.id ?? "");
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

  async function addHeaderImage(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Use PNG, JPG ou WEBP para o cabeçalho.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    const nextImage: ResumeFile = {
      id: makeId("logo"),
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
      category: "Logo/cabeçalho",
    };

    updateTemplate({
      headerMode: "images",
      headerImages: [...selectedTemplate.headerImages, nextImage],
    });
  }

  async function uploadTemplateReference(file: File | null) {
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    const referenceFile: ResumeFile = {
      id: makeId("reference"),
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
      category: "Modelo de referência do edital",
    };

    const nextTemplate: ResumeTemplate = {
      ...defaultTemplate,
      id: makeId("template"),
      name: `Modelo do edital - ${file.name.replace(/\.[^.]+$/, "")}`,
      editalName: file.name.replace(/\.[^.]+$/, ""),
      referenceFile,
    };

    commitTemplates([nextTemplate, ...templates], "Modelo criado a partir do anexo.");
    setSelectedTemplateId(nextTemplate.id);
  }

  function updateTemplate(patch: Partial<ResumeTemplate>) {
    commitTemplates(
      templates.map((template) =>
        template.id === selectedTemplate.id ? { ...template, ...patch } : template,
      ),
    );
  }

  function generatePdf(selectedOnly = true) {
    const peopleToGenerate = selectedOnly
      ? selectedPerson
        ? [selectedPerson]
        : []
      : filteredPeople;

    if (peopleToGenerate.length === 0) {
      setMessage("Selecione pelo menos uma pessoa.");
      return;
    }

    printHtmlWithoutPopup(buildFullHtml(peopleToGenerate, selectedTemplate));
  }

  function generateWord(selectedOnly = true) {
    const peopleToGenerate = selectedOnly
      ? selectedPerson
        ? [selectedPerson]
        : []
      : filteredPeople;

    if (peopleToGenerate.length === 0) {
      setMessage("Selecione pelo menos uma pessoa.");
      return;
    }

    const html = buildFullHtml(peopleToGenerate, selectedTemplate, true);
    const fileBase =
      selectedOnly && selectedPerson
        ? `${selectedPerson.name}-${selectedTemplate.name}`
        : `curriculos-${selectedTemplate.name}`;

    downloadBlob(
      html,
      `${sanitizeFileName(fileBase)}.doc`,
      "application/msword;charset=utf-8",
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Banco de Currículos
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Pessoas, modelos por edital e geração em PDF/Word
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              Cadastre a pessoa uma vez. Para cada edital, suba o modelo de referência, ajuste o cabeçalho/logos e gere os currículos.
            </p>
          </div>

          <button type="button" className="btn-primary" onClick={addPerson}>
            <Plus className="size-4" />
            Nova pessoa
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Profissionais</h3>
              <p className="text-sm text-slate-500">Banco permanente da equipe.</p>
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

          <div className="mt-4 space-y-2">
            {filteredPeople.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                Nenhuma pessoa cadastrada.
              </div>
            ) : null}

            {filteredPeople.map((person) => {
              const selected = person.id === selectedPersonId;

              return (
                <button
                  key={person.id}
                  type="button"
                  className={
                    selected
                      ? "w-full rounded-2xl border border-primary bg-primary/10 p-4 text-left"
                      : "w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-primary/40"
                  }
                  onClick={() => setSelectedPersonId(person.id)}
                >
                  <p className="font-black text-slate-950">{person.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{person.area || "Área não informada"}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Cadastro da pessoa
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  {selectedPerson?.name || "Selecione uma pessoa"}
                </h3>
              </div>

              {selectedPerson ? (
                <button type="button" className="btn-danger" onClick={() => removePerson(selectedPerson.id)}>
                  <Trash2 className="size-4" />
                  Excluir
                </button>
              ) : null}
            </div>

            {selectedPerson ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                  <textarea className="form-input min-h-28" value={selectedPerson.experience} onChange={(event) => updatePerson({ experience: event.target.value })} />
                </Field>

                <Field label="Trabalhos">
                  <textarea className="form-input min-h-28" value={selectedPerson.works} onChange={(event) => updatePerson({ works: event.target.value })} />
                </Field>

                <Field label="Informações adicionais">
                  <textarea className="form-input min-h-28" value={selectedPerson.additionalInfo} onChange={(event) => updatePerson({ additionalInfo: event.target.value })} />
                </Field>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Crie ou selecione uma pessoa.
              </div>
            )}
          </div>

          {selectedPerson ? (
            <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Arquivos da pessoa</h3>
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
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Modelos por edital
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  {selectedTemplate.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Cada edital pode ter suas logos e seu próprio anexo.
                </p>
              </div>

              <label className="btn-primary cursor-pointer">
                <UploadCloud className="size-4" />
                Subir anexo/modelo
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

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Selecionar modelo">
                <select className="form-input" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Nome do modelo">
                <input className="form-input" value={selectedTemplate.name} onChange={(event) => updateTemplate({ name: event.target.value })} />
              </Field>

              <Field label="Nome do edital">
                <input className="form-input" value={selectedTemplate.editalName} onChange={(event) => updateTemplate({ editalName: event.target.value })} />
              </Field>

              <Field label="Título do anexo">
                <input className="form-input" value={selectedTemplate.title} onChange={(event) => updateTemplate({ title: event.target.value })} />
              </Field>

              <Field label="Cabeçalho em texto">
                <input className="form-input" value={selectedTemplate.headerText} onChange={(event) => updateTemplate({ headerText: event.target.value })} />
              </Field>

              <Field label="Tipo de cabeçalho">
                <select className="form-input" value={selectedTemplate.headerMode} onChange={(event) => updateTemplate({ headerMode: event.target.value as ResumeTemplate["headerMode"] })}>
                  <option value="text">Texto</option>
                  <option value="images">Logos/imagens</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <label className="btn-secondary cursor-pointer">
                <ImagePlus className="size-4" />
                Adicionar logo
                <input
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(event) => {
                    void addHeaderImage(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
              </label>

              <Check label="Cursos" checked={selectedTemplate.showCourses} onChange={(value) => updateTemplate({ showCourses: value })} />
              <Check label="Tempo de atuação" checked={selectedTemplate.showActingTime} onChange={(value) => updateTemplate({ showActingTime: value })} />
              <Check label="Informações adicionais" checked={selectedTemplate.showAdditionalInfo} onChange={(value) => updateTemplate({ showAdditionalInfo: value })} />
            </div>

            {selectedTemplate.headerImages.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {selectedTemplate.headerImages.map((image) => (
                  <div key={image.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <img src={image.dataUrl} alt={image.name} className="h-16 w-full object-contain" />
                    <p className="mt-2 truncate text-xs font-bold text-slate-600">{image.name}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Gerar currículos
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  PDF, Word, individual ou lote
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={() => generatePdf(true)}>
                  <FileText className="size-4" />
                  PDF pessoa
                </button>

                <button type="button" className="btn-secondary" onClick={() => generateWord(true)}>
                  <Download className="size-4" />
                  Word pessoa
                </button>

                <button type="button" className="btn-primary" onClick={() => generatePdf(false)}>
                  <FileText className="size-4" />
                  PDF lote
                </button>

                <button type="button" className="btn-primary" onClick={() => generateWord(false)}>
                  <Download className="size-4" />
                  Word lote
                </button>
              </div>
            </div>
          </div>
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

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
