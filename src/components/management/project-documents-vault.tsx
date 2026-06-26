/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderPlus,
  ImageIcon,
  Paperclip,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getActiveProjectScope, projectScopedKey } from "@/lib/project-scope";
import { useClientReady } from "@/lib/use-client-ready";
import type { ProjectDocument } from "@/modules/documents/types";

type DocumentStatus = "Pendente" | "Enviado" | "Aprovado" | "Precisa corrigir" | "Vencido";

type ProjectDocumentFile = {
  id: string;
  sourceId?: string;
  projectName: string;
  name: string;
  category: string;
  status: DocumentStatus;
  validUntil: string;
  notes: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileDataUrl?: string;
  uploadedAt?: string;
};

type ProjectDocumentsVaultProps = {
  project?: { id: string; name: string };
  documents?: ProjectDocument[];
};

const storageKeyBase = "viva:central-cultural:documents:v1";
const initializedKeyBase = "viva:central-cultural:documents:initialized:v1";
export const CENTRAL_DOCUMENTS_UPDATED_EVENT = "viva:central-cultural-documents-updated";

const documentTemplates = [
  "Cartão CNPJ",
  "Certidão Federal",
  "Certidão Estadual",
  "Certidão Municipal",
  "FGTS",
  "CNDT",
  "DART-SC",
  "Termo de Execução",
  "Dados Bancários",
  "Carta de Anuência",
  "Termo de Participação",
  "Autorização de Uso de Imagem",
  "Comprovante Financeiro",
  "Material de Divulgação",
  "Edital principal",
  "Anexos do edital",
  "Habilitação",
  "Proposta",
  "Orçamento",
];

const legacyPlaceholderIds = new Set([
  "doc-cartao-cnpj",
  "doc-certidao-federal",
  "doc-certidao-estadual",
  "doc-certidao-municipal",
]);

function makeId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLegacyPlaceholderDocument(document: ProjectDocumentFile) {
  return (
    legacyPlaceholderIds.has(document.id) &&
    !document.fileDataUrl &&
    !document.fileName &&
    !document.notes &&
    document.status === "Pendente"
  );
}

function normalizeStatus(status: ProjectDocument["status"] | string): DocumentStatus {
  if (status === "Válido") return "Aprovado";
  if (status === "Vencido") return "Vencido";
  if (status === "Arquivado") return "Pendente";
  if (status === "Substituído") return "Enviado";
  if (status === "Pendente") return "Pendente";

  return ["Pendente", "Enviado", "Aprovado", "Precisa corrigir", "Vencido"].includes(status)
    ? (status as DocumentStatus)
    : "Pendente";
}

function mapServerDocument(document: ProjectDocument, projectName: string): ProjectDocumentFile {
  return {
    id: `server-${document.id}`,
    sourceId: document.id,
    projectName,
    name: document.fileName,
    category: document.category,
    status: normalizeStatus(document.status),
    validUntil: document.expiresAt ?? "",
    notes: document.notes,
    fileName: document.fileName,
    uploadedAt: document.uploadedAt,
  };
}

function mergeDocuments(primary: ProjectDocumentFile[], fallback: ProjectDocumentFile[]) {
  const seen = new Set<string>();

  const addKeys = (document: ProjectDocumentFile) => {
    seen.add(document.id);
    if (document.sourceId) seen.add(`source:${document.sourceId}`);
    if (document.fileName) seen.add(`file:${document.fileName.toLowerCase()}`);
  };

  primary.forEach(addKeys);

  return [
    ...primary,
    ...fallback.filter((document) => {
      const keys = [
        document.id,
        document.sourceId ? `source:${document.sourceId}` : "",
        document.fileName ? `file:${document.fileName.toLowerCase()}` : "",
      ].filter(Boolean);

      return !keys.some((key) => seen.has(key));
    }),
  ];
}

