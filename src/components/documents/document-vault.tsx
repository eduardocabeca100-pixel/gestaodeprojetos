"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Download,
  FileArchive,
  FileText,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DocumentCategory =
  | "Orçamento"
  | "Documento"
  | "Nota fiscal"
  | "Contrato"
  | "Recibo"
  | "Comprovante"
  | "Relatório"
  | "Mídia"
  | "Anexo do edital"
  | "Outros";

type DocumentMeta = {
  id: string;
  projectId: string;
  name: string;
  originalName: string;
  category: DocumentCategory;
  type: string;
  size: number;
  uploadedAt: string;
  notes: string;
};

type DocumentVaultProps = {
  project: {
    id: string;
    name: string;
  };
};

const DB_NAME = "viva-document-vault-db";
const STORE_NAME = "files";
const METADATA_KEY = "viva:document-vault:metadata:v1";

const categories: DocumentCategory[] = [
  "Orçamento",
  "Documento",
  "Nota fiscal",
  "Contrato",
  "Recibo",
  "Comprovante",
  "Relatório",
  "Mídia",
  "Anexo do edital",
  "Outros",
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFileToDb(id: string, file: File) {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

async function getFileFromDb(id: string): Promise<File | null> {
  const db = await openDb();

  const file = await new Promise<File | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as File) ?? null);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return file;
}

async function deleteFileFromDb(id: string) {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

function readMetadata() {
  try {
    const saved = window.localStorage.getItem(METADATA_KEY);
    return saved ? (JSON.parse(saved) as DocumentMeta[]) : [];
  } catch {
    return [];
  }
}

function writeMetadata(items: DocumentMeta[]) {
  window.localStorage.setItem(METADATA_KEY, JSON.stringify(items));
}

export function DocumentVault({ project }: DocumentVaultProps) {
  const [items, setItems] = useState<DocumentMeta[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    category: "Documento" as DocumentCategory,
    notes: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(readMetadata());
  }, []);

  const projectItems = useMemo(() => {
    return items
      .filter((item) => item.projectId === project.id)
      .filter((item) => {
        const search = query.trim().toLowerCase();
        if (!search) return true;

        return [
          item.name,
          item.originalName,
          item.category,
          item.type,
          item.notes,
        ].some((value) => value.toLowerCase().includes(search));
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [items, project.id, query]);

  const grouped = useMemo(() => {
    return categories.map((category) => ({
      category,
      items: projectItems.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [projectItems]);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles(files);
  }

  async function uploadFiles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setMessage("Selecione pelo menos um arquivo para enviar.");
      return;
    }

    const newItems: DocumentMeta[] = [];

    for (const file of selectedFiles) {
      const id = createId("file");

      await saveFileToDb(id, file);

      newItems.push({
        id,
        projectId: project.id,
        name: draft.name || file.name,
        originalName: file.name,
        category: draft.category,
        type: file.type || "Arquivo",
        size: file.size,
        uploadedAt: new Date().toISOString(),
        notes: draft.notes,
      });
    }

    const nextItems = [...newItems, ...items];
    setItems(nextItems);
    writeMetadata(nextItems);
    setSelectedFiles([]);
    setDraft({
      name: "",
      category: "Documento",
      notes: "",
    });
    setMessage(`${newItems.length} arquivo(s) enviado(s) com sucesso.`);
  }

  async function downloadFile(item: DocumentMeta) {
    const file = await getFileFromDb(item.id);

    if (!file) {
      setMessage("Arquivo não encontrado no armazenamento local.");
      return;
    }

    const url = URL.createObjectURL(file);
    const element = document.createElement("a");

    element.href = url;
    element.download = item.originalName;
    element.click();

    URL.revokeObjectURL(url);
  }

  async function removeFile(item: DocumentMeta) {
    await deleteFileFromDb(item.id);

    const nextItems = items.filter((current) => current.id !== item.id);
    setItems(nextItems);
    writeMetadata(nextItems);
    setMessage("Arquivo removido.");
  }

  function updateMeta(id: string, field: keyof DocumentMeta, value: string) {
    const nextItems = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item,
    );

    setItems(nextItems);
    writeMetadata(nextItems);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">
            Anexos do projeto
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Documentos, notas e comprovantes
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Envie vários arquivos por projeto e classifique como orçamento, documento, nota fiscal,
            contrato, recibo, comprovante, relatório, mídia ou anexo do edital.
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <StatCard label="Arquivos" value={String(projectItems.length)} />
          <StatCard label="Categorias usadas" value={String(grouped.length)} />
          <StatCard label="Projeto" value={project.name} />
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={uploadFiles} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              Upload
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Adicionar anexos
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Você pode selecionar vários arquivos ao mesmo tempo.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
              <UploadCloud className="mb-3 size-8 text-emerald-700" />
              <span className="text-sm font-black text-slate-800">
                Selecionar arquivos
              </span>
              <span className="mt-1 text-xs text-slate-500">
                PDF, imagem, planilha, documento, recibo, nota fiscal...
              </span>
              <input type="file" multiple className="hidden" onChange={handleFiles} />
            </label>

            {selectedFiles.length ? (
              <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                {selectedFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between gap-3 py-1">
                    <span>{file.name}</span>
                    <strong>{formatBytes(file.size)}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            <InputLine label="Nome interno">
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className="vault-input"
                placeholder="Opcional. Se vazio, usa o nome do arquivo."
              />
            </InputLine>

            <InputLine label="Tipo / categoria">
              <select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value as DocumentCategory })}
                className="vault-input"
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </InputLine>

            <InputLine label="Observações">
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                className="vault-input min-h-24"
                placeholder="Ex: nota fiscal da sonorização, contrato do ator..."
              />
            </InputLine>

            <Button type="submit" className="w-full">
              <Plus className="mr-2 size-4" />
              Enviar anexo(s)
            </Button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Arquivos salvos
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Biblioteca do projeto
              </h3>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                placeholder="Buscar arquivo..."
              />
            </div>
          </div>

          {projectItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <FileArchive className="mx-auto mb-3 size-9 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">
                Nenhum anexo enviado para este projeto ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.category}>
                  <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">
                    {group.category}
                  </h4>

                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                              <FileText className="size-5" />
                            </div>

                            <div>
                              <input
                                value={item.name}
                                onChange={(event) => updateMeta(item.id, "name", event.target.value)}
                                className="w-full border-0 bg-transparent p-0 text-base font-black text-slate-950 outline-none"
                              />
                              <p className="mt-1 text-sm text-slate-500">
                                {item.originalName} • {formatBytes(item.size)} • {new Date(item.uploadedAt).toLocaleDateString("pt-BR")}
                              </p>

                              <div className="mt-3 grid gap-3 sm:grid-cols-[190px_1fr]">
                                <select
                                  value={item.category}
                                  onChange={(event) => updateMeta(item.id, "category", event.target.value)}
                                  className="vault-input"
                                >
                                  {categories.map((category) => (
                                    <option key={category}>{category}</option>
                                  ))}
                                </select>

                                <input
                                  value={item.notes}
                                  onChange={(event) => updateMeta(item.id, "notes", event.target.value)}
                                  className="vault-input"
                                  placeholder="Observações"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={() => downloadFile(item)}>
                              <Download className="mr-2 size-4" />
                              Baixar
                            </Button>
                            <Button type="button" variant="destructive" onClick={() => removeFile(item)}>
                              <Trash2 className="mr-2 size-4" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="block text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <strong className="mt-2 block text-sm font-black text-slate-950">
        {value}
      </strong>
    </div>
  );
}

function InputLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
