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
  UserRound,
  UsersRound,
} from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { useClientReady } from "@/lib/use-client-ready";
import { cn } from "@/lib/utils";
import { getLocalCurriculumProfile } from "@/modules/team/local-curriculum-profiles";
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

type ApiTeamRow = Record<string, unknown>;

const peopleStorageKey = "viva:banco-curriculos:pessoas:layout-final-v1";
const templateStorageKey = "viva:banco-curriculos:modelo:layout-final-v1";

const defaultTemplate: ResumeTemplate = {
  id: "modelo-atual",
  editalName: "Modelo por edital",
};

const refensFallbackPeople: ResumePerson[] = [
  ["Marcel Eduardo Cabeça Domingues", "Formador, diretor, ator e produtor"],
  ["Kaique Varela Zalusk", "Produção executiva"],
  ["Suzi Daiane", "Professora de inclusão, LIBRAS e acessibilidade"],
  ["Jones André", "Técnico de som"],
  ["Cassius Venera", "Técnico de iluminação"],
  ["André Brito", "Registro audiovisual / fotográfico"],
  ["Renaldo Boddemberg", "Ator experiente"],
  ["Bruna Lazzarotto", "Atriz experiente"],
  ["Wemerson Gonçalves", "Ator experiente"],
  ["Julia Titz", "Atriz experiente"],
  ["Karim Kamada", "Artista / Atriz experiente"],
  ["Katiana de Souza Coelho", "Professora de técnica vocal / Tecladista / Música"],
  ["Mariane Santos de Lima", "Produtora cultural"],
  ["Bruno", "Equipe artística"],
  ["Equipe técnica", "Apoio técnico"],
].map(([name, area]) => ({
  id: `fallback-${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}`,
  name,
  area,
  formation: "",
  courses: "",
  actingTime: "",
  experience: "",
  works: "",
  additionalInfo: "",
  cityState: "Jaraguá do Sul/SC",
  files: [],
  source: "project",
}));

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeText(value: unknown) {
  return String(value ?? "").trim();
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

function getNestedObjects(row: ApiTeamRow) {
  const objects: ApiTeamRow[] = [row];

  for (const value of Object.values(row)) {
    if (value && !Array.isArray(value) && typeof value === "object") {
      const nested = value as ApiTeamRow;
      objects.push(nested);

      for (const second of Object.values(nested)) {
        if (second && !Array.isArray(second) && typeof second === "object") {
          objects.push(second as ApiTeamRow);
        }
      }
    }
  }

  return objects;
}

function pickApiValue(row: ApiTeamRow, keys: string[]) {
  for (const objectValue of getNestedObjects(row)) {
    for (const key of keys) {
      const value = objectValue[key];

      if (value !== null && value !== undefined && String(value).trim()) {
        return value;
      }
    }
  }

  return "";
}

function flattenApiRows(payload: unknown): ApiTeamRow[] {
  const rows: ApiTeamRow[] = [];

  function walk(value: unknown) {
    if (!value) return;

    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }

    if (typeof value === "object") {
      const objectValue = value as ApiTeamRow;
      const name = pickApiValue(objectValue, [
        "name",
        "full_name",
        "fullName",
        "member_name",
        "person_name",
        "display_name",
        "nome",
      ]);

      if (name) rows.push(objectValue);

      for (const nested of Object.values(objectValue)) {
        if (nested && typeof nested === "object") walk(nested);
      }
    }
  }

  walk(payload);

  const map = new Map<string, ApiTeamRow>();

  for (const row of rows) {
    const name = safeText(
      pickApiValue(row, [
        "name",
        "full_name",
        "fullName",
        "member_name",
        "person_name",
        "display_name",
        "nome",
      ]),
    );

    if (!name) continue;

    const role = safeText(
      pickApiValue(row, [
        "role",
        "function",
        "position",
        "funcao",
        "area",
        "area_atuacao",
        "rubric",
        "category",
        "description",
      ]),
    );

    const key = `${name.toLowerCase()}|${role.toLowerCase()}`;
    map.set(key, row);
  }

  return Array.from(map.values());
}

