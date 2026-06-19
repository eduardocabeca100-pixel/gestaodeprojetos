"use client";

import { useMemo, useState } from "react";
import { Save, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CertificateSettings } from "@/modules/certificates/types";

import { CertificateLogoUpload } from "./certificate-logo-upload";
import { CertificateSignatureUpload } from "./certificate-signature-upload";
import { CertificateSponsorLogos, type SponsorLogoDraft } from "./certificate-sponsor-logos";

type SignatureDraft = {
  id: string;
  name: string;
  role: string;
  fileName: string | null;
};

export function CertificateSettingsForm({
  initialSettings,
}: {
  initialSettings: CertificateSettings;
}) {
  const [state, setState] = useState(initialSettings);
  const [mainLogoName, setMainLogoName] = useState<string | null>(null);
  const [secondaryLogoName, setSecondaryLogoName] = useState<string | null>(null);
  const [institutionLogoName, setInstitutionLogoName] = useState<string | null>(null);
  const [ciaLogoName, setCiaLogoName] = useState<string | null>(null);
  const [finalImageMeta, setFinalImageMeta] = useState<{
    fileName: string | null;
    fileType: string | null;
    fileSize: number | null;
    imageWidth: number | null;
    imageHeight: number | null;
    previewUrl: string | null;
  }>({
    fileName: null,
    fileType: null,
    fileSize: null,
    imageWidth: null,
    imageHeight: null,
    previewUrl: state.finalBackImageUrl,
  });
  const [signatures, setSignatures] = useState<SignatureDraft[]>([
    {
      id: "director",
      name: "Direção Viva",
      role: "Diretor geral",
      fileName: null,
    },
    {
      id: "executive",
      name: "Produção executiva",
      role: "Diretor executivo",
      fileName: null,
    },
    {
      id: "teacher",
      name: "Professor/formador",
      role: "Professor/formador",
      fileName: null,
    },
  ]);
  const [sponsorLogos, setSponsorLogos] = useState<SponsorLogoDraft[]>([
    {
      id: "sponsor-1",
      name: "Cia de Artes Viva",
      type: "instituição",
      size: 30,
      displayWidthMm: 36,
      maxHeightMm: 16,
      position: "centro",
      displayOrder: 1,
      showOnFront: true,
      showOnBack: true,
      isActive: true,
      fileName: null,
      fileType: null,
      fileSize: null,
      imageWidth: null,
      imageHeight: null,
      logoUrl: null,
    },
  ]);

  const previewSummary = useMemo(
    () => ({
      titleFont: state.titleFont,
      bodyFont: state.bodyFont,
      orientation: state.pageOrientation,
      borderEnabled: state.borderEnabled,
      imageEnabled: state.finalBackImageEnabled,
      footerLayout: state.footerLayout,
    }),
    [state],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="space-y-4">
        <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Identidade</p>
              <h3 className="mt-1 text-[1rem] font-semibold">Marca e fontes</h3>
            </div>
            <Button type="button" variant="outline">
              <WandSparkles className="size-4" />
              Carregar modelo
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Nome do modelo</span>
              <input className="form-input mt-1" value={state.modelName} onChange={(event) => setState((current) => ({ ...current, modelName: event.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Orientação</span>
              <select className="form-input mt-1" value={state.pageOrientation} onChange={(event) => setState((current) => ({ ...current, pageOrientation: event.target.value as CertificateSettings["pageOrientation"] }))}>
                <option value="paisagem">Paisagem</option>
                <option value="retrato">Retrato</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Fonte do título</span>
              <input className="form-input mt-1" value={state.titleFont} onChange={(event) => setState((current) => ({ ...current, titleFont: event.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Fonte do texto</span>
              <input className="form-input mt-1" value={state.bodyFont} onChange={(event) => setState((current) => ({ ...current, bodyFont: event.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Cor principal</span>
              <input className="form-input mt-1 h-12" type="color" value={state.primaryColor} onChange={(event) => setState((current) => ({ ...current, primaryColor: event.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Cor secundária</span>
              <input className="form-input mt-1 h-12" type="color" value={state.secondaryColor} onChange={(event) => setState((current) => ({ ...current, secondaryColor: event.target.value }))} />
            </label>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <CertificateLogoUpload title="Logo principal" description="Identidade central do certificado." fileName={mainLogoName} onFileChange={(file) => setMainLogoName(file?.name ?? null)} />
          <CertificateLogoUpload title="Logo secundária" description="Marca complementar." fileName={secondaryLogoName} onFileChange={(file) => setSecondaryLogoName(file?.name ?? null)} />
          <CertificateLogoUpload title="Logo institucional" description="Aplicada na instituição." fileName={institutionLogoName} onFileChange={(file) => setInstitutionLogoName(file?.name ?? null)} />
          <CertificateLogoUpload title="Logo Cia de Artes Viva" description="Aplicada no rodapé e cabeçalho." fileName={ciaLogoName} onFileChange={(file) => setCiaLogoName(file?.name ?? null)} />
        </div>

        <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Formato</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Margem superior</span>
              <input className="form-input mt-1" type="number" value={state.marginTop} onChange={(event) => setState((current) => ({ ...current, marginTop: Number(event.target.value) }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Margem inferior</span>
              <input className="form-input mt-1" type="number" value={state.marginBottom} onChange={(event) => setState((current) => ({ ...current, marginBottom: Number(event.target.value) }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Margem esquerda</span>
              <input className="form-input mt-1" type="number" value={state.marginLeft} onChange={(event) => setState((current) => ({ ...current, marginLeft: Number(event.target.value) }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Margem direita</span>
              <input className="form-input mt-1" type="number" value={state.marginRight} onChange={(event) => setState((current) => ({ ...current, marginRight: Number(event.target.value) }))} />
            </label>
            <ToggleField label="Borda ativa" checked={state.borderEnabled} onChange={(value) => setState((current) => ({ ...current, borderEnabled: value }))} />
            <ToggleField label="Imagem de fundo" checked={state.backgroundEnabled} onChange={(value) => setState((current) => ({ ...current, backgroundEnabled: value }))} />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Rodapé</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ToggleField
              label="Exibir marcas no rodapé"
              checked={state.showFooterLogos}
              onChange={(value) => setState((current) => ({ ...current, showFooterLogos: value }))}
            />
            <ToggleField
              label="Título das categorias"
              checked={state.showCategoryTitles}
              onChange={(value) => setState((current) => ({ ...current, showCategoryTitles: value }))}
            />
            <ToggleField
              label="Divisórias suaves"
              checked={state.showDividers}
              onChange={(value) => setState((current) => ({ ...current, showDividers: value }))}
            />
            <ToggleField
              label="Mesmo rodapé no verso"
              checked={state.useSameFooterOnBack}
              onChange={(value) => setState((current) => ({ ...current, useSameFooterOnBack: value }))}
            />
            <ToggleField
              label="Rodapé na frente"
              checked={state.showFooterFront}
              onChange={(value) => setState((current) => ({ ...current, showFooterFront: value }))}
            />
            <ToggleField
              label="Rodapé no verso"
              checked={state.showFooterBack}
              onChange={(value) => setState((current) => ({ ...current, showFooterBack: value }))}
            />
            <label className="block md:col-span-2">
              <span className="text-sm font-medium">Modelo do rodapé</span>
              <select
                className="form-input mt-1"
                value={state.footerLayout}
                onChange={(event) => setState((current) => ({ ...current, footerLayout: event.target.value as CertificateSettings["footerLayout"] }))}
              >
                <option value="compacto">Compacto</option>
                <option value="padrao">Padrão</option>
                <option value="expandido">Expandido</option>
                <option value="categorias">Categorias</option>
                <option value="linha_unica">Linha única</option>
                <option value="blocos">Blocos</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Altura do rodapé</span>
              <input
                className="form-input mt-1"
                type="number"
                value={state.footerHeight}
                onChange={(event) => setState((current) => ({ ...current, footerHeight: Number(event.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Tamanho das marcas</span>
              <input
                className="form-input mt-1"
                type="number"
                value={state.footerLogoSize}
                onChange={(event) => setState((current) => ({ ...current, footerLogoSize: Number(event.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Margem superior do rodapé (mm)</span>
              <input
                className="form-input mt-1"
                type="number"
                value={state.footerMarginTopMm}
                onChange={(event) => setState((current) => ({ ...current, footerMarginTopMm: Number(event.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Margem inferior do rodapé (mm)</span>
              <input
                className="form-input mt-1"
                type="number"
                value={state.footerMarginBottomMm}
                onChange={(event) => setState((current) => ({ ...current, footerMarginBottomMm: Number(event.target.value) }))}
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Frente</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ToggleField label="Mostrar CPF" checked={state.showStudentCpf} onChange={(value) => setState((current) => ({ ...current, showStudentCpf: value }))} />
            <ToggleField label="Mostrar data/cidade" checked={state.showCityDate} onChange={(value) => setState((current) => ({ ...current, showCityDate: value }))} />
            <ToggleField label="Mostrar modalidade" checked={state.showModality} onChange={(value) => setState((current) => ({ ...current, showModality: value }))} />
            <ToggleField label="Mostrar carga horária" checked={state.showWorkloadFront} onChange={(value) => setState((current) => ({ ...current, showWorkloadFront: value }))} />
          </div>
          <label className="mt-4 block">
            <span className="text-sm font-medium">Texto institucional</span>
            <textarea className="form-input mt-1 min-h-24" value={state.frontText} onChange={(event) => setState((current) => ({ ...current, frontText: event.target.value }))} />
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-medium">Texto de conclusão</span>
            <textarea className="form-input mt-1 min-h-24" value={state.conclusionText} onChange={(event) => setState((current) => ({ ...current, conclusionText: event.target.value }))} />
          </label>
        </section>

        <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Imagem final do verso</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ToggleField label="Ativar imagem final" checked={state.finalBackImageEnabled} onChange={(value) => setState((current) => ({ ...current, finalBackImageEnabled: value }))} />
            <label className="block">
              <span className="text-sm font-medium">Posição</span>
              <select className="form-input mt-1" value={state.finalBackImagePosition} onChange={(event) => setState((current) => ({ ...current, finalBackImagePosition: event.target.value as CertificateSettings["finalBackImagePosition"] }))}>
                <option value="esquerda">Esquerda</option>
                <option value="centro">Centro</option>
                <option value="direita">Direita</option>
                <option value="rodape_completo">Rodapé completo</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Largura (%)</span>
              <input className="form-input mt-1" type="number" value={state.finalBackImageWidth} onChange={(event) => setState((current) => ({ ...current, finalBackImageWidth: Number(event.target.value) }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Altura</span>
              <input className="form-input mt-1" type="number" value={state.finalBackImageHeight} onChange={(event) => setState((current) => ({ ...current, finalBackImageHeight: Number(event.target.value) }))} />
            </label>
            <ToggleField
              label="Exibir no PDF final"
              checked={state.finalBackImageShowOnPdf}
              onChange={(value) => setState((current) => ({ ...current, finalBackImageShowOnPdf: value }))}
            />
            <ToggleField
              label="Manter proporção"
              checked={state.finalBackImageKeepAspectRatio}
              onChange={(value) => setState((current) => ({ ...current, finalBackImageKeepAspectRatio: value }))}
            />
          </div>
          <CertificateLogoUpload
            title="Upload da imagem final"
            description="Imagem aplicada ao final do verso."
            fileName={finalImageMeta.fileName ?? state.finalBackImageUrl ?? null}
            onFileChange={(file) => {
              if (!file) return;
              const previewUrl = URL.createObjectURL(file);
              const image = new Image();
              image.onload = () => {
                setFinalImageMeta({
                  fileName: file.name,
                  fileType: file.type || "image",
                  fileSize: file.size,
                  imageWidth: image.naturalWidth,
                  imageHeight: image.naturalHeight,
                  previewUrl,
                });
                setState((current) => ({ ...current, finalBackImageUrl: previewUrl }));
              };
              image.src = previewUrl;
            }}
          />
          <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-border bg-muted/10 p-3 text-sm">
            <p>Formato: <span className="font-semibold">{finalImageMeta.fileType ?? "—"}</span></p>
            <p>Dimensões: <span className="font-semibold">{finalImageMeta.imageWidth && finalImageMeta.imageHeight ? `${finalImageMeta.imageWidth} x ${finalImageMeta.imageHeight} px` : "—"}</span></p>
            <p>Tamanho: <span className="font-semibold">{finalImageMeta.fileSize ? `${Math.round(finalImageMeta.fileSize / 1024)} KB` : "—"}</span></p>
            {finalImageMeta.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={finalImageMeta.previewUrl} alt="Prévia da imagem final" className="mt-2 h-28 w-full rounded-lg border border-border object-contain bg-white p-2" />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-4 soft-shadow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assinaturas</p>
              <h3 className="mt-1 text-[1rem] font-semibold">Responsáveis oficiais</h3>
            </div>
            <div className="text-xs text-muted-foreground">
              Até 3 assinaturas
            </div>
          </div>
          <div className="mt-4 grid gap-4">
            {signatures.map((signature, index) => (
              <CertificateSignatureUpload
                key={signature.id}
                title={`Assinatura ${index + 1}`}
                name={signature.name}
                role={signature.role}
                fileName={signature.fileName}
                onNameChange={(value) =>
                  setSignatures((current) => current.map((item) => (item.id === signature.id ? { ...item, name: value } : item)))
                }
                onRoleChange={(value) =>
                  setSignatures((current) => current.map((item) => (item.id === signature.id ? { ...item, role: value } : item)))
                }
                onFileChange={(file) =>
                  setSignatures((current) => current.map((item) => (item.id === signature.id ? { ...item, fileName: file?.name ?? null } : item)))
                }
              />
            ))}
          </div>
        </section>

        <CertificateSponsorLogos items={sponsorLogos} onChange={setSponsorLogos} />
      </div>

      <div className="rounded-lg border border-border bg-white p-4 soft-shadow">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resumo da configuração</p>
        <div className="mt-3 grid gap-2 text-sm">
          <p>Modelo: <span className="font-semibold">{previewSummary.titleFont}</span></p>
          <p>Texto: <span className="font-semibold">{previewSummary.bodyFont}</span></p>
          <p>Orientação: <span className="font-semibold">{previewSummary.orientation}</span></p>
          <p>Borda ativa: <span className="font-semibold">{previewSummary.borderEnabled ? "Sim" : "Não"}</span></p>
          <p>Imagem final: <span className="font-semibold">{previewSummary.imageEnabled ? "Sim" : "Não"}</span></p>
        </div>
        <div className="mt-4">
          <Button type="button">
            <Save className="size-4" />
            Salvar configurações
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={
        checked
          ? "rounded-lg border border-primary bg-primary/10 px-3 py-2 text-left text-sm font-semibold text-primary"
          : "rounded-lg border border-border bg-white px-3 py-2 text-left text-sm font-medium text-muted-foreground"
      }
      onClick={() => onChange(!checked)}
    >
      {label}
    </button>
  );
}
