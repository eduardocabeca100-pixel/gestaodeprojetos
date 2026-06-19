"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ImagePlus, MonitorCog, Palette, RotateCcw, Save, Sparkles } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import {
  applyAppearanceSettings,
  defaultAppearanceSettings,
  fileToDataUrl,
  readAppearanceSettings,
  type VivaAppearanceSettings,
  type VivaFontPreset,
  type VivaMenuDensity,
  writeAppearanceSettings,
} from "@/lib/appearance";

const fontOptions: Array<{ value: VivaFontPreset; label: string; preview: string }> = [
  { value: "arial", label: "Arial profissional", preview: "Arial / Arial Black" },
  { value: "arial-black", label: "Arial Black", preview: "Título em destaque" },
  { value: "system", label: "Sistema clean", preview: "Alternativa neutra" },
];

const densityOptions: Array<{ value: VivaMenuDensity; label: string; description: string }> = [
  { value: "compact", label: "Compacto", description: "Mais conteúdo na tela" },
  { value: "comfortable", label: "Confortável", description: "Mais respiro entre os blocos" },
];

type AppearanceLocalState = VivaAppearanceSettings;

const defaultLocalState: AppearanceLocalState = {
  ...defaultAppearanceSettings,
  showMenuIcons: true,
  showMenuLabels: true,
};

