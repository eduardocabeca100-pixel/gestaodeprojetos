"use client";

import { useMemo, useState } from "react";
import { Eye, FileUp, Paperclip, Plus, Save, Trash2 } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";
import {
  editalAttachmentKinds,
  type EditalAttachment,
  type EditalAttachmentKind,
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

function normalizeAttachmentKind(kind: string): EditalAttachmentKind {
  return editalAttachmentKinds.includes(kind as EditalAttachmentKind)
    ? (kind as EditalAttachmentKind)
    : "Outros";
}

function getDraftFromAttachment(item?: EditalAttachment | null): AttachmentDraft {
  return {
    kind: item?.kind ?? "Edital principal",
    title: item?.title ?? "",
    fileName: item?.fileName ?? "",
    uploadedBy: item?.uploadedBy ?? "Direção executiva",
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
  const [items, setItems] = useState(attachments);
  const [selectedId, setSelectedId] = useState(attachments[0]?.id ?? "");
  const [draft, setDraft] = useState<AttachmentDraft>(() =>
    getDraftFromAttachment(attachments[0]),
  );
  const [notice, setNotice] = useState("Arquivo do edital pronto para organização.");

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );
  const counts = getCounts(items);

  function saveAttachment() {
    if (!draft.title.trim()) {
      setNotice("Digite um título para o anexo.");
      return;
    }

    if (selected) {
      setItems((current) =>
        current.map((item) =>
          item.id === selected.id
              ? {
                ...item,
                kind: normalizeAttachmentKind(draft.kind.trim()),
                title: draft.title.trim(),
                fileName: draft.fileName.trim() || item.fileName,
                uploadedBy: draft.uploadedBy.trim(),
                notes: draft.notes.trim(),
                status: draft.status,
              }
            : item,
        ),
      );
      setNotice(`Anexo ${selected.title} atualizado localmente.`);
      setDraft(getDraftFromAttachment(selected));
      return;
    }

    const next: EditalAttachment = {
      id: `attachment-${Date.now()}`,
      projectId: project.id,
      kind: normalizeAttachmentKind(draft.kind.trim()),
      title: draft.title.trim(),
      fileName: draft.fileName.trim() || `${draft.title.trim()}.pdf`,
      uploadedBy: draft.uploadedBy.trim(),
      uploadedAt: new Date().toLocaleDateString("pt-BR"),
      notes: draft.notes.trim(),
      status: draft.status,
    };

    setItems((current) => [next, ...current]);
    setSelectedId(next.id);
    setDraft(getDraftFromAttachment(next));
    setNotice("Novo anexo preparado para salvar.");
  }

  function removeAttachment(id: string) {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? "");
    }
    setNotice("Anexo removido da lista local.");
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
            <Button type="button" variant="outline" onClick={() => setNotice("Lista pronta para nova inclusão.")}>
              <Plus className="size-4" />
              Novo arquivo
            </Button>
          }
        >
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
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(attachment.id);
                        setDraft(getDraftFromAttachment(attachment));
                        setNotice(`Edição local aberta para ${attachment.title}.`);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      variant="destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeAttachment(attachment.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      Excluir
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Adicionar documento"
          description="Envie PDFs, imagens ou arquivos de apoio do edital."
          actions={
            <Button type="button" onClick={saveAttachment}>
              <FileUp className="size-4" />
              Salvar
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
                onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value }))}
                placeholder="Digite ou escolha um tipo de arquivo"
              />
              <datalist id="edital-types">
                <option value="Edital principal" />
                <option value="Anexo do edital" />
                <option value="Habilitação" />
                <option value="Complementar" />
                <option value="Autorização" />
                <option value="Ofício" />
                <option value="Resposta" />
                <option value="Retificação" />
                <option value="Outros" />
              </datalist>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Título</span>
              <input
                className="form-input mt-1"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex.: Circuito Catarinense de Cultura"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Arquivo</span>
              <input
                className="form-input mt-1"
                type="file"
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
                onChange={(event) => setDraft((current) => ({ ...current, fileName: event.target.value }))}
                placeholder="ex.: edital-principal.pdf"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Observações</span>
              <textarea
                className="form-input mt-1 min-h-28"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Ex.: edital principal, versão enviada, retificação, parecer, ofício..."
              />
            </label>
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {notice}
            </div>
            <Button type="button" className="w-full" onClick={() => setNotice("Arquivo validado para envio ao Supabase.")}>
              <Save className="size-4" />
              Preparar upload
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
