import { forwardRef, useMemo, type ReactNode, type RefObject } from "react";
import { format } from "date-fns";
import { FileText, Stamp } from "lucide-react";

import type { Project } from "@/modules/projects/types";
import type {
  CertificateRecord,
  CertificateSettings,
  CertificateSponsorLogo,
  CertificateTemplate,
} from "@/modules/certificates/types";

export function CertificateTemplatePreview({
  project,
  template,
  record,
  settings,
  sponsorLogos = [],
  frontRef,
  backRef,
}: {
  project: Project;
  template: CertificateTemplate;
  record: CertificateRecord;
  settings: CertificateSettings;
  sponsorLogos?: CertificateSponsorLogo[];
  frontRef?: RefObject<HTMLElement | null>;
  backRef?: RefObject<HTMLElement | null>;
}) {
  const issueDate = record.issueDate ? format(new Date(record.issueDate), "dd/MM/yyyy") : "Sem data";
  const footerLogoSize = Math.max(24, Math.min(settings.footerLogoSize || 32, 64));
  const groupedLogos = useMemo(
    () =>
      sponsorLogos
        .filter((logo) => logo.isActive)
        .filter((logo) => logo.showOnFront || logo.showOnBack)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .reduce<Record<string, CertificateSponsorLogo[]>>((acc, logo) => {
          acc[logo.type] = acc[logo.type] ? [...acc[logo.type], logo] : [logo];
          return acc;
        }, {}),
    [sponsorLogos],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <PreviewSheet ref={frontRef} title="Frente" accent={template.primaryColor}>
        <div className="flex h-full flex-col rounded-[1.25rem] border border-[#d2b46f] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,243,233,0.96))] p-6">
          <div className="rounded-[1.2rem] bg-[linear-gradient(135deg,#0b4a33,#155c40_58%,#0b3f2c)] px-5 py-4 text-[#f5e7bf] shadow-[0_8px_24px_rgba(11,74,51,0.18)]">
            <div className="flex items-center justify-between gap-4">
              <div className="max-w-[60%]">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#e7d4a0]">CIA DE ARTES VIVA</p>
                <h3 className="mt-1 text-sm font-medium uppercase tracking-[0.28em] text-[#f1e0aa]">{project.name}</h3>
              </div>
              <div className="rounded-2xl border border-[#d7bd78]/50 bg-white/10 px-3 py-2 text-right backdrop-blur">
                <p className="text-[9px] uppercase tracking-[0.28em] text-[#e7d4a0]">Registro</p>
                <p className="mt-1 text-sm font-semibold text-white">{record.certificateNumber}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
            <div className="h-px w-24 bg-[#d2b46f]" />
            <p className="mt-4 text-[11px] uppercase tracking-[0.4em] text-[#7c6530]">CERTIFICADO</p>
            <h4 className="mt-4 max-w-xl text-[2.2rem] font-semibold leading-none text-[#174a2d] md:text-[2.5rem]">
              {record.studentName}
            </h4>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4d4a3f]">{template.frontText}</p>

            <div className="mt-6 grid w-full max-w-xl gap-3 sm:grid-cols-2">
              <MiniField label="Projeto" value={project.name} />
              <MiniField label="Curso/Formação" value={record.courseName} />
              <MiniField label="Modalidade" value={record.modality} />
              <MiniField label="Carga horária" value={record.workload} />
              <MiniField label="CPF" value={record.studentDocument || "—"} />
              <MiniField label="Cidade / data" value={`${project.city} • ${issueDate}`} />
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-3 border-t border-[#d2b46f] pt-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#7c6530]">{settings.logoCiaUrl ? "Logo institucional" : "Identidade institucional"}</p>
              <p className="mt-1 text-sm font-semibold text-[#174a2d]">{project.city}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#174a2d]">{issueDate}</p>
              <p className="mt-1 text-xs text-[#7c6530]">Cidade de emissão</p>
            </div>
          </div>

          {settings.showFooterFront && settings.showFooterLogos && Object.keys(groupedLogos).length > 0 ? (
            <div className="mt-5 space-y-3 border-t border-[#e1cf96] pt-4">
              <FooterGroups
                groupedLogos={groupedLogos}
                footerLogoSize={footerLogoSize}
                layout={settings.footerLayout}
                showCategoryTitles={settings.showCategoryTitles}
                showDividers={settings.showDividers}
                logoSpacing={settings.logoSpacing}
                footerMarginTopMm={settings.footerMarginTopMm}
                footerMarginBottomMm={settings.footerMarginBottomMm}
                placement="front"
              />
            </div>
          ) : null}
        </div>
      </PreviewSheet>

      <PreviewSheet ref={backRef} title="Verso" accent={template.secondaryColor}>
        <div className="flex h-full flex-col rounded-[1.25rem] border border-[#d2b46f] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,243,233,0.96))] p-6">
          <div className="flex items-center justify-between gap-4 border-b border-[#d7bd78] pb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#7c6530]">CONTEÚDO PROGRAMÁTICO</p>
              <h3 className="mt-1 text-lg font-semibold text-[#174a2d]">{template.backTitle}</h3>
            </div>
            <div className="rounded-2xl border border-[#d7bd78] bg-white px-3 py-2 text-xs text-[#7c6530]">
              A4 paisagem
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.5fr_0.9fr]">
            <div className="rounded-2xl border border-[#d7bd78] bg-white p-4 shadow-[0_4px_14px_rgba(11,74,51,0.06)]">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7c6530]">
                <FileText className="size-4" />
                Programação
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#2f2d24]">
                {template.programContent}
              </p>
            </div>

            <div className="space-y-3">
              <MetricPill label="Carga horária total" value={record.workload} />
              <MetricPill label="Professor/formador" value={record.modality === "Oficina" ? "Professor responsável" : "Formador responsável"} />
              <MetricPill label="Código" value={record.certificateNumber} />
              <MetricPill label="Livro / folhas" value={settings.bookLabel} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <SignatureBlock title="Direção geral" subtitle="Assinatura oficial" />
            <SignatureBlock title="Direção executiva" subtitle="Assinatura oficial" />
            <SignatureBlock title="Professor/formador" subtitle="Assinatura oficial" />
          </div>

          {settings.showFooterBack && settings.showFooterLogos && Object.keys(groupedLogos).length > 0 ? (
            <div className="mt-6 rounded-2xl border border-[#d7bd78] bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7c6530]">
                <Stamp className="size-4" />
                Rodapé e logos
              </div>
              <div className="mt-4">
                <FooterGroups
                  groupedLogos={groupedLogos}
                  footerLogoSize={footerLogoSize}
                  layout={settings.footerLayout}
                  showCategoryTitles={settings.showCategoryTitles}
                  showDividers={settings.showDividers}
                  logoSpacing={settings.logoSpacing}
                  footerMarginTopMm={settings.footerMarginTopMm}
                  footerMarginBottomMm={settings.footerMarginBottomMm}
                  placement="back"
                />
              </div>
            </div>
          ) : null}

          {settings.finalBackImageEnabled && settings.finalBackImageUrl && settings.finalBackImageShowOnPdf ? (
            <div className="mt-6 rounded-2xl border border-[#d7bd78] bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7c6530]">
                <Stamp className="size-4" />
                Imagem final do verso
              </div>
              <div
                className="mt-4 grid place-items-center rounded-xl border border-dashed border-[#d7bd78] bg-[#faf6eb] text-center text-sm text-[#7c6530]"
                style={{
                  minHeight: `${Math.max(24, settings.finalBackImageHeight)}mm`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.finalBackImageUrl}
                  alt="Imagem final do verso"
                  className={settings.finalBackImageKeepAspectRatio ? "max-h-32 w-full object-contain px-4 py-3" : "h-32 w-full object-cover px-4 py-3"}
                />
              </div>
            </div>
          ) : null}
        </div>
      </PreviewSheet>
    </div>
  );
}

