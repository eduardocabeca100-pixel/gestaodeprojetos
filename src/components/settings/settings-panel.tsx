"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSignature,
  LinkIcon,
  LockKeyhole,
  RotateCcw,
  Save,
  UploadCloud,
} from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth/permissions";
import { useClientReady } from "@/lib/use-client-ready";
import { getPdfSettings, savePdfSettings } from "@/lib/pdf/pdf-template";
import type { SettingsSection } from "@/modules/settings/types";

const settingsStorageKey = "viva:settings:sections:v2";

type StoredSettings = Record<string, Record<string, string>>;

function fieldKey(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readSettings(): StoredSettings {
  if (typeof window === "undefined") return {};

  try {
    const saved = window.localStorage.getItem(settingsStorageKey);
    return saved ? (JSON.parse(saved) as StoredSettings) : {};
  } catch {
    return {};
  }
}

function writeSettings(settings: StoredSettings) {
  window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  window.dispatchEvent(new Event("viva:settings-updated"));
  window.dispatchEvent(new Event("storage"));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadSettingsBackup(settings: StoredSettings) {
  const blob = new Blob([JSON.stringify(settings, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `configuracoes-viva-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
}


function syncGeneralSettingsToPdf(draft: Record<string, string>) {
  const city = draft["cidade"] ?? "";
  const state = draft["estado"] ?? "";
  const cityUf = [city, state].filter(Boolean).join(" | ");
  const currentPdfSettings = getPdfSettings();
  const logoDataUrl =
    draft["logo-dos-documentos-oficiais"] ||
    draft["logo-principal-do-sistema"] ||
    currentPdfSettings.logoDataUrl;
  const companyName = draft["nome-da-instituicao"] || currentPdfSettings.companyName;
  const site = draft["site"] || currentPdfSettings.site;

  savePdfSettings({
    ...currentPdfSettings,
    logoDataUrl,
    systemTitle: draft["nome-do-sistema"] || currentPdfSettings.systemTitle,
    companyName,
    cnpj: draft["cnpj"] || currentPdfSettings.cnpj,
    cityUf: cityUf || currentPdfSettings.cityUf,
    email: draft["e-mail-institucional"] || currentPdfSettings.email,
    phone: draft["whatsapp"] || currentPdfSettings.phone,
    site,
    footerText:
      draft["rodape-padrao-dos-relatorios"] ||
      `${companyName} - Gestão Cultural`,
    footerSite: site ? site.toUpperCase() : currentPdfSettings.footerSite,
  });
}

function buildDraft(section: SettingsSection, saved: StoredSettings) {
  const currentSection = saved[section.id] ?? {};
  const initialDraft: Record<string, string> = {};

  for (const field of section.fields) {
    const key = fieldKey(field.label);
    initialDraft[key] = currentSection[key] ?? field.value ?? "";
  }

  return initialDraft;
}

export function SettingsPanel({
  section,
  role,
}: {
  section: SettingsSection;
  role: Role;
}) {
  const isClient = useClientReady();

  if (!isClient) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Carregando configurações...
      </div>
    );
  }

  return <SettingsPanelContent key={section.id} section={section} role={role} />;
}

function SettingsPanelContent({
  section,
  role,
}: {
  section: SettingsSection;
  role: Role;
}) {
  const isAdminLike = role === "admin" || role === "super_admin";
  const initialSettings = useMemo(() => readSettings(), []);
  const [allSettings, setAllSettings] = useState<StoredSettings>(initialSettings);
  const [draft, setDraft] = useState<Record<string, string>>(() => buildDraft(section, initialSettings));
  const [feedback, setFeedback] = useState("Configurações carregadas.");

  const savedCount = useMemo(
    () => Object.values(draft).filter(Boolean).length,
    [draft],
  );

  function setValue(label: string, value: string) {
    setDraft((current) => ({
      ...current,
      [fieldKey(label)]: value,
    }));
  }

  async function handleFile(label: string, file: File | null) {
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setFeedback("Arquivo muito grande. Use imagem/PDF de até 3 MB para configuração local.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setValue(label, dataUrl);
    setFeedback(`${label} carregado. Clique em Salvar para gravar.`);
  }

  function save() {
    const next = {
      ...readSettings(),
      [section.id]: draft,
    };

    setAllSettings(next);
    writeSettings(next);

    if (section.id === "geral") {
      syncGeneralSettingsToPdf(draft);
      setFeedback("Configurações gerais salvas e aplicadas automaticamente ao modelo de PDF.");
      return;
    }

    setFeedback(`Configurações de ${section.title} salvas e atualizadas.`);
  }

  function resetSection() {
    if (!window.confirm(`Restaurar os campos de "${section.title}" para o padrão?`)) return;

    const next = {
      ...readSettings(),
      [section.id]: {},
    };

    setAllSettings(next);
    writeSettings(next);
    setDraft(buildDraft(section, next));
    setFeedback(`Campos de ${section.title} restaurados.`);
  }

  function markIntegration(service: string) {
    const now = new Date().toLocaleString("pt-BR");
    const nextDraft = {
      ...draft,
      [fieldKey(service)]: `Solicitado em ${now}`,
    };

    setDraft(nextDraft);
    const next = {
      ...readSettings(),
      [section.id]: nextDraft,
    };

    setAllSettings(next);
    writeSettings(next);
    setFeedback(`${service}: solicitação registrada. A conexão real depende da API/OAuth.`);
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={section.title}
        description={section.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => downloadSettingsBackup(allSettings)}
            >
              <Download className="size-4" />
              Backup JSON
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={resetSection}
            >
              <RotateCcw className="size-4" />
              Restaurar
            </Button>
            <Button size="sm" type="button" onClick={save}>
              <Save className="size-4" />
              Salvar alterações
            </Button>
          </div>
        }
      >
        <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="size-4" />
            {savedCount} campo(s) preenchido(s) nesta seção.
          </div>
          <p className="mt-1">
            Agora os campos são gravados localmente e recarregam junto com a seção. Depois podemos mover esse salvamento para o Supabase.
          </p>
        </div>

        {section.id === "integracoes" ? (
          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Button type="button" variant="outline" onClick={() => markIntegration("Google Drive")}>
              <LinkIcon className="size-4" />
              Conectar Drive
            </Button>
            <Button type="button" variant="outline" onClick={() => markIntegration("Google Sheets")}>
              <LinkIcon className="size-4" />
              Conectar Sheets
            </Button>
            <Button type="button" variant="outline" onClick={() => markIntegration("Google Calendar")}>
              <LinkIcon className="size-4" />
              Conectar Calendar
            </Button>
            <Button type="button" variant="outline" onClick={() => markIntegration("E-mail para notificações")}>
              <LinkIcon className="size-4" />
              Ativar e-mail
            </Button>
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-2">
          {section.fields.map((field) => {
            const locked = !isAdminLike && field.lockedForDirector;
            const key = fieldKey(field.label);
            const value = draft[key] ?? "";

            return (
              <label key={field.label} className="block">
                <span className="mb-1 flex items-center gap-2 text-[0.9rem] font-medium">
                  {field.label}
                  {locked ? <LockKeyhole className="size-3.5 text-amber-600" /> : null}
                </span>

                {field.type === "textarea" ? (
                  <textarea
                    className="form-input min-h-28"
                    value={value}
                    disabled={locked}
                    onChange={(event) => setValue(field.label, event.target.value)}
                  />
                ) : field.type === "toggle" ? (
                  <select
                    className="form-input"
                    value={value || "false"}
                    disabled={locked}
                    onChange={(event) => setValue(field.label, event.target.value)}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                ) : field.type === "color" ? (
                  <input
                    className="h-10 w-full rounded-lg border border-input bg-white px-2 py-1"
                    type="color"
                    value={value || "#7c3aed"}
                    disabled={locked}
                    onChange={(event) => setValue(field.label, event.target.value)}
                  />
                ) : field.type === "file" ? (
                  <div className="rounded-lg border border-dashed border-border bg-white p-3">
                    <input
                      className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                      type="file"
                      accept="image/*,.svg,.pdf"
                      disabled={locked}
                      onChange={(event) => void handleFile(field.label, event.target.files?.[0] ?? null)}
                    />
                    {value ? (
                      <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                        Arquivo carregado e salvo no campo.
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        PNG, SVG, JPG ou PDF. Ideal para logos e assinaturas.
                      </p>
                    )}
                  </div>
                ) : field.type === "password" ? (
                  <input
                    className="form-input"
                    type="password"
                    value={value}
                    disabled={locked}
                    onChange={(event) => setValue(field.label, event.target.value)}
                  />
                ) : (
                  <input
                    className="form-input"
                    type={field.type === "number" ? "number" : "text"}
                    value={value}
                    disabled={locked}
                    onChange={(event) => setValue(field.label, event.target.value)}
                  />
                )}
              </label>
            );
          })}
        </div>

        {section.id === "relatorios" || section.id === "geral" ? (
          <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-black text-slate-950">
              <FileSignature className="size-4 text-primary" />
              Assinaturas automáticas
            </div>
            <p className="mt-1 leading-6">
              Suba as assinaturas nas configurações. No próximo bloco, os PDFs podem buscar essas assinaturas automaticamente.
            </p>
          </div>
        ) : null}

        {section.id === "integracoes" ? (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <div className="flex items-center gap-2 font-black">
              <UploadCloud className="size-4" />
              Integrações preparadas
            </div>
            <p className="mt-1 leading-6">
              Os botões acima registram a intenção e os dados de conexão. A conexão real com Google Drive, Calendar e Sheets exige OAuth/API e será feita em um bloco próprio.
            </p>
          </div>
        ) : null}

        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {feedback}
        </div>
      </SectionCard>
    </div>
  );
}
