"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Eye, ImagePlus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildSystemPdfHtml,
  defaultPdfSettings,
  getPdfSettings,
  savePdfSettings,
  resetPdfSettings,
  type SystemPdfSettings,
} from "@/lib/pdf/pdf-template";

const sampleBodyHtml = `
  <h2>Área de conteúdo do documento</h2>
  <p>
    Este espaço representa o conteúdo que será gerado por cada módulo do sistema:
    relatórios, dossiês, orçamentos, documentos financeiros, equipe, rubricas e demais exportações.
  </p>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Descrição</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>01</td>
        <td>Exemplo de conteúdo dentro do modelo padrão</td>
        <td>Ativo</td>
      </tr>
      <tr>
        <td>02</td>
        <td>Todos os PDFs devem usar este cabeçalho e rodapé</td>
        <td>Padronizado</td>
      </tr>
    </tbody>
  </table>
`;

export function PdfBrandingSettings() {
  const [settings, setSettings] = useState<SystemPdfSettings>(defaultPdfSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(getPdfSettings());
  }, []);

  const previewHtml = useMemo(() => {
    return buildSystemPdfHtml(
      {
        title: "Pré-visualização do modelo",
        subtitle: "Modelo padrão em folha A4 para exportações do sistema.",
        documentLabel: "Modelo institucional de PDF",
        preparedBy: "Eduardo",
        bodyHtml: sampleBodyHtml,
        fileName: "modelo-pdf-cia-viva.pdf",
      },
      settings,
      false,
    );
  }, [settings]);

  function updateField<K extends keyof SystemPdfSettings>(field: K, value: SystemPdfSettings[K]) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      updateField("logoDataUrl", String(reader.result ?? ""));
    };

    reader.readAsDataURL(file);
  }

  function saveSettings() {
    savePdfSettings(settings);
    setMessage("Modelo de PDF salvo neste navegador.");
  }

  function restoreDefault() {
    resetPdfSettings();
    setSettings(defaultPdfSettings);
    setMessage("Modelo restaurado para o padrão inicial.");
  }

  function clearLogo() {
    updateField("logoDataUrl", "");
    setMessage("Logo removida da pré-visualização. Clique em salvar para confirmar.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
            Modelo de PDF
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Cabeçalho, rodapé e identidade
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Edite as informações que aparecerão em todos os PDFs do sistema.
          </p>
        </div>

        {message ? (
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
            <div className="flex min-h-32 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-3">
              {settings.logoDataUrl ? (
                <img src={settings.logoDataUrl} alt="Logo do PDF" className="max-h-28 max-w-full object-contain" />
              ) : (
                <span className="text-center text-xs font-black uppercase tracking-wide text-slate-400">
                  Área da logo
                </span>
              )}
            </div>

            <div className="flex flex-col justify-center gap-3">
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600">
                <ImagePlus className="size-4" />
                Subir logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>

              {settings.logoDataUrl ? (
                <Button type="button" variant="outline" className="w-fit" onClick={clearLogo}>
                  <Trash2 className="mr-2 size-4" />
                  Remover logo
                </Button>
              ) : null}
            </div>
          </div>

          <InputLine label="Título principal">
            <input value={settings.systemTitle} onChange={(event) => updateField("systemTitle", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
          </InputLine>

          <InputLine label="Nome da companhia">
            <input value={settings.companyName} onChange={(event) => updateField("companyName", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
          </InputLine>

          <InputLine label="Subtítulo">
            <input value={settings.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
          </InputLine>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputLine label="CNPJ">
              <input value={settings.cnpj} onChange={(event) => updateField("cnpj", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" placeholder="Opcional" />
            </InputLine>

            <InputLine label="Cidade/UF">
              <input value={settings.cityUf} onChange={(event) => updateField("cityUf", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
            </InputLine>
          </div>

          <InputLine label="E-mail">
            <input value={settings.email} onChange={(event) => updateField("email", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
          </InputLine>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputLine label="Telefone">
              <input value={settings.phone} onChange={(event) => updateField("phone", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
            </InputLine>

            <InputLine label="Site">
              <input value={settings.site} onChange={(event) => updateField("site", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
            </InputLine>
          </div>

          <InputLine label="Texto do rodapé">
            <input value={settings.footerText} onChange={(event) => updateField("footerText", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
          </InputLine>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputLine label="Site no rodapé">
              <input value={settings.footerSite} onChange={(event) => updateField("footerSite", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" />
            </InputLine>

            <InputLine label="Cor principal / detalhes">
              <input type="color" value={settings.primaryColor || defaultPdfSettings.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputLine label="Cor dos títulos">
              <input type="color" value={settings.titleColor || defaultPdfSettings.titleColor} onChange={(event) => updateField("titleColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>

            <InputLine label="Cor do texto">
              <input type="color" value={settings.bodyTextColor || defaultPdfSettings.bodyTextColor} onChange={(event) => updateField("bodyTextColor", event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2" />
            </InputLine>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" onClick={saveSettings}>
              <Save className="mr-2 size-4" />
              Salvar modelo
            </Button>

            <Button type="button" variant="outline" onClick={restoreDefault}>
              <RotateCcw className="mr-2 size-4" />
              Restaurar padrão
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">
              Pré-visualização A4
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Como o PDF será gerado
            </h2>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 sm:flex">
            <Eye className="size-4" />
            Preview
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
          <iframe
            title="Pré-visualização do modelo de PDF"
            srcDoc={previewHtml}
            className="h-[780px] w-full border-0 bg-slate-100"
          />
        </div>
      </section>
    </div>
  );
}

function InputLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