function readDocuments(
  projectId: string,
  projectName: string,
  fallbackDocuments: ProjectDocument[] = [],
) {
  const fallback = fallbackDocuments.map((document) => mapServerDocument(document, projectName));

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const storageKey = projectScopedKey(storageKeyBase, projectId);
    const saved = window.localStorage.getItem(storageKey);

    if (saved) {
      const parsed = JSON.parse(saved) as ProjectDocumentFile[];
      const clean = Array.isArray(parsed)
        ? parsed.filter((document) => !isLegacyPlaceholderDocument(document))
        : [];

      return mergeDocuments(clean, fallback);
    }

    window.localStorage.setItem(projectScopedKey(initializedKeyBase, projectId), "1");
    return fallback;
  } catch {
    return fallback;
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size?: number) {
  if (!size) return "Sem arquivo";

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function daysUntil(date: string) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function getValidityLabel(document: ProjectDocumentFile) {
  if (!document.validUntil) return "Sem validade";

  const days = daysUntil(document.validUntil);

  if (days === null) return "Sem validade";
  if (days < 0) return `Vencido há ${Math.abs(days)} dia(s)`;
  if (days === 0) return "Vence hoje";
  if (days <= 15) return `Vence em ${days} dia(s)`;

  return `Válido por ${days} dia(s)`;
}

function getDocumentTone(document: ProjectDocumentFile) {
  const days = daysUntil(document.validUntil);

  if (document.status === "Aprovado" && (days === null || days > 15)) {
    return "border-emerald-200 bg-emerald-50";
  }

  if (document.status === "Precisa corrigir" || document.status === "Vencido" || (days !== null && days < 0)) {
    return "border-red-200 bg-red-50";
  }

  if (days !== null && days <= 15) {
    return "border-amber-200 bg-amber-50";
  }

  if (document.status === "Enviado") {
    return "border-sky-200 bg-sky-50";
  }

  return "border-slate-200 bg-white";
}

function statusTone(status: DocumentStatus) {
  if (status === "Aprovado") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Enviado") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "Precisa corrigir" || status === "Vencido") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function downloadDocument(document: ProjectDocumentFile) {
  if (!document.fileDataUrl) return;

  const link = window.document.createElement("a");
  link.href = document.fileDataUrl;
  link.download = document.fileName || `${document.name}.pdf`;
  link.click();
}

export function ProjectDocumentsVault({ project, documents = [] }: ProjectDocumentsVaultProps = {}) {
  const isClient = useClientReady();

  if (!isClient) {
    return (
      <div className="rounded-3xl border border-white bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando documentos do projeto...
      </div>
    );
  }

  return <ProjectDocumentsVaultContent project={project} documents={documents} />;
}

function ProjectDocumentsVaultContent({
  project: providedProject,
  documents: serverDocuments,
}: ProjectDocumentsVaultProps) {
  const project = useMemo(() => providedProject ?? getActiveProjectScope(), [providedProject]);
  const [documents, setDocuments] = useState<ProjectDocumentFile[]>(() =>
    readDocuments(project.id, project.name, serverDocuments ?? []),
  );
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState("Documentos carregados.");
  const [preview, setPreview] = useState<ProjectDocumentFile | null>(null);

  useEffect(() => {
    const next = readDocuments(project.id, project.name, serverDocuments ?? []);
    setDocuments(next);
    setExpandedId(null);
    setMessage(`Documentos carregados para ${project.name}.`);
  }, [project.id, project.name, serverDocuments]);

  function commit(nextDocuments: ProjectDocumentFile[], nextMessage = "Documento salvo automaticamente.") {
    setDocuments(nextDocuments);
    window.localStorage.setItem(
      projectScopedKey(storageKeyBase, project.id),
      JSON.stringify(nextDocuments),
    );
    window.localStorage.setItem(projectScopedKey(initializedKeyBase, project.id), "1");
    window.dispatchEvent(
      new CustomEvent(CENTRAL_DOCUMENTS_UPDATED_EVENT, {
        detail: { projectId: project.id, total: nextDocuments.length },
      }),
    );
    setMessage(nextMessage);
  }

  function updateDocument(documentId: string, patch: Partial<ProjectDocumentFile>) {
    commit(
      documents.map((document) =>
        document.id === documentId ? { ...document, ...patch } : document,
      ),
    );
  }

  function addDocument(templateName = "Novo documento") {
    const nextDocument: ProjectDocumentFile = {
      id: makeId(),
      projectName: project.name,
      name: templateName,
      category: templateName.includes("Certidão")
        ? "Certidões"
        : templateName.includes("Edital") || templateName.includes("Anexos")
          ? "Edital e anexos"
          : "Geral",
      status: "Pendente",
      validUntil: "",
      notes: "",
    };

    commit([nextDocument, ...documents], "Novo card de documento criado.");
    setExpandedId(nextDocument.id);
  }

  async function uploadDocument(documentId: string, file: File | null) {
    if (!file) return;

    const maxSize = 8 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage("Arquivo muito grande para armazenamento local. Use até 8 MB por enquanto.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);

    updateDocument(documentId, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileDataUrl: dataUrl,
      uploadedAt: new Date().toISOString(),
      status: "Enviado",
    });

    setMessage("Arquivo anexado ao documento.");
  }

  function removeFile(documentId: string) {
    updateDocument(documentId, {
      fileName: undefined,
      fileType: undefined,
      fileSize: undefined,
      fileDataUrl: undefined,
      uploadedAt: undefined,
      status: "Pendente",
    });

    setMessage("Arquivo removido do card.");
  }

  function removeDocument(documentId: string) {
    if (!window.confirm("Apagar este card de documento?")) return;

    commit(
      documents.filter((document) => document.id !== documentId),
      "Documento apagado.",
    );

    if (expandedId === documentId) {
      setExpandedId(null);
    }
  }

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return documents.filter((document) => {
      if (!normalizedSearch) return true;

      return (
        document.name.toLowerCase().includes(normalizedSearch) ||
        document.category.toLowerCase().includes(normalizedSearch) ||
        document.status.toLowerCase().includes(normalizedSearch) ||
        (document.fileName ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [documents, search]);

  const totals = useMemo(() => {
    const expired = documents.filter((document) => {
      const days = daysUntil(document.validUntil);
      return days !== null && days < 0;
    }).length;

    const closeToExpire = documents.filter((document) => {
      const days = daysUntil(document.validUntil);
      return days !== null && days >= 0 && days <= 15;
    }).length;

    return {
      total: documents.length,
      withFile: documents.filter((document) => document.fileDataUrl || document.fileName).length,
      pending: documents.filter((document) => document.status !== "Aprovado").length,
      expired,
      closeToExpire,
    };
  }, [documents]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Documentos do projeto
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">
              Cofre único de documentos
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Os documentos ficam em cards compactos. Clique em um card para abrir, editar, visualizar, baixar ou substituir o arquivo.
            </p>
          </div>

          <Button type="button" onClick={() => addDocument()}>
            <FolderPlus className="size-4" />
            Novo card
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Info title="Total" value={String(totals.total)} helper="cards cadastrados" />
        <Info title="Com arquivo" value={String(totals.withFile)} helper="arquivos vinculados" />
        <Info title="Pendentes" value={String(totals.pending)} helper="não aprovados" />
        <Info title="A vencer" value={String(totals.closeToExpire)} helper="até 15 dias" />
        <Info title="Vencidos" value={String(totals.expired)} helper="precisam atenção" />
      </div>

      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Buscar documento
          </span>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="form-input pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, categoria, arquivo ou status..."
            />
          </div>
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          {documentTemplates.map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => addDocument(template)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              + {template}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {filteredDocuments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2 2xl:col-span-3">
            Nenhum documento real cadastrado neste projeto ainda. Crie um card ou suba um arquivo.
          </div>
        ) : null}

        {filteredDocuments.map((document) => {
          const expanded = expandedId === document.id;
          const isImage = document.fileType?.startsWith("image/");

          return (
            <article
              key={document.id}
              className={`rounded-3xl border p-4 shadow-sm transition ${getDocumentTone(document)} ${
                expanded ? "md:col-span-2 2xl:col-span-3" : ""
              }`}
            >
              <button
                type="button"
                className="flex w-full items-start gap-3 text-left"
                onClick={() => setExpandedId(expanded ? null : document.id)}
              >
                <span className="mt-1 rounded-2xl bg-white p-3 text-primary shadow-sm">
                  {document.fileName ? (
                    isImage ? (
                      <ImageIcon className="size-5" />
                    ) : (
                      <FileCheck2 className="size-5" />
                    )
                  ) : (
                    <FileText className="size-5 text-slate-400" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-black text-slate-950">
                    {document.name}
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-500">
                    {document.category} · {document.fileName || "sem arquivo"}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(document.status)}`}>
                      {document.status}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                      {getValidityLabel(document)}
                    </span>
                  </span>
                </span>

                <span className="rounded-full bg-white p-2 text-slate-500 shadow-sm">
                  {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </span>
              </button>

              {expanded ? (
                <div className="mt-5 rounded-3xl border border-white/80 bg-white/90 p-4 text-slate-700 shadow-sm">
                  <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <label className="block">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            Documento
                          </span>
                          <input
                            className="form-input mt-1"
                            value={document.name}
                            onChange={(event) =>
                              updateDocument(document.id, { name: event.target.value })
                            }
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            Categoria
                          </span>
                          <input
                            className="form-input mt-1"
                            value={document.category}
                            onChange={(event) =>
                              updateDocument(document.id, { category: event.target.value })
                            }
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            Status
                          </span>
                          <select
                            className="form-input mt-1"
                            value={document.status}
                            onChange={(event) =>
                              updateDocument(document.id, {
                                status: event.target.value as DocumentStatus,
                              })
                            }
                          >
                            <option>Pendente</option>
                            <option>Enviado</option>
                            <option>Aprovado</option>
                            <option>Precisa corrigir</option>
                            <option>Vencido</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            Validade
                          </span>
                          <input
                            className="form-input mt-1"
                            type="date"
                            value={document.validUntil}
                            onChange={(event) =>
                              updateDocument(document.id, { validUntil: event.target.value })
                            }
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Observações
                        </span>
                        <input
                          className="form-input mt-1"
                          value={document.notes}
                          onChange={(event) =>
                            updateDocument(document.id, { notes: event.target.value })
                          }
                          placeholder="Ex.: certidão precisa ser renovada antes da assinatura..."
                        />
                      </label>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                      <div className="flex items-start gap-3">
                        <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                          <Paperclip className="size-5" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">
                            {document.fileName || "Nenhum arquivo"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatFileSize(document.fileSize)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                          <UploadCloud className="mr-2 size-4" />
                          Subir/substituir
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,image/png,image/jpeg,image/webp,.doc,.docx,.xls,.xlsx"
                            onChange={(event) => {
                              void uploadDocument(document.id, event.target.files?.[0] ?? null);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={!document.fileDataUrl}
                          onClick={() => {
                            if (document.fileDataUrl) {
                              setPreview(document);
                            }
                          }}
                        >
                          <Eye className="size-4" />
                          Visualizar
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={!document.fileDataUrl}
                          onClick={() => downloadDocument(document)}
                        >
                          <Download className="size-4" />
                          Baixar
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={!document.fileName}
                          onClick={() => removeFile(document.id)}
                        >
                          <X className="size-4" />
                          Apagar arquivo
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeDocument(document.id)}
                        >
                          <Trash2 className="size-4" />
                          Excluir card
                        </Button>
                      </div>

                      {!document.fileDataUrl && document.fileName ? (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                          Este arquivo veio do banco/lista do projeto. Para visualizar aqui, suba ou substitua o arquivo neste card.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {preview?.fileDataUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <p className="text-sm font-black text-slate-950">{preview.name}</p>
                <p className="text-xs text-slate-500">{preview.fileName}</p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => downloadDocument(preview)}>
                  <Download className="size-4" />
                  Baixar
                </Button>

                <Button type="button" variant="outline" onClick={() => setPreview(null)}>
                  Fechar
                </Button>
              </div>
            </div>

            <div className="min-h-[70vh] overflow-auto bg-slate-100 p-4">
              {preview.fileType?.includes("pdf") ? (
                <iframe
                  src={preview.fileDataUrl}
                  title={preview.name}
                  className="h-[72vh] w-full rounded-2xl border border-slate-200 bg-white"
                />
              ) : preview.fileType?.startsWith("image/") ? (
                <img
                  src={preview.fileDataUrl}
                  alt={preview.name}
                  className="mx-auto max-h-[72vh] rounded-2xl object-contain"
                />
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                  Prévia indisponível para este tipo de arquivo. Use o botão baixar.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Info({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
