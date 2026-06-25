/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderPlus,
  ImageIcon,
  Paperclip,
  Search,
  ShieldAlert,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useClientReady } from "@/lib/use-client-ready";
import { getActiveProjectScope, projectScopedKey } from "@/lib/project-scope";

type DocumentStatus =
  | "Pendente"
  | "Enviado"
  | "Aprovado"
  | "Precisa corrigir"
  | "Vencido";

type ProjectDocumentFile = {
  id: string;
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
];

function getDefaultDocuments(projectName: string): ProjectDocumentFile[] {
  return [
    {
      id: "doc-cartao-cnpj",
      projectName,
      name: "Cartão CNPJ",
      category: "Proponente",
      status: "Pendente",
      validUntil: "",
      notes: "",
    },
    {
      id: "doc-certidao-federal",
      projectName,
      name: "Certidão Federal",
      category: "Certidões",
      status: "Pendente",
      validUntil: "",
      notes: "",
    },
    {
      id: "doc-certidao-estadual",
      projectName,
      name: "Certidão Estadual",
      category: "Certidões",
      status: "Pendente",
      validUntil: "",
      notes: "",
    },
    {
      id: "doc-certidao-municipal",
      projectName,
      name: "Certidão Municipal",
      category: "Certidões",
      status: "Pendente",
      validUntil: "",
      notes: "",
    },
  ];
}

