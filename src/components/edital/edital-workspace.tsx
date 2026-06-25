"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileUp, Paperclip, Plus, Save, Trash2 } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";
import { deleteEditalAttachment, saveEditalAttachment } from "@/modules/edital/actions";
import {
  editalAttachmentKinds,
  editalAttachmentStatuses,
  normalizeEditalAttachmentKind,
  type EditalAttachment,
} from "@/modules/edital/types";

function getCounts(items: EditalAttachment[]) {
  return {
    received: items.filter((item) => item.status === "Recebido" || item.status === "Publicado").length,
    archived: items.filter((item) => item.status === "Arquivado").length,
    pending: items.filter((item) => item.status === "Pendente").length,
  };
}

type AttachmentDraft = {
  kind: string;
  title: string;
  fileName: string;
  uploadedBy: string;
  notes: string;
  status: EditalAttachment["status"];
};

function getEmptyDraft(): AttachmentDraft {
  return {
    kind: "Edital principal",
    title: "",
    fileName: "",
    uploadedBy: "",
    notes: "",
    status: "Pendente",
  };
}

function getDraftFromAttachment(item?: EditalAttachment | null): AttachmentDraft {
  return {
    kind: item?.kind ?? "Edital principal",
    title: item?.title ?? "",
    fileName: item?.fileName ?? "",
    uploadedBy: item?.uploadedBy ?? "",
    notes: item?.notes ?? "",
    status: item?.status ?? "Pendente",
  };
}

