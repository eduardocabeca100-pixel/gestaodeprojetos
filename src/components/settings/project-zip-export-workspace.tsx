"use client";

import { useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import {
  Archive,
  CheckCircle2,
  Database,
  Download,
  FileArchive,
  FolderArchive,
  RefreshCw,
} from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import {
  getActiveProjectScope,
  getProjectAliases,
  normalizeProjectValue,
  setActiveProjectScope,
  type ActiveProjectScope,
} from "@/lib/project-scope";
import { useClientReady } from "@/lib/use-client-ready";

type ExportArea = {
  folder: string;
  title: string;
  description: string;
  matcher: (key: string) => boolean;
};

type ProjectZipExportWorkspaceProps = {
  registeredProjects?: ActiveProjectScope[];
};

const exportAreas: ExportArea[] = [
  {
    folder: "01-equipe",
    title: "Equipe",
    description: "Equipe vinculada ao projeto e equipe permanente/casting.",
    matcher: (key) => key.includes("team") || key.includes("equipe") || key.includes("casting"),
  },
  {
    folder: "02-documentos",
    title: "Documentos",
    description: "Documentos, certidões, anexos documentais e arquivos oficiais.",
    matcher: (key) => key.includes("documents") || key.includes("documentos") || key.includes("certidao") || key.includes("certidão"),
  },
  {
    folder: "03-anexos-e-editais",
    title: "Anexos e editais",
    description: "Editais, anexos, comprovantes e arquivos complementares.",
    matcher: (key) => key.includes("anexo") || key.includes("edital") || key.includes("attachment") || key.includes("comprovante"),
  },
  {
    folder: "04-cronograma-e-diario",
    title: "Cronograma e diário",
    description: "Cronograma, aulas, atividades, diário de classe, presença e execução.",
    matcher: (key) => key.includes("schedule") || key.includes("cronograma") || key.includes("diary") || key.includes("diario") || key.includes("attendance") || key.includes("presenca"),
  },
  {
    folder: "05-financeiro",
    title: "Financeiro",
    description: "Rubricas, pagamentos, notas fiscais, recibos, demonstrativos e controle financeiro.",
    matcher: (key) => key.includes("finance") || key.includes("rubric") || key.includes("rubrica") || key.includes("gestao-avancada") || key.includes("payment") || key.includes("pagamento"),
  },
  {
    folder: "06-prestacao-de-contas",
    title: "Prestação de contas",
    description: "Relatório de prestação, evidências e informações consolidadas.",
    matcher: (key) => key.includes("accountability") || key.includes("prestacao"),
  },
  {
    folder: "07-relatorios",
    title: "Relatórios",
    description: "Relatórios culturais, administrativos e de execução.",
    matcher: (key) => key.includes("report") || key.includes("relatorio") || key.includes("relatório"),
  },
  {
    folder: "08-demonstrativos-e-recibos",
    title: "Demonstrativos e recibos",
    description: "Demonstrativos administrativos usados como recibo/controle de pagamento.",
    matcher: (key) => key.includes("demonstrative") || key.includes("demonstrativo") || key.includes("recibo"),
  },
  {
    folder: "09-midia-e-evidencias",
    title: "Mídia e evidências",
    description: "Fotos, imagens, links, vídeos, materiais e demais evidências.",
    matcher: (key) => key.includes("media") || key.includes("midia") || key.includes("mídia") || key.includes("photo") || key.includes("image") || key.includes("foto") || key.includes("video") || key.includes("link"),
  },
];

function safeName(value: string) {
  return normalizeProjectValue(value) || "arquivo";
}

function parseJson(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueToReadable(value: unknown, depth = 0): string {
  if (value === null || value === undefined || value === "") return "-";

  if (typeof value === "string") {
    if (value.startsWith("data:")) return "[arquivo anexado]";
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (!value.length) return "Nenhum item encontrado.";

    return value
      .map((item, index) => {
        if (isRecord(item)) {
          const title =
            String(item.name || item.title || item.fileName || item.description || item.recipientName || `Item ${index + 1}`);

          return `${index + 1}. ${title}\n${valueToReadable(item, depth + 1)}`;
        }

        return `${index + 1}. ${valueToReadable(item, depth + 1)}`;
      })
      .join("\n\n");
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([, entry]) => !(typeof entry === "string" && entry.startsWith("data:")))
      .map(([key, entry]) => {
        if (Array.isArray(entry) || isRecord(entry)) {
          if (depth > 1) return `${key}: ${Array.isArray(entry) ? `${entry.length} item(ns)` : "dados internos"}`;
          return `${key}:\n${valueToReadable(entry, depth + 1)}`;
        }

        return `${key}: ${valueToReadable(entry, depth + 1)}`;
      })
      .join("\n");
  }

  return String(value);
}

function createPdfBlob(title: string, subtitle: string, content: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = 56;

  function footer() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text("VIVA Gestão Cultural • Documento gerado para backup do projeto", margin, pageHeight - 28);
    doc.text(new Date().toLocaleDateString("pt-BR"), pageWidth - margin, pageHeight - 28, { align: "right" });
  }

  function addPageIfNeeded(nextHeight = 20) {
    if (y + nextHeight > pageHeight - 54) {
      footer();
      doc.addPage();
      y = 56;
    }
  }

  doc.setFillColor(14, 45, 24);
  doc.rect(0, 0, pageWidth, 112, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title.slice(0, 82), margin, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle.slice(0, 120), margin, 72);

  doc.setTextColor(20, 20, 20);
  y = 142;

  const paragraphs = content
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    paragraphs.push("Nenhuma informação cadastrada nesta área até o momento.");
  }

  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph, maxWidth) as string[];
    addPageIfNeeded(lines.length * 13 + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(35, 35, 35);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 12;
  }

  footer();

  return doc.output("blob");
}