export function AppearanceSettingsWorkspace() {
  const [state, setState] = useState<AppearanceLocalState>(() => {
    if (typeof window === "undefined") {
      return defaultLocalState;
    }

    return readAppearanceSettings();
  });
  const [message, setMessage] = useState("Personalize o sistema com ajustes que já entram em vigor no painel.");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const darkLogoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      writeAppearanceSettings(state);
      applyAppearanceSettings(state);
    } catch {
      console.warn("Não foi possível persistir todas as alterações neste navegador.");
    }
  }, [state]);

  const preview = useMemo(
    () => ({
      sidebarWidth: state.sidebarWidth,
      density: state.menuDensity,
      primaryColor: state.primaryColor,
      accentColor: state.accentColor,
      fontLabel:
        fontOptions.find((option) => option.value === state.fontPreset)?.label ?? "Arial",
    }),
    [state.accentColor, state.fontPreset, state.menuDensity, state.primaryColor, state.sidebarWidth],
  );

  async function handleFileUpload(
    input: RefObject<HTMLInputElement | null>,
    key: "logoDataUrl" | "darkLogoDataUrl" | "faviconDataUrl",
  ) {
    const file = input.current?.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setState((current) => ({ ...current, [key]: dataUrl }));
      setMessage(`${file.name} aplicado com sucesso.`);
      window.dispatchEvent(new Event("viva:appearance-changed"));
    } catch {
      setMessage("Não foi possível ler o arquivo escolhido.");
    }
  }

  function resetAppearance() {
    setState(defaultLocalState);
    window.localStorage.removeItem("viva.appearance.settings");
    applyAppearanceSettings(defaultAppearanceSettings);
    window.dispatchEvent(new Event("viva:appearance-changed"));
    setMessage("Aparência restaurada para o padrão do sistema.");
  }

  function saveAppearance() {
    try {
      writeAppearanceSettings(state);
      applyAppearanceSettings(state);
      window.dispatchEvent(new Event("viva:appearance-changed"));
      setMessage("Aparência aplicada e salva localmente neste navegador.");
    } catch {
      setMessage("Não foi possível salvar a aparência neste navegador.");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]" suppressHydrationWarning>
      <SectionCard
        title="Aparência"
        description="Ajuste identidade visual, densidade e elementos do menu."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" type="button" variant="outline" onClick={resetAppearance}>
              <RotateCcw className="size-4" />
              Restaurar
            </Button>
            <Button size="sm" type="button" onClick={saveAppearance}>
              <Save className="size-4" />
              Salvar
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-[0.9rem] font-medium">
              <Palette className="size-4 text-primary" />
              Modelo de fonte
            </span>
            <select
              className="form-input"
              value={state.fontPreset}
              onChange={(event) =>
                setState((current) => ({ ...current, fontPreset: event.target.value as VivaFontPreset }))
              }
            >
              {fontOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {fontOptions.find((option) => option.value === state.fontPreset)?.preview}
            </p>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-[0.9rem] font-medium">
              <MonitorCog className="size-4 text-primary" />
              Densidade do menu
            </span>
            <select
              className="form-input"
              value={state.menuDensity}
              onChange={(event) =>
                setState((current) => ({ ...current, menuDensity: event.target.value as VivaMenuDensity }))
              }
            >
              {densityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {densityOptions.find((option) => option.value === state.menuDensity)?.description}
            </p>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-[0.9rem] font-medium">Cor principal</span>
            <input
              className="h-[var(--viva-input-height)] w-full rounded-lg border border-input bg-white p-1"
              type="color"
              value={state.primaryColor}
              onChange={(event) => setState((current) => ({ ...current, primaryColor: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-[0.9rem] font-medium">Cor de destaque</span>
            <input
              className="h-[var(--viva-input-height)] w-full rounded-lg border border-input bg-white p-1"
              type="color"
              value={state.accentColor}
              onChange={(event) => setState((current) => ({ ...current, accentColor: event.target.value }))}
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-1.5 flex items-center gap-2 text-[0.9rem] font-medium">
              Largura da sidebar
            </span>
            <input
              className="w-full"
              type="range"
              min="228"
              max="280"
              step="2"
              value={state.sidebarWidth}
              onChange={(event) =>
                setState((current) => ({ ...current, sidebarWidth: Number(event.target.value) }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {state.sidebarWidth}px
            </p>
          </label>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
            <label className="block rounded-lg border border-dashed border-border bg-muted/20 p-3">
              <span className="mb-2 flex items-center gap-2 text-[0.9rem] font-medium">
                <ImagePlus className="size-4 text-primary" />
                Logo principal
              </span>
              {state.logoDataUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Prévia da logo principal"
                    className="mb-2 h-16 w-full rounded-md border border-border bg-white p-2 object-contain"
                    src={state.logoDataUrl}
                  />
                </>
              ) : null}
              <input
                ref={logoInputRef}
                className="hidden"
                type="file"
                accept="image/*,.svg"
                onChange={() => void handleFileUpload(logoInputRef, "logoDataUrl")}
              />
              <Button size="sm" type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                Escolher arquivo
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">Usada como identidade principal no painel.</p>
            </label>

            <label className="block rounded-lg border border-dashed border-border bg-muted/20 p-3">
              <span className="mb-2 flex items-center gap-2 text-[0.9rem] font-medium">
                <ImagePlus className="size-4 text-primary" />
                Logo escura
              </span>
              {state.darkLogoDataUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Prévia da logo para fundo escuro"
                    className="mb-2 h-16 w-full rounded-md border border-border bg-slate-950 p-2 object-contain"
                    src={state.darkLogoDataUrl}
                  />
                </>
              ) : null}
              <input
                ref={darkLogoInputRef}
                className="hidden"
                type="file"
                accept="image/*,.svg"
                onChange={() => void handleFileUpload(darkLogoInputRef, "darkLogoDataUrl")}
              />
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => darkLogoInputRef.current?.click()}
              >
                Escolher arquivo
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">Aplicável em fundos escuros e documentos.</p>
            </label>

            <label className="block rounded-lg border border-dashed border-border bg-muted/20 p-3 lg:col-span-2">
              <span className="mb-2 flex items-center gap-2 text-[0.9rem] font-medium">
                <Sparkles className="size-4 text-primary" />
                Favicon
              </span>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                  {state.faviconDataUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Prévia do favicon"
                        className="size-full object-contain p-1"
                        src={state.faviconDataUrl}
                      />
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">V</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">A guia do navegador é atualizada no navegador atual.</span>
              </div>
              <input
                ref={faviconInputRef}
                className="hidden"
                type="file"
                accept="image/*,.svg,.png,.jpg,.jpeg"
                onChange={() => void handleFileUpload(faviconInputRef, "faviconDataUrl")}
              />
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => faviconInputRef.current?.click()}
              >
                Escolher arquivo
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Atualiza a guia do navegador imediatamente após salvar.
              </p>
            </label>
          </div>

          <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={state.showMenuIcons}
                onChange={(event) => setState((current) => ({ ...current, showMenuIcons: event.target.checked }))}
              />
              <span className="text-sm font-medium">Mostrar ícones do menu</span>
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={state.showMenuLabels}
                onChange={(event) => setState((current) => ({ ...current, showMenuLabels: event.target.checked }))}
              />
              <span className="text-sm font-medium">Mostrar rótulos completos</span>
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {message}
        </div>
      </SectionCard>

      <div className="space-y-4">
        <SectionCard title="Prévia" description="Veja a densidade aplicada ao sistema antes de salvar.">
          <div
            className="rounded-lg border border-border bg-background p-3"
            style={{
              boxShadow: "0 12px 40px -28px rgba(0,0,0,0.45)",
            }}
          >
            <div
              className="rounded-xl border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground"
              style={{ width: preview.sidebarWidth }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-black leading-none">VIVA</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/65">
                    Gestão Cultural
                  </p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: preview.primaryColor }}>
                  {preview.fontLabel}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="rounded-lg px-2.5 py-2 text-[12px] font-semibold" style={{ backgroundColor: preview.primaryColor, color: "white" }}>
                  Novo Projeto
                </div>
                <div className="rounded-lg border border-sidebar-border px-2.5 py-1.5 text-[12px] font-semibold">
                  Dashboard
                </div>
                <div className="rounded-lg border border-sidebar-border px-2.5 py-1.5 text-[12px] font-semibold">
                  Configurações
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-white p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Interface base</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Cor principal</p>
                  <p className="mt-1 font-semibold">{preview.primaryColor}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Cor destaque</p>
                  <p className="mt-1 font-semibold">{preview.accentColor}</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Estado salvo" description="Configuração persistente no navegador.">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Fonte: <span className="font-semibold text-foreground">{preview.fontLabel}</span>
            </p>
            <p>
              Sidebar: <span className="font-semibold text-foreground">{preview.sidebarWidth}px</span>
            </p>
            <p>
              Densidade: <span className="font-semibold text-foreground">{state.menuDensity === "compact" ? "Compacta" : "Confortável"}</span>
            </p>
            <p>
              Menu: <span className="font-semibold text-foreground">{state.showMenuIcons ? "ícones ativos" : "ícones ocultos"}</span>
              {" / "}
              <span className="font-semibold text-foreground">{state.showMenuLabels ? "rótulos completos" : "rótulos reduzidos"}</span>
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