function makeId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readDocuments(projectId: string, projectName: string) {
  if (typeof window === "undefined") return getDefaultDocuments(projectName);

  try {
    const storageKey = projectScopedKey(storageKeyBase, projectId);
    const initializedKey = projectScopedKey(initializedKeyBase, projectId);
    const saved = window.localStorage.getItem(storageKey);

    if (saved) {
      const parsed = JSON.parse(saved) as ProjectDocumentFile[];
      return Array.isArray(parsed) ? parsed : getDefaultDocuments(projectName);
    }

    if (window.localStorage.getItem(initializedKey) === "1") {
      return [];
    }

    return getDefaultDocuments(projectName);
  } catch {
    return getDefaultDocuments(projectName);
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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (document.status === "Precisa corrigir" || document.status === "Vencido" || (days !== null && days < 0)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (days !== null && days <= 15) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (document.status === "Enviado") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-white text-slate-700";
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

export function ProjectDocumentsVault() {
  const isClient = useClientReady();

  if (!isClient) {
    return (
      <div className="rounded-3xl border border-white bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando documentos do projeto...
      </div>
    );
  }

  return <ProjectDocumentsVaultContent />;
}

function ProjectDocumentsVaultContent() {
  const project = useMemo(() => getActiveProjectScope(), []);
  const [documents, setDocuments] = useState<ProjectDocumentFile[]>(() =>
    readDocuments(project.id, project.name),
  );
  const [projectFilter, setProjectFilter] = useState(project.name);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Documentos carregados.");
  const [preview, setPreview] = useState<ProjectDocumentFile | null>(null);

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
      projectName: projectFilter || project.name,
      name: templateName,
      category: templateName.includes("Certidão") ? "Certidões" : "Geral",
      status: "Pendente",
      validUntil: "",
      notes: "",
    };

    commit([nextDocument, ...documents], "Novo documento criado.");
  }

  async function uploadDocument(documentId: string, file: File | null) {
    if (!file) return;

    const maxSize = 4 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage("Arquivo muito grande para teste local. Use até 4 MB por enquanto. No Supabase poderemos subir arquivos maiores.");
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

    setMessage("Arquivo removido do documento.");
  }

  function removeDocument(documentId: string) {
    if (!window.confirm("Apagar este documento da lista?")) return;

    commit(
      documents.filter((document) => document.id !== documentId),
      "Documento apagado.",
    );
  }

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedProject = projectFilter.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesProject =
        !normalizedProject ||
        document.projectName.toLowerCase().includes(normalizedProject);

      const matchesSearch =
        !normalizedSearch ||
        document.name.toLowerCase().includes(normalizedSearch) ||
        document.category.toLowerCase().includes(normalizedSearch) ||
        document.status.toLowerCase().includes(normalizedSearch);

      return matchesProject && matchesSearch;
    });
  }, [documents, projectFilter, search]);

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
      withFile: documents.filter((document) => document.fileDataUrl).length,
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
              Documentos por projeto
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">
              Cofre de documentos e certidões
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Suba, visualize, baixe e apague documentos. Cada item pode ter validade, status e observações.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => addDocument()}>
              <FolderPlus className="size-4" />
              Novo documento
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Total</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{totals.total}</p>
          <p className="mt-1 text-sm text-slate-500">documentos cadastrados</p>
        </div>

        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Com arquivo</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{totals.withFile}</p>
          <p className="mt-1 text-sm text-slate-500">anexos enviados</p>
        </div>

        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Pendentes</p>
          <p className="mt-2 text-3xl font-black text-amber-700">{totals.pending}</p>
          <p className="mt-1 text-sm text-slate-500">não aprovados</p>
        </div>

        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">A vencer</p>
          <p className="mt-2 text-3xl font-black text-amber-700">{totals.closeToExpire}</p>
          <p className="mt-1 text-sm text-slate-500">em até 15 dias</p>
        </div>

        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Vencidos</p>
          <p className="mt-2 text-3xl font-black text-red-700">{totals.expired}</p>
          <p className="mt-1 text-sm text-slate-500">precisam atenção</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Projeto
            </span>
            <input
              className="form-input mt-1"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              placeholder="Ex.: Reféns, O Poço, Oficina..."
            />
          </label>

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
                placeholder="Buscar por nome, categoria ou status..."
              />
            </div>
          </label>
        </div>

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

      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhum documento encontrado para esse filtro.
          </div>
        ) : null}

        {filteredDocuments.map((document) => {
          const isPdf = document.fileType?.includes("pdf");
          const isImage = document.fileType?.startsWith("image/");

          return (
            <article
              key={document.id}
              className={`rounded-3xl border p-5 shadow-sm ${getDocumentTone(document)}`}
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {document.fileDataUrl ? (
                          isImage ? (
                            <ImageIcon className="size-5 text-primary" />
                          ) : (
                            <FileCheck2 className="size-5 text-primary" />
                          )
                        ) : (
                          <FileText className="size-5 text-slate-400" />
                        )}

                        <h4 className="text-lg font-black text-slate-950">
                          {document.name}
                        </h4>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {document.category} · {document.projectName}
                      </p>
                    </div>

                    <div className={`rounded-2xl border px-3 py-2 text-xs font-black ${statusTone(document.status)}`}>
                      {document.status}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Projeto
                      </span>
                      <input
                        className="form-input mt-1"
                        value={document.projectName}
                        onChange={(event) =>
                          updateDocument(document.id, { projectName: event.target.value })
                        }
                      />
                    </label>

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
                  </div>

                  <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
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
                </div>

                <div className="rounded-3xl border border-white/70 bg-white/80 p-4 text-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Paperclip className="size-5" />
                    </span>

                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {document.fileName || "Nenhum arquivo"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatFileSize(document.fileSize)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-600">
                        {getValidityLabel(document)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                      <UploadCloud className="mr-2 size-4" />
                      Subir arquivo
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
                      disabled={!document.fileDataUrl}
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
                      Apagar documento
                    </Button>
                  </div>

                  {!isPdf && !isImage && document.fileDataUrl ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                      Este tipo de arquivo pode não abrir na prévia, mas pode ser baixado normalmente.
                    </div>
                  ) : null}
                </div>
              </div>
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
                  <div className="flex gap-3">
                    <ShieldAlert className="size-5 shrink-0" />
                    <p>
                      Prévia indisponível para este tipo de arquivo. Use o botão baixar para abrir no seu computador.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p>
            Este bloco está funcional para teste no navegador. Como arquivos em localStorage têm limite de tamanho,
            use documentos de até 4 MB por enquanto. No próximo ajuste podemos ligar estes uploads ao Supabase Storage.
          </p>
        </div>
      </div>
    </div>
  );
}