function apiRowToResumePerson(row: ApiTeamRow): ResumePerson {
  const name = safeText(
    pickApiValue(row, [
      "name",
      "full_name",
      "fullName",
      "member_name",
      "person_name",
      "display_name",
      "nome",
    ]),
  );
  const profile = getLocalCurriculumProfile(name);

  const area = safeText(
    pickApiValue(row, [
      "role",
      "function",
      "position",
      "funcao",
      "area",
      "area_atuacao",
      "rubric",
      "category",
      "description",
    ]),
  );

  return {
    id: `api-${sanitizeFileName(
      safeText(pickApiValue(row, ["id", "member_id", "person_id", "team_roster_id"])) || name,
    )}`,
    name: profile?.name || name || "Pessoa sem nome",
    area: profile?.area || area || "Equipe",
    formation:
      profile?.formation || safeText(pickApiValue(row, ["formation", "formacao"])),
    courses: profile?.courses || safeText(pickApiValue(row, ["courses", "cursos"])),
    actingTime:
      profile?.actingTime || safeText(pickApiValue(row, ["actingTime", "acting_time", "tempo_atuacao"])),
    experience:
      profile?.experience ||
      safeText(
        pickApiValue(row, ["experience", "experiencia", "notes", "description", "observations"]),
      ),
    works: profile?.works || safeText(pickApiValue(row, ["works", "trabalhos", "projects", "projetos"])),
    additionalInfo:
      profile?.additionalInfo ||
      safeText(
        pickApiValue(row, ["additionalInfo", "additional_info", "observations", "notes"]),
      ),
    cityState:
      profile?.cityState ||
      safeText(pickApiValue(row, ["cityState", "city_state", "city", "cidade", "location"])) ||
      "Jaraguá do Sul/SC",
    files: [],
    source: "project",
  };
}

function teamToResumePerson(member: TeamMember): ResumePerson {
  const profile = getLocalCurriculumProfile(member.name);

  return {
    id: `team-${member.id}`,
    name: profile?.name || safeText(member.name) || "Pessoa sem nome",
    area: profile?.area || safeText(member.role) || "Equipe",
    formation: profile?.formation || "",
    courses: profile?.courses || "",
    actingTime: profile?.actingTime || "",
    experience: profile?.experience || safeText(member.notes),
    works: profile?.works || "",
    additionalInfo: profile?.additionalInfo || "",
    cityState: profile?.cityState || "Jaraguá do Sul/SC",
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

          ${person.courses.trim() ? `<h2>Cursos:</h2>${toParagraphs(person.courses)}` : ""}

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
      .resume-page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>${pages}</body>
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
  }, 350);
}

export function ResumeBankWorkspace({
  project,
  initialTeamMembers,
}: {
  project: { id: string; name: string };
  initialTeamMembers: TeamMember[];
}) {
  const isClient = useClientReady();

  if (!isClient) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando banco de currículos...
      </div>
    );
  }

  return (
    <ResumeBankWorkspaceContent
      key={project.id}
      project={project}
      initialTeamMembers={initialTeamMembers}
    />
  );
}