const PreviewSheet = forwardRef<
  HTMLElement,
  {
    title: string;
    accent: string;
    children: ReactNode;
  }
>(function PreviewSheet({ title, accent, children }, ref) {
  return (
    <section ref={ref} className="rounded-lg border border-border bg-white p-3 soft-shadow">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
        <span className="h-2 w-16 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <div className="aspect-[297/210] overflow-hidden rounded-[1rem] border border-border bg-white">
        {children}
      </div>
    </section>
  );
});

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#d7bd78] bg-white p-3 text-left shadow-[0_4px_14px_rgba(11,74,51,0.05)]">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#7c6530]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#174a2d]">{value}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d7bd78] bg-white p-3 shadow-[0_4px_14px_rgba(11,74,51,0.05)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#7c6530]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#174a2d]">{value}</p>
    </div>
  );
}

function SignatureBlock({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-[#d7bd78] bg-white p-3 text-center">
      <div className="mx-auto h-12 w-full max-w-36 border-b border-[#174a2d]" />
      <p className="mt-2 text-sm font-semibold text-[#174a2d]">{title}</p>
      <p className="mt-1 text-xs text-[#7c6530]">{subtitle}</p>
    </div>
  );
}

function FooterGroups({
  groupedLogos,
  footerLogoSize,
  layout,
  showCategoryTitles,
  showDividers,
  logoSpacing,
  footerMarginTopMm,
  footerMarginBottomMm,
  placement,
}: {
  groupedLogos: Record<string, CertificateSponsorLogo[]>;
  footerLogoSize: number;
  layout: string;
  showCategoryTitles: boolean;
  showDividers: boolean;
  logoSpacing: number;
  footerMarginTopMm: number;
  footerMarginBottomMm: number;
  placement: "front" | "back";
}) {
  const entries = Object.entries(groupedLogos)
    .map(([category, logos]) => [
      category,
      logos.filter((logo) => (placement === "front" ? logo.showOnFront : logo.showOnBack)),
    ] as const)
    .filter(([, logos]) => logos.length > 0);

  if (!entries.length) return null;

  return (
    <div
      className={
        layout === "linha_unica"
          ? "flex flex-wrap items-center justify-center gap-4"
          : layout === "blocos"
            ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            : "grid gap-3"
      }
      style={{
        gap: `${logoSpacing}px`,
        marginTop: `${footerMarginTopMm}mm`,
        marginBottom: `${footerMarginBottomMm}mm`,
      }}
    >
      {entries.map(([category, logos]) => (
        <div
          key={category}
          className={showDividers ? "rounded-xl border border-[#e2cc95] bg-[#fdfbf3] p-3" : "rounded-xl bg-[#fdfbf3] p-3"}
        >
          {showCategoryTitles ? (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7c6530]">
              {category}
            </p>
          ) : null}
          <div
            className={
              layout === "compacto"
                ? "flex flex-wrap items-center justify-center gap-2"
                : layout === "expandido"
                  ? "flex flex-wrap items-center justify-center gap-4"
                  : "flex flex-wrap items-center gap-3"
            }
          >
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="grid place-items-center rounded-xl border border-[#d7bd78] bg-white px-3 py-2 text-center"
                style={{ minWidth: footerLogoSize * 1.4, minHeight: footerLogoSize + 18 }}
              >
                <div
                  className="grid place-items-center rounded-lg border border-dashed border-[#d7bd78] bg-[#faf6eb] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#174a2d]"
                  style={{ width: footerLogoSize, height: footerLogoSize }}
                >
                  {logo.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo.logoUrl} alt={logo.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    logo.name.slice(0, 2)
                  )}
                </div>
                <p className="mt-1 max-w-24 truncate text-[10px] text-[#174a2d]">{logo.name}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
