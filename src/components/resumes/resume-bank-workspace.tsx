"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  FolderDown,
  Plus,
  Save,
  Search,
  Trash2,
  UploadCloud,
  UsersRound,
} from "lucide-react";

type ResumePerson = {
  id: string;
  name: string;
  area: string;
  photoDataUrl?: string;
  miniBio: string;
  academicFormation: string;
  courses: string;
  actingTime: string;
  professionalExperience: string;
  culturalProjectsExperience: string;
  works: string;
  functions: string;
  contact: string;
  cityState: string;
  document: string;
  notes: string;
  files: ResumeFile[];
};

type ResumeFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  category: string;
};

type ResumeTemplate = {
  id: string;
  name: string;
  description: string;
  title: string;
  headerText: string;
  showName: boolean;
  showArea: boolean;
  showFormation: boolean;
  showCourses: boolean;
  showActingTime: boolean;
  showProfessionalExperience: boolean;
  showCulturalProjectsExperience: boolean;
  showWorks: boolean;
  showAdditionalInfo: boolean;
  showLocalDate: boolean;
  onePersonPerPage: boolean;
  uploadedModelName?: string;
  uploadedModelDataUrl?: string;
};

const peopleStorageKey = "viva:banco-curriculos:pessoas:v1";
const templatesStorageKey = "viva:banco-curriculos:modelos:v1";

const defaultTemplate: ResumeTemplate = {
  id: "modelo-anexo-v-fcc",
  name: "Modelo FCC - Anexo V",
  description: "Modelo baseado no Anexo V de currículos da equipe.",
  title: "ANEXO V",
  headerText: "Fundação Catarinense de Cultura • Governo de Santa Catarina • Ministério da Cultura",
  showName: true,
  showArea: true,
  showFormation: true,
  showCourses: false,
  showActingTime: true,
  showProfessionalExperience: true,
  showCulturalProjectsExperience: false,
  showWorks: true,
  showAdditionalInfo: true,
  showLocalDate: true,
  onePersonPerPage: true,
};