function ResumeBankWorkspaceContent({
  project,
  initialTeamMembers,
}: {
  project: { id: string; name: string };
  initialTeamMembers: TeamMember[];
}) {
  const [manualPeople, setManualPeople] = useState<ResumePerson[]>(() =>
    readStorage<ResumePerson[]>(peopleStorageKey, []),
  );
  const [apiTeamPeople, setApiTeamPeople] = useState<ResumePerson[]>([]);
  const [template, setTemplate] = useState<ResumeTemplate>(() =>
    readStorage<ResumeTemplate>(templateStorageKey, defaultTemplate),
  );
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Banco de Currículos carregado.");

  useEffect(() => {
    let cancelled = false;

    async function loadTeamFromApi() {
      const params = new URLSearchParams({
        project: project.id,
        projectId: project.id,
      });

      const urls = [
        `/api/team-roster?${params.toString()}`,
        `/api/team-roster/assignments?${params.toString()}`,
      ];

      const collected: ResumePerson[] = [];

      for (const url of urls) {
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) continue;

          const payload = await response.json();
          collected.push(...flattenApiRows(payload).map((row) => apiRowToResumePerson(row)));
        } catch {
          // mantém a tela funcionando
        }
      }

      const deduped = new Map<string, ResumePerson>();

      for (const person of collected) {
        const key = `${person.name.toLowerCase()}|${person.area.toLowerCase()}`;
        deduped.set(key, person);
      }

      if (!cancelled) {
        setApiTeamPeople(Array.from(deduped.values()));
      }
    }

    void loadTeamFromApi();

    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const projectPeople = useMemo(() => {
    const initialPeople = initialTeamMembers.map((member) => teamToResumePerson(member));
    return [...initialPeople, ...apiTeamPeople];
  }, [initialTeamMembers, apiTeamPeople]);

  const allPeople = useMemo(() => {
    const projectName = project.name.toLowerCase();
    const shouldUseFallback =
      projectName.includes("reféns") || projectName.includes("refens");

    const sourcePeople =
      shouldUseFallback && projectPeople.length < refensFallbackPeople.length
        ? [...projectPeople, ...refensFallbackPeople]
        : projectPeople;

    const map = new Map<string, ResumePerson>();

    for (const person of [...sourcePeople, ...manualPeople]) {
      const key = `${person.name.toLowerCase()}|${person.area.toLowerCase()}`;
      map.set(key, {
        ...map.get(key),
        ...person,
      });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [project.name, projectPeople, manualPeople]);

  const filteredPeople = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return allPeople;

    return allPeople.filter((person) =>
      [person.name, person.area, person.cityState].join(" ").toLowerCase().includes(value),
    );
  }, [allPeople, search]);

  const activePersonId =
    filteredPeople.find((person) => person.id === selectedPersonId)?.id ??
    allPeople.find((person) => person.id === selectedPersonId)?.id ??
    filteredPeople[0]?.id ??
    "";

  const selectedPerson =
    allPeople.find((person) => person.id === activePersonId) ??
    filteredPeople[0] ??
    null;

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
      id: existingManual?.id ?? selectedPerson.id.replace(/^team-|^api-|^fallback-/, "manual-copy-"),
    };

    const nextPeople = existingManual
      ? manualPeople.map((person) => (person.id === existingManual.id ? updatedPerson : person))
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
      "Modelo do edital anexado.",
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

  const filledProfilesCount = useMemo(
    () =>
      allPeople.filter(
        (person) => getFilledResumeSections(person) > 0 || person.files.length > 0,
      ).length,
    [allPeople],
  );

  const totalFiles = useMemo(
    () => allPeople.reduce((sum, person) => sum + person.files.length, 0),
    [allPeople],
  );

  const selectedBatchPeople = useMemo(
    () => allPeople.filter((person) => selectedIds.includes(person.id)),
    [allPeople, selectedIds],
  );

  return (
    <div className="w-full max-w-none space-y-6 pb-10">
      <SectionCard
        title="Profissionais do projeto e geração por edital"
        description={`Projeto ativo: ${project.name}. Organize o banco em cards, complemente os dados e gere currículos em PDF ou Word com um layout mais limpo.`}
        actions={
          <Button type="button" className="rounded-2xl" onClick={addPerson}>
            <Plus className="size-4" />
            Nova pessoa manual
          </Button>
        }
      >
        <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          title="Profissionais"
          value={String(allPeople.length)}
          helper={`${projectPeople.length} da equipe e ${manualPeople.length} manuais`}
          icon={<UsersRound className="size-4" />}
          tone="bg-[linear-gradient(135deg,rgba(59,130,246,0.14),rgba(99,102,241,0.18))] text-primary"
        />
        <InfoCard
          title="Selecionados"
          value={String(selectedIds.length)}
          helper="prontos para geração em lote"
          icon={<CheckCircle2 className="size-4" />}
          tone="bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(52,211,153,0.18))] text-emerald-700"
        />
        <InfoCard
          title="Complementados"
          value={String(filledProfilesCount)}
          helper={`${totalFiles} arquivo(s) anexado(s) no banco`}
          icon={<UserRound className="size-4" />}
          tone="bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(34,197,94,0.14))] text-sky-700"
        />
        <InfoCard
          title="Modelo"
          value={template.referenceFile ? "Anexado" : "Pendente"}
          helper={template.referenceFile?.name ?? "suba o modelo do edital"}
          icon={<FileText className="size-4" />}
          tone="bg-[linear-gradient(135deg,rgba(250,204,21,0.15),rgba(251,146,60,0.18))] text-amber-700"
        />
      </div>

      <SectionCard
        title="Profissionais em Cards"
        description="Clique em um card para abrir a pessoa ativa. Use o botão de seleção para montar o lote que será gerado."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={selectAllFiltered}
              disabled={filteredPeople.length === 0}
            >
              Selecionar filtrados
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={clearSelection}
              disabled={selectedIds.length === 0}
            >
              Limpar seleção
            </Button>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Buscar profissional
            </span>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="form-input pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, função, cidade ou área..."
              />
            </div>
          </label>

          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Visão atual
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {search.trim()
                ? `${filteredPeople.length} pessoa(s) encontradas para "${search.trim()}".`
                : `${allPeople.length} pessoa(s) disponíveis no banco deste projeto.`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              O card ativo abre a área de edição logo abaixo.
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {filteredPeople.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/85 p-8 text-center text-sm text-slate-500 md:col-span-2 2xl:col-span-3">
            Nenhum profissional encontrado com esse filtro. Tente outro termo ou crie uma pessoa manual.
          </div>
        ) : null}

        {filteredPeople.map((person) => {
          const active = person.id === selectedPerson?.id;
          const selected = selectedIds.includes(person.id);
          const filledSections = getFilledResumeSections(person);

          return (
            <article
              key={person.id}
              className={cn(
                "rounded-[1.75rem] border p-4 shadow-sm transition-all duration-200",
                active
                  ? "border-primary/35 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(255,255,255,0.98))] shadow-[0_24px_50px_-36px_rgba(37,99,235,0.45)] md:col-span-2 2xl:col-span-2"
                  : selected
                    ? "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.9),rgba(255,255,255,0.98))] hover:border-emerald-300"
                    : "border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,249,255,0.95))] hover:-translate-y-0.5 hover:border-primary/20",
              )}
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    onClick={() => setSelectedPersonId(person.id)}
                  >
                    <div className="grid size-12 shrink-0 place-items-center rounded-[1.1rem] bg-primary/10 text-base font-black text-primary">
                      {person.name.slice(0, 1).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-black text-slate-950">{person.name}</p>
                        {active ? (
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                            Em edição
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {person.area || "Área não informada"}
                      </p>
                    </div>
                  </button>

                  <Button
                    type="button"
                    size="sm"
                    className="rounded-2xl"
                    variant={selected ? "default" : "outline"}
                    onClick={() => toggleSelected(person.id)}
                  >
                    {selected ? <CheckCircle2 className="size-4" /> : null}
                    {selected ? "No lote" : "Selecionar"}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                      person.source === "project"
                        ? "bg-slate-900/6 text-slate-600"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {person.source === "project" ? "Equipe do projeto" : "Cadastro manual"}
                  </span>
                  <span className="rounded-full bg-slate-900/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                    {filledSections}/6 seções preenchidas
                  </span>
                  <span className="rounded-full bg-slate-900/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                    {person.files.length} arquivo(s)
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <MicroStat label="Cidade" value={person.cityState || "Não informada"} />
                  <MicroStat label="Formação" value={person.formation ? "Preenchida" : "Pendente"} />
                  <MicroStat label="Experiência" value={person.experience ? "Preenchida" : "Pendente"} />
                </div>

                {active ? (
                  <div className="grid gap-3 rounded-[1.35rem] border border-white/80 bg-white/80 p-3 md:grid-cols-3">
                    <SummaryCard
                      title="Formação e cursos"
                      value={summarizeField(
                        [person.formation, person.courses].filter(Boolean).join(" "),
                        "Ainda sem formação ou cursos preenchidos.",
                      )}
                    />
                    <SummaryCard
                      title="Experiência"
                      value={summarizeField(
                        person.experience,
                        "Use a área de edição abaixo para registrar a trajetória profissional.",
                      )}
                    />
                    <SummaryCard
                      title="Arquivos"
                      value={
                        person.files.length > 0
                          ? `${person.files.length} arquivo(s): ${person.files
                              .slice(0, 2)
                              .map((file) => file.category)
                              .join(", ")}${person.files.length > 2 ? "..." : ""}`
                          : "Nenhum arquivo anexado ainda."
                      }
                    />
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <SectionCard
          title={selectedPerson?.name || "Selecione um card"}
          description={
            selectedPerson
              ? "Ao editar pessoas da equipe, os complementos ficam salvos neste banco sem afetar a listagem original do projeto."
              : "Escolha um profissional acima para abrir os campos de complementação."
          }
          actions={
            selectedPerson?.source === "manual" ? (
              <Button
                type="button"
                variant="destructive"
                className="rounded-2xl"
                onClick={() => removeManualPerson(selectedPerson.id)}
              >
                <Trash2 className="size-4" />
                Excluir manual
              </Button>
            ) : null
          }
        >
          {selectedPerson ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Nome completo">
                <input
                  className="form-input"
                  value={selectedPerson.name}
                  onChange={(event) => updatePerson({ name: event.target.value })}
                />
              </Field>

              <Field label="Área de atuação">
                <input
                  className="form-input"
                  value={selectedPerson.area}
                  onChange={(event) => updatePerson({ area: event.target.value })}
                />
              </Field>

              <Field label="Tempo de atuação">
                <input
                  className="form-input"
                  value={selectedPerson.actingTime}
                  onChange={(event) => updatePerson({ actingTime: event.target.value })}
                />
              </Field>

              <Field label="Cidade/Estado">
                <input
                  className="form-input"
                  value={selectedPerson.cityState}
                  onChange={(event) => updatePerson({ cityState: event.target.value })}
                />
              </Field>

              <Field label="Formação">
                <textarea
                  className="form-input min-h-28"
                  value={selectedPerson.formation}
                  onChange={(event) => updatePerson({ formation: event.target.value })}
                />
              </Field>

              <Field label="Cursos">
                <textarea
                  className="form-input min-h-28"
                  value={selectedPerson.courses}
                  onChange={(event) => updatePerson({ courses: event.target.value })}
                />
              </Field>

              <Field label="Experiência profissional">
                <textarea
                  className="form-input min-h-36"
                  value={selectedPerson.experience}
                  onChange={(event) => updatePerson({ experience: event.target.value })}
                />
              </Field>

              <Field label="Trabalhos">
                <textarea
                  className="form-input min-h-36"
                  value={selectedPerson.works}
                  onChange={(event) => updatePerson({ works: event.target.value })}
                />
              </Field>

              <div className="lg:col-span-2">
                <Field label="Informações adicionais">
                  <textarea
                    className="form-input min-h-28"
                    value={selectedPerson.additionalInfo}
                    onChange={(event) => updatePerson({ additionalInfo: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm text-slate-500">
              Nenhuma pessoa ativa agora. Clique em um card para começar a editar.
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Arquivos do profissional"
            description="Currículo original, certificados, diplomas, portfólio e documentos de apoio."
          >
            <div className="flex flex-wrap gap-2">
              {[
                "Currículo PDF",
                "Currículo Word",
                "Certificado",
                "Diploma",
                "Portfólio",
                "Foto",
                "Documento",
              ].map((category) => (
                <label
                  key={category}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
                    !selectedPerson && "pointer-events-none opacity-50",
                  )}
                >
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

            {selectedPerson && selectedPerson.files.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {selectedPerson.files.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <p className="font-black text-slate-950">{file.category}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {file.name} • {fileSize(file.size)}
                    </p>
                    <Button asChild type="button" size="sm" variant="outline" className="mt-3 rounded-2xl">
                      <a href={file.dataUrl} download={file.name}>
                        Baixar
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500">
                {selectedPerson
                  ? "Nenhum arquivo anexado para esta pessoa ainda."
                  : "Selecione um card para começar a anexar arquivos."}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Modelo por edital"
            description="Envie o modelo que o edital pede. O sistema continua gerando uma pessoa por folha."
            actions={
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                <UploadCloud className="size-4" />
                Subir modelo
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
            }
          >
            {template.referenceFile ? (
              <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-black text-emerald-800">Modelo anexado</p>
                <p className="mt-1 text-sm text-emerald-700">{template.referenceFile.name}</p>
              </div>
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500">
                Nenhum modelo anexado ainda.
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Gerar currículos"
            description="Se houver seleção em lote, ela tem prioridade. Sem lote, o sistema usa o card ativo."
            actions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={generatePdf}
                  disabled={allPeople.length === 0}
                >
                  <FileText className="size-4" />
                  Gerar PDF
                </Button>
                <Button
                  type="button"
                  className="rounded-2xl"
                  onClick={generateWord}
                  disabled={allPeople.length === 0}
                >
                  <Download className="size-4" />
                  Gerar Word
                </Button>
              </>
            }
          >
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Seleção atual
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {selectedBatchPeople.length > 0
                  ? `${selectedBatchPeople.length} pessoa(s) no lote.`
                  : selectedPerson
                    ? `Nenhum lote ativo. Será gerado o card de ${selectedPerson.name}.`
                    : "Nenhuma pessoa ativa para geração."}
              </p>
              {selectedBatchPeople.length > 0 ? (
                <p className="mt-1 text-sm text-slate-500">
                  {selectedBatchPeople
                    .slice(0, 3)
                    .map((person) => person.name)
                    .join(", ")}
                  {selectedBatchPeople.length > 3
                    ? ` e mais ${selectedBatchPeople.length - 3}.`
                    : "."}
                </p>
              ) : null}
            </div>
          </SectionCard>
        </div>
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
  icon,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-sm">
      <div className={cn("mb-3 flex size-10 items-center justify-center rounded-2xl", tone)}>
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function MicroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white/80 bg-white/80 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function getFilledResumeSections(person: ResumePerson) {
  return [
    person.formation,
    person.courses,
    person.actingTime,
    person.experience,
    person.works,
    person.additionalInfo,
  ].filter((value) => safeText(value)).length;
}

function summarizeField(value: string, fallback: string) {
  const text = safeText(value);

  if (!text) return fallback;
  if (text.length <= 120) return text;

  return `${text.slice(0, 117).trim()}...`;
}