function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
  const binary = atob(data || "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

function extensionFromDataUrl(dataUrl: string) {
  const mime = dataUrl.match(/data:(.*?);base64/)?.[1] || "";

  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("svg")) return "svg";

  return "bin";
}

async function extractFiles(zip: JSZip, folder: string, value: unknown, prefix: string) {
  if (!value) return;

  if (typeof value === "string" && value.startsWith("data:")) {
    const ext = extensionFromDataUrl(value);
    zip.file(`${folder}/${safeName(prefix)}.${ext}`, dataUrlToBlob(value));
    return;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      await extractFiles(zip, folder, item, `${prefix}-${index + 1}`);
    }

    return;
  }

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      await extractFiles(zip, folder, item, `${prefix}-${key}`);
    }
  }
}

function collectLinks(value: unknown, result: string[] = []) {
  if (!value) return result;

  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) result.push(value);
    return result;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectLinks(item, result);
    return result;
  }

  if (isRecord(value)) {
    for (const item of Object.values(value)) collectLinks(item, result);
  }

  return result;
}

function belongsToProject(key: string, project: ActiveProjectScope) {
  const aliases = getProjectAliases(project).filter(
    (alias) => alias && alias !== "projeto-atual" && alias !== "sem-projeto",
  );

  if (key.includes(`project:${project.id}`)) return true;
  if (aliases.some((alias) => key.includes(alias))) return true;

  return false;
}

function collectProjectPayload(project: ActiveProjectScope) {
  const payload: Record<string, unknown> = {};
  const allKeys = typeof window === "undefined" ? [] : Object.keys(window.localStorage);

  const assignments = parseJson(window.localStorage.getItem("viva:project-team-assignments:v1")) as Record<string, unknown> | null;

  payload["equipe-do-projeto"] = assignments?.[project.id] ?? [];
  payload["equipe-permanente-casting"] = parseJson(window.localStorage.getItem("viva:team-roster:v1"));

  for (const key of allKeys) {
    if (!belongsToProject(key, project)) continue;
    payload[key] = parseJson(window.localStorage.getItem(key));
  }

  return payload;
}

function payloadForArea(payload: Record<string, unknown>, area: ExportArea) {
  const entries: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (area.matcher(key)) entries[key] = value;
  }

  return entries;
}

function countArea(payload: Record<string, unknown>, area: ExportArea) {
  return Object.keys(payloadForArea(payload, area)).length;
}