export function EditalWorkspace({
  project,
  attachments,
}: {
  project: Project;
  attachments: EditalAttachment[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(attachments);
  const [selectedId, setSelectedId] = useState(attachments[0]?.id ?? "");
  const [draft, setDraft] = useState<AttachmentDraft>(() =>
    getDraftFromAttachment(attachments[0]),
  );
  const [notice, setNotice] = useState("Arquivo do edital pronto para organização.");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setItems(attachments);
    setSelectedId((currentSelectedId) => {
      if (attachments.some((attachment) => attachment.id === currentSelectedId)) {
        return currentSelectedId;
      }

      return attachments[0]?.id ?? "";
    });
  }, [attachments]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );
  const counts = getCounts(items);
  const isBusy = isSaving || busyId !== null;

  useEffect(() => {
    setDraft(getDraftFromAttachment(selected));
  }, [selected]);

  function beginNewAttachment() {
    setSelectedId("");
    setDraft(getEmptyDraft());
    setNotice("Preencha os dados e clique em Salvar para gravar um novo arquivo no banco.");
  }

  async function saveAttachment() {
    if (!draft.title.trim()) {
      setNotice("Digite um título para o anexo.");
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("id", selected?.id ?? "");
    formData.set("kind", normalizeEditalAttachmentKind(draft.kind.trim()));
    formData.set("title", draft.title.trim());
    formData.set("fileName", draft.fileName.trim());
    formData.set("notes", draft.notes.trim());
    formData.set("status", draft.status);

    const result = await saveEditalAttachment(formData);

    setIsSaving(false);

    if (!result.ok || !result.attachment) {
      setNotice(result.message);
      return;
    }

    const savedAttachment = result.attachment;

    setItems((current) => {
      const alreadyExists = current.some((item) => item.id === savedAttachment.id);

      if (alreadyExists) {
        return current.map((item) =>
          item.id === savedAttachment.id ? savedAttachment : item,
        );
      }

      return [savedAttachment, ...current];
    });

    setSelectedId(savedAttachment.id);
    setDraft(getDraftFromAttachment(savedAttachment));
    setNotice(result.message);
    router.refresh();
  }

  async function removeAttachment(id: string) {
    const itemToRemove = items.find((item) => item.id === id);

    if (!itemToRemove) {
      return;
    }

    const previousItems = items;
    const nextItems = items.filter((item) => item.id !== id);

    setBusyId(id);
    setItems(nextItems);

    if (selectedId === id) {
      setSelectedId(nextItems[0]?.id ?? "");
    }

    const result = await deleteEditalAttachment(id, project.id);

    setBusyId(null);

    if (!result.ok) {
      setItems(previousItems);
      setSelectedId(id);
      setNotice(result.message);
      return;
    }

    setNotice(result.message);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <InfoCard title="Arquivos recebidos" value={String(counts.received)} />
        <InfoCard title="Pendências" value={String(counts.pending)} />
        <InfoCard title="Arquivados" value={String(counts.archived)} />
        <InfoCard title="Projeto" value={project.name} />
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Arquivos do edital"
          description="Aqui ficam o edital principal e todos os anexos, respostas, ofícios e documentos complementares."
          actions={
            <Button type="button" variant="outline" onClick={beginNewAttachment} disabled={isBusy}>
              <Plus className="size-4" />
              Novo arquivo
            </Button>
          }
        >
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              Nenhum arquivo cadastrado para este projeto. Clique em Novo arquivo para adicionar.
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {items.map((attachment) => {
                const active = attachment.id === selected?.id;

                return (
                  <article
                    key={attachment.id}
                    role="button"
                    tabIndex={0}
                    className={
                      active
                        ? "rounded-lg border border-primary bg-primary/10 p-4 text-left"
                        : "rounded-lg border border-border bg-white p-4 text-left transition hover:border-primary"
                    }
                    onClick={() => {
                      setSelectedId(attachment.id);
                      setDraft(getDraftFromAttachment(attachment));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(attachment.id);
                        setDraft(getDraftFromAttachment(attachment));
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-primary">
                          {attachment.kind}
                        </p>
                        <h3 className="mt-1 font-semibold">{attachment.title}</h3>
                      </div>
                      <Paperclip className="size-4 text-primary" />
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">{attachment.fileName}</p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {attachment.uploadedAt} - {attachment.uploadedBy}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        disabled={isBusy}
                        onClick={(event) => {
                          event.stopPropagation();
                          setNotice(`Visualizando ${attachment.title}.`);
                        }}
                      >
                        <Eye className="size-3.5" />
                        Visualizar
                      </Button>

                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        disabled={isBusy}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(attachment.id);
                          setDraft(getDraftFromAttachment(attachment));
                          setNotice(`Edição aberta para ${attachment.title}.`);
                        }}
                      >
                        Editar
                      </Button>

                      <Button
                        size="sm"
                        type="button"
                        variant="destructive"
                        disabled={isBusy}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeAttachment(attachment.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        {busyId === attachment.id ? "Excluindo..." : "Excluir"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={selected ? "Editar documento" : "Adicionar documento"}
          description="Envie PDFs, imagens ou arquivos de apoio do edital."
          actions={
            <Button type="button" onClick={saveAttachment} disabled={isBusy}>
              <FileUp className="size-4" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          }
        >
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Tipo do arquivo</span>
              <input
                className="form-input mt-1"
                list="edital-types"
                value={draft.kind}
                disabled={isBusy}
                onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value }))}
                placeholder="Digite ou escolha um tipo de arquivo"
              />

              <datalist id="edital-types">
                {editalAttachmentKinds.map((kind) => (
                  <option key={kind} value={kind} />
                ))}
              </datalist>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Título</span>
              <input
                className="form-input mt-1"
                value={draft.title}
                disabled={isBusy}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex.: Circuito Catarinense de Cultura"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Arquivo</span>
              <input
                className="form-input mt-1"
                type="file"
                disabled={isBusy}
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    setDraft((current) => ({ ...current, fileName: file.name }));
                  }
                }}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Nome do arquivo</span>
              <input
                className="form-input mt-1"
                value={draft.fileName}
                disabled={isBusy}
                onChange={(event) => setDraft((current) => ({ ...current, fileName: event.target.value }))}
                placeholder="ex.: edital-principal.pdf"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Status</span>
              <select
                className="form-input mt-1"
                value={draft.status}
                disabled={isBusy}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as EditalAttachment["status"],
                  }))
                }
              >
                {editalAttachmentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Observações</span>
              <textarea
                className="form-input mt-1 min-h-28"
                value={draft.notes}
                disabled={isBusy}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Ex.: edital principal, versão enviada, retificação, parecer, ofício..."
              />
            </label>

            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {notice}
            </div>

            <Button type="button" className="w-full" onClick={saveAttachment} disabled={isBusy}>
              <Save className="size-4" />
              {isSaving ? "Salvando no banco..." : selected ? "Salvar alterações" : "Salvar novo arquivo"}
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 soft-shadow">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