const emptyPerson: ResumePerson = {
  id: "",
  name: "",
  area: "",
  miniBio: "",
  academicFormation: "",
  courses: "",
  actingTime: "",
  professionalExperience: "",
  culturalProjectsExperience: "",
  works: "",
  functions: "",
  contact: "",
  cityState: "Jaraguá do Sul/SC",
  document: "",
  notes: "",
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

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

function buildResumeHtml(person: ResumePerson, template: ResumeTemplate, forWord = false) {
  const location = person.cityState || "Jaraguá do Sul/SC";

  return `
    <section class="resume-page">
      <header class="resume-header">
        <div class="resume-header-text">${escapeHtml(template.headerText || "Banco de Currículos")}</div>
        <h1>${escapeHtml(template.title || "CURRÍCULO")}</h1>
      </header>

      <main class="resume-box">
        ${
          template.showName || template.showArea
            ? `<section class="identity">
                ${template.showName ? `<p><strong>Nome:</strong> ${escapeHtml(person.name || "Nome não informado")}</p>` : ""}
                ${template.showArea ? `<p><strong>Área de atuação:</strong> ${escapeHtml(person.area || "Não informado")}</p>` : ""}
              </section>`
            : ""
        }

        <section class="content">
          ${
            template.showFormation
              ? `<h2>Formação:</h2>${toParagraphs(person.academicFormation)}`
              : ""
          }

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

          ${
            template.showProfessionalExperience
              ? `<h2>Experiência profissional:</h2>${toParagraphs(person.professionalExperience || person.miniBio)}`
              : ""
          }

          ${
            template.showCulturalProjectsExperience
              ? `<h2>Experiência em projetos culturais:</h2>${toParagraphs(person.culturalProjectsExperience)}`
              : ""
          }

          ${
            template.showWorks
              ? `<h2>Trabalhos:</h2>${toParagraphs(person.works)}`
              : ""
          }

          ${
            template.showAdditionalInfo
              ? `<h2>Informações adicionais:</h2>${toParagraphs(person.notes || person.functions)}`
              : ""
          }

          ${
            template.showLocalDate
              ? `<p class="local-date">Local ${escapeHtml(location)}, ${escapeHtml(todayLongBr())}.</p>`
              : ""
          }
        </section>
      </main>
    </section>

    ${template.onePersonPerPage && !forWord ? '<div class="page-break"></div>' : ""}
  `;
}

function buildFullHtml(people: ResumePerson[], template: ResumeTemplate, forWord = false) {
  const pages = people.map((person) => buildResumeHtml(person, template, forWord)).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(template.name)}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      background: ${forWord ? "#ffffff" : "#f3f4f6"};
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      line-height: 1.24;
    }

    .print-actions {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 20;
      display: ${forWord ? "none" : "flex"};
      gap: 8px;
    }

    .print-actions button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      color: #fff;
      background: #111827;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(0, 0, 0, .18);
    }

    .resume-page {
      width: 210mm;
      min-height: 297mm;
      margin: ${forWord ? "0" : "18px auto"};
      background: #fff;
      padding: 12mm;
      ${forWord ? "" : "box-shadow: 0 20px 60px rgba(0,0,0,.14);"}
      page-break-after: always;
    }

    .resume-header {
      text-align: center;
      margin-bottom: 7mm;
    }

    .resume-header-text {
      min-height: 14mm;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #111827;
      font-size: 9pt;
      font-weight: 900;
      text-transform: uppercase;
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

    .identity p {
      margin: 0 0 1.5mm;
    }

    .content {
      padding: 5mm 13mm;
    }

    h2 {
      margin: 2mm 0 .8mm;
      font-size: 10.8pt;
      line-height: 1.1;
      font-weight: 900;
    }

    p {
      margin: 0 0 1.2mm;
    }

    .local-date {
      margin-top: 2.5mm;
    }

    .page-break {
      page-break-after: always;
    }

    @media print {
      body {
        background: #fff;
      }

      .print-actions {
        display: none;
      }

      .resume-page {
        margin: 0;
        box-shadow: none;
      }
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

function openPrintHtml(html: string) {
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
    window.setTimeout(() => iframe.remove(), 1600);
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

  const selectedPerson = people.find((person) => person.id === selectedPersonId) ?? null;
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? templates[0] ?? defaultTemplate;

  const filteredPeople = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return people;

    return people.filter((person) =>
      [person.name, person.area, person.functions, person.cityState]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [people, search]);

  function addPerson() {
    const newPerson: ResumePerson = {
      ...emptyPerson,
      id: makeId("person"),
      name: "Nova pessoa",
    };

    commitPeople([newPerson, ...people], "Nova pessoa criada no Banco de Currículos.");
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
    commitPeople(nextPeople, "Pessoa removida do Banco de Currículos.");
    setSelectedPersonId(nextPeople[0]?.id ?? "");
  }

  async function uploadPersonFile(file: File | null, category: string) {
    if (!file || !selectedPerson) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Arquivo muito grande. Use até 10 MB por arquivo nesta versão.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);

    const nextFile: ResumeFile = {
      id: makeId("file"),
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
      category,
    };

    updatePerson({
      files: [nextFile, ...selectedPerson.files],
    });

    setMessage("Arquivo anexado ao currículo.");
  }

  async function uploadTemplateModel(file: File | null) {
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);

    const nextTemplate: ResumeTemplate = {
      ...defaultTemplate,
      id: makeId("template"),
      name: `Modelo personalizado - ${file.name.replace(/\.[^.]+$/, "")}`,
      description: "Modelo criado a partir de anexo enviado pelo usuário. Ajuste os campos antes de gerar.",
      uploadedModelName: file.name,
      uploadedModelDataUrl: dataUrl,
    };

    commitTemplates([nextTemplate, ...templates], "Modelo personalizado criado a partir do anexo.");
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
      setMessage("Selecione pelo menos uma pessoa para gerar.");
      return;
    }

    openPrintHtml(buildFullHtml(peopleToGenerate, selectedTemplate));
  }

  function generateWord(selectedOnly = true) {
    const peopleToGenerate = selectedOnly
      ? selectedPerson
        ? [selectedPerson]
        : []
      : filteredPeople;

    if (peopleToGenerate.length === 0) {
      setMessage("Selecione pelo menos uma pessoa para gerar.");
      return;
    }

    const html = buildFullHtml(peopleToGenerate, selectedTemplate, true);
    const fileBase = selectedOnly && selectedPerson
      ? `${selectedPerson.name}-${selectedTemplate.name}`
      : `curriculos-${selectedTemplate.name}`;

    downloadBlob(
      html,
      `${sanitizeFileName(fileBase)}.doc`,
      "application/msword;charset=utf-8",
    );
  }

  function exportBackup() {
    downloadBlob(
      JSON.stringify({ people, templates }, null, 2),
      "banco-de-curriculos-backup.json",
      "application/json;charset=utf-8",
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
              Currículos, modelos de edital e geração em lote
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              Cadastre profissionais uma vez, salve modelos por edital e gere currículos em PDF ou Word conforme o anexo exigido.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={exportBackup}>
              <FolderDown className="size-4" />
              Backup
            </button>

            <button type="button" className="btn-primary" onClick={addPerson}>
              <Plus className="size-4" />
              Nova pessoa
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <InfoCard title="Pessoas" value={String(people.length)} helper="profissionais cadastrados" />
        <InfoCard title="Modelos" value={String(templates.length)} helper="formatos salvos" />
        <InfoCard title="Arquivos" value={String(people.reduce((total, person) => total + person.files.length, 0))} helper="anexos guardados" />
        <InfoCard title="Saídas" value="PDF / Word" helper="geração individual ou em lote" />
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
                placeholder="Nome, área, função..."
              />
            </div>
          </label>

          <div className="mt-4 space-y-2">
            {filteredPeople.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                Nenhuma pessoa cadastrada ainda.
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
                  <p className="mt-2 text-xs font-bold text-slate-400">
                    {person.files.length} arquivo(s)
                  </p>
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
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => removePerson(selectedPerson.id)}
                >
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

                <Field label="Funções que exerce">
                  <input className="form-input" value={selectedPerson.functions} onChange={(event) => updatePerson({ functions: event.target.value })} />
                </Field>

                <Field label="Contato">
                  <input className="form-input" value={selectedPerson.contact} onChange={(event) => updatePerson({ contact: event.target.value })} />
                </Field>

                <Field label="Cidade/Estado">
                  <input className="form-input" value={selectedPerson.cityState} onChange={(event) => updatePerson({ cityState: event.target.value })} />
                </Field>

                <Field label="CPF/CNPJ ou documento">
                  <input className="form-input" value={selectedPerson.document} onChange={(event) => updatePerson({ document: event.target.value })} />
                </Field>

                <Field label="Mini biografia">
                  <textarea className="form-input min-h-28" value={selectedPerson.miniBio} onChange={(event) => updatePerson({ miniBio: event.target.value })} />
                </Field>

                <Field label="Formação acadêmica">
                  <textarea className="form-input min-h-28" value={selectedPerson.academicFormation} onChange={(event) => updatePerson({ academicFormation: event.target.value })} />
                </Field>

                <Field label="Cursos">
                  <textarea className="form-input min-h-28" value={selectedPerson.courses} onChange={(event) => updatePerson({ courses: event.target.value })} />
                </Field>

                <Field label="Experiência profissional">
                  <textarea className="form-input min-h-28" value={selectedPerson.professionalExperience} onChange={(event) => updatePerson({ professionalExperience: event.target.value })} />
                </Field>

                <Field label="Experiência em projetos culturais">
                  <textarea className="form-input min-h-28" value={selectedPerson.culturalProjectsExperience} onChange={(event) => updatePerson({ culturalProjectsExperience: event.target.value })} />
                </Field>

                <Field label="Trabalhos realizados">
                  <textarea className="form-input min-h-28" value={selectedPerson.works} onChange={(event) => updatePerson({ works: event.target.value })} />
                </Field>

                <Field label="Informações adicionais">
                  <textarea className="form-input min-h-28" value={selectedPerson.notes} onChange={(event) => updatePerson({ notes: event.target.value })} />
                </Field>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Crie ou selecione uma pessoa para editar o currículo.
              </div>
            )}
          </div>

          {selectedPerson ? (
            <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Arquivos da pessoa</h3>
              <p className="mt-1 text-sm text-slate-500">
                Guarde currículo original, certificados, diplomas, portfólio, fotos e documentos.
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

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {selectedPerson.files.map((file) => (
                  <div key={file.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-black text-slate-950">{file.category}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">{file.name}</p>
                    <a
                      className="mt-3 inline-flex text-sm font-bold text-primary"
                      href={file.dataUrl}
                      download={file.name}
                    >
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
                  Modelos de currículo
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  Modelos por edital
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Suba um anexo de edital e salve como modelo reutilizável.
                </p>
              </div>

              <label className="btn-primary cursor-pointer">
                <UploadCloud className="size-4" />
                Subir modelo/anexo
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    void uploadTemplateModel(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Modelo ativo">
                <select
                  className="form-input"
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nome do modelo">
                <input className="form-input" value={selectedTemplate.name} onChange={(event) => updateTemplate({ name: event.target.value })} />
              </Field>

              <Field label="Título no documento">
                <input className="form-input" value={selectedTemplate.title} onChange={(event) => updateTemplate({ title: event.target.value })} />
              </Field>

              <Field label="Cabeçalho/logos em texto">
                <input className="form-input" value={selectedTemplate.headerText} onChange={(event) => updateTemplate({ headerText: event.target.value })} />
              </Field>

              <Field label="Descrição interna">
                <input className="form-input" value={selectedTemplate.description} onChange={(event) => updateTemplate({ description: event.target.value })} />
              </Field>
            </div>

            <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <Check label="Nome" checked={selectedTemplate.showName} onChange={(value) => updateTemplate({ showName: value })} />
              <Check label="Área de atuação" checked={selectedTemplate.showArea} onChange={(value) => updateTemplate({ showArea: value })} />
              <Check label="Formação" checked={selectedTemplate.showFormation} onChange={(value) => updateTemplate({ showFormation: value })} />
              <Check label="Cursos" checked={selectedTemplate.showCourses} onChange={(value) => updateTemplate({ showCourses: value })} />
              <Check label="Tempo de atuação" checked={selectedTemplate.showActingTime} onChange={(value) => updateTemplate({ showActingTime: value })} />
              <Check label="Experiência profissional" checked={selectedTemplate.showProfessionalExperience} onChange={(value) => updateTemplate({ showProfessionalExperience: value })} />
              <Check label="Projetos culturais" checked={selectedTemplate.showCulturalProjectsExperience} onChange={(value) => updateTemplate({ showCulturalProjectsExperience: value })} />
              <Check label="Trabalhos" checked={selectedTemplate.showWorks} onChange={(value) => updateTemplate({ showWorks: value })} />
              <Check label="Informações adicionais" checked={selectedTemplate.showAdditionalInfo} onChange={(value) => updateTemplate({ showAdditionalInfo: value })} />
              <Check label="Local e data" checked={selectedTemplate.showLocalDate} onChange={(value) => updateTemplate({ showLocalDate: value })} />
              <Check label="Uma pessoa por página" checked={selectedTemplate.onePersonPerPage} onChange={(value) => updateTemplate({ onePersonPerPage: value })} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Gerar currículo
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  PDF, Word ou lote
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Use o modelo ativo para gerar currículos individuais ou de toda a lista filtrada.
                </p>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function InfoCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