function summarizeProject(selectedProject: ActiveProjectScope) {
  const payload = collectProjectPayload(selectedProject);
  const nextSummary: Record<string, number> = {};

  for (const area of exportAreas) {
    nextSummary[area.folder] = countArea(payload, area);
  }

  return {
    summary: nextSummary,
    message: `Projeto pronto para exportação: ${selectedProject.name}.`,
  };
}

export function ProjectZipExportWorkspace({ registeredProjects = [] }: ProjectZipExportWorkspaceProps) {
  const isClient = useClientReady();

  if (!isClient) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando exportador de projeto...
      </div>
    );
  }

  return <ProjectZipExportWorkspaceContent registeredProjects={registeredProjects} />;
}

function ProjectZipExportWorkspaceContent({ registeredProjects }: ProjectZipExportWorkspaceProps) {
  const [isExporting, setIsExporting] = useState(false);
  const projectOptions = useMemo(() => {
    return registeredProjects.filter((item) => item.id && item.name);
  }, [registeredProjects]);
  const initialState = useMemo(() => {
    const fallbackProject = projectOptions[0] ?? getActiveProjectScope();

    if (!projectOptions.length) {
      return {
        project: fallbackProject,
        summary: {} as Record<string, number>,
        message: "Nenhum projeto cadastrado encontrado para exportar.",
      };
    }

    const active = getActiveProjectScope();
    const matched = projectOptions.find((item) => item.id === active.id) ?? projectOptions[0];

    return {
      project: matched,
      ...summarizeProject(matched),
    };
  }, [projectOptions]);
  const [project, setProject] = useState<ActiveProjectScope>(initialState.project);
  const [summary, setSummary] = useState<Record<string, number>>(initialState.summary);
  const [message, setMessage] = useState(initialState.message);

  useEffect(() => {
    if (project?.id && project.id !== "sem-projeto") {
      setActiveProjectScope(project);
    }
  }, [project]);

  function refresh(selectedProject = project) {
    if (!selectedProject?.id || selectedProject.id === "sem-projeto") {
      setMessage("Nenhum projeto cadastrado encontrado para exportar.");
      return;
    }

    const nextState = summarizeProject(selectedProject);

    setProject(selectedProject);
    setSummary(nextState.summary);
    setMessage(nextState.message);
  }

  function handleSelect(projectId: string) {
    const selected = projectOptions.find((item) => item.id === projectId);

    if (selected) refresh(selected);
  }

  async function exportZip() {
    if (!project?.id || project.id === "sem-projeto") {
      setMessage("Selecione um projeto cadastrado antes de exportar.");
      return;
    }

    setIsExporting(true);

    try {
      const payload = collectProjectPayload(project);
      const zip = new JSZip();
      const root = zip.folder(`backup-${safeName(project.name)}`) ?? zip;

      const generatedAt = new Date().toLocaleString("pt-BR");

      root.file(
        "00-LEIA-ME.pdf",
        createPdfBlob(
          "Backup do Projeto",
          `${project.name} • Gerado em ${generatedAt}`,
          [
            `Projeto: ${project.name}`,
            `ID: ${project.id}`,
            `Slug: ${project.slug ?? "-"}`,
            `Gerado em: ${generatedAt}`,
            "",
            "Este ZIP foi gerado pelo VIVA Gestão Cultural.",
            "As informações foram convertidas para PDFs de leitura, e os arquivos anexados foram extraídos quando estavam salvos dentro do sistema.",
            "",
            "Pastas:",
            ...exportAreas.map((area) => `${area.folder} - ${area.title}`),
          ].join("\n"),
        ),
      );

      for (const area of exportAreas) {
        const areaPayload = payloadForArea(payload, area);
        const readable = Object.keys(areaPayload).length
          ? Object.entries(areaPayload)
              .map(([key, value]) => `ORIGEM: ${key}\n\n${valueToReadable(value)}`)
              .join("\n\n------------------------------\n\n")
          : "Nenhuma informação cadastrada nesta área até o momento.";

        root.file(
          `${area.folder}/${safeName(area.title)}.pdf`,
          createPdfBlob(
            area.title,
            `${project.name} • ${area.description}`,
            readable,
          ),
        );

        await extractFiles(root, `${area.folder}/arquivos-extraidos`, areaPayload, area.folder);
      }

      const allLinks = collectLinks(payload);

      root.file(
        "09-midia-e-evidencias/links-do-projeto.pdf",
        createPdfBlob(
          "Links do projeto",
          project.name,
          allLinks.length
            ? allLinks.map((link, index) => `${index + 1}. ${link}`).join("\n")
            : "Nenhum link encontrado nos dados locais deste projeto.",
        ),
      );

      root.file(
        "99-resumo-geral/resumo-do-backup.pdf",
        createPdfBlob(
          "Resumo geral do backup",
          project.name,
          [
            `Projeto: ${project.name}`,
            `Total de grupos locais: ${Object.keys(payload).length}`,
            "",
            ...exportAreas.map((area) => `${area.title}: ${countArea(payload, area)} grupo(s) de dados`),
          ].join("\n"),
        ),
      );

      const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/zip",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const filename = `backup-${safeName(project.name)}-${new Date().toISOString().slice(0, 10)}.zip`;

      saveAs(blob, filename);
      setMessage(`ZIP gerado: ${filename}. Confira a pasta Downloads.`);
    } catch (error) {
      console.error(error);
      setMessage("Erro ao gerar ZIP. Abra o console do navegador para ver detalhes.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Baixar projeto completo em ZIP"
        description="Exporta somente projetos cadastrados. O conteúdo interno é gerado em PDF e separado por pastas."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => refresh()}>
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
            <Button type="button" onClick={() => void exportZip()} disabled={isExporting || !projectOptions.length}>
              <Download className="size-4" />
              {isExporting ? "Gerando..." : "Baixar ZIP"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
            <div className="flex gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-700 text-white">
                <FolderArchive className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em]">Projeto selecionado</p>
                <h3 className="mt-1 text-xl font-black">{project?.name ?? "Nenhum projeto"}</h3>
                <p className="mt-2 text-sm leading-6">
                  Esta exportação baixa um <strong>ZIP</strong> com PDFs dentro. Não baixa JSON como arquivo principal.
                </p>
                <p className="mt-3 text-sm font-bold">{message}</p>
              </div>
            </div>
          </div>

          <label className="block rounded-3xl border border-slate-200 bg-white p-5">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Escolher projeto cadastrado
            </span>
            <select
              className="form-input mt-2"
              value={project?.id ?? ""}
              onChange={(event) => handleSelect(event.target.value)}
            >
              {projectOptions.length ? (
                projectOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              ) : (
                <option value="">Nenhum projeto cadastrado</option>
              )}
            </select>
          </label>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exportAreas.map((area) => {
          const count = summary[area.folder] ?? 0;

          return (
            <div key={area.folder} className="rounded-3xl border border-white bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                  {count ? <CheckCircle2 className="size-5 text-emerald-600" /> : <FileArchive className="size-5" />}
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{area.folder}</p>
                  <h3 className="font-black text-slate-950">{area.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {area.description}
              </p>
              <p className="mt-2 text-sm font-bold text-primary">
                {count} grupo(s) encontrado(s).
              </p>
            </div>
          );
        })}
      </div>

      <SectionCard
        title="Formato da exportação"
        description="O ZIP será organizado em pastas. Cada pasta terá um PDF de leitura e, quando existir, arquivos extraídos."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <InfoCard title="PDFs de leitura" text="Os dados internos são convertidos em PDFs para você abrir, conferir e arquivar." />
          <InfoCard title="Arquivos extraídos" text="Fotos, imagens e PDFs anexados são extraídos para subpastas de arquivos." />
          <InfoCard title="Sem mistura de projetos" text="A seleção usa somente os projetos cadastrados no sistema." />
        </div>
      </SectionCard>

      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-black">
          <Archive className="size-4" />
          Observação
        </div>
        <p className="mt-1 leading-6">
          Quando conectarmos Supabase Storage ou Google Drive, esta tela poderá incluir também os arquivos que estiverem salvos na nuvem.
        </p>
      </div>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Database className="size-5 text-primary" />
      <h3 className="mt-3 font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
