"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import jsPDF from "jspdf";
import {
  Copy,
  Download,
  Eye,
  FileText,
  ImagePlus,
  RotateCcw,
  Save,
  Type,
} from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/format-date";
import type { Project } from "@/modules/projects/types";
import type { OfficialDocument } from "@/modules/official-documents/types";
import {
  officialDocumentTemplates,
  type OfficialDocumentTemplate,
} from "@/modules/official-documents/types";

type DocumentState = {
  template: OfficialDocumentTemplate;
  title: string;
  fileName: string;
  code: string;
  date: string;
  city: string;
  subject: string;
  status: "Rascunho" | "Finalizado" | "Assinado" | "Arquivado";
  recipient: string;
  recipientRole: string;
  institution: string;
  address: string;
  signerOne: string;
  signerOneRole: string;
  signerTwo: string;
  signerTwoRole: string;
  approver: string;
  content: string;
  footerText: string;
  footerDocument: string;
  headerLogo: string | null;
  footerImage: string | null;
};

const templateDetails: Record<
  OfficialDocumentTemplate,
  {
    description: string;
    prefix: string;
    subject: string;
    title: string;
    content: string;
  }
> = {
  Ofício: {
    description: "comunicações oficiais externas e internas",
    prefix: "OFIC",
    subject: "comunicação oficial institucional",
    title: "Ofício institucional",
    content:
      "A Companhia de Artes Viva vem, por meio deste, formalizar comunicação institucional referente ao projeto cultural indicado, encaminhando as informações necessárias para análise, registro e providências cabíveis.\n\nPermanecemos à disposição para esclarecimentos e complementações.",
  },
  "Pauta de Reunião": {
    description: "organizar temas de reuniões da Presidência, Conselho e diretoria",
    prefix: "PAUT",
    subject: "pauta de reunião institucional",
    title: "Pauta de reunião",
    content:
      "1. Abertura e verificação dos presentes.\n2. Aprovação da pauta.\n3. Informes gerais sobre o projeto cultural.\n4. Deliberação sobre responsabilidades, prazos e documentos.\n5. Encaminhamentos finais e definição da próxima reunião.",
  },
  "Ata de Reunião": {
    description: "registrar decisões, presenças e encaminhamentos",
    prefix: "ATA",
    subject: "registro formal de reunião",
    title: "Ata de reunião",
    content:
      "Aos participantes reunidos, registra-se que foi realizada reunião para tratar dos assuntos relacionados ao projeto cultural indicado. Após leitura da pauta, foram apresentados informes, discutidos os pontos necessários e definidos os encaminhamentos constantes neste documento.\n\nNada mais havendo a tratar, a reunião foi encerrada, lavrando-se a presente ata para fins de registro.",
  },
  "Deliberação do Conselho": {
    description: "decisões formais do conselho, presidência e instituição",
    prefix: "DELIB",
    subject: "deliberação institucional",
    title: "Deliberação do conselho",
    content:
      "O Conselho/Diretoria da Companhia de Artes Viva, no uso de suas atribuições institucionais, delibera pela aprovação dos encaminhamentos descritos neste documento, observadas as normas internas, o interesse institucional e as exigências do projeto cultural indicado.",
  },
  "Documento para Assinatura": {
    description: "documentos que exigem assinatura de responsáveis",
    prefix: "ASS",
    subject: "documento para assinatura",
    title: "Documento para assinatura",
    content:
      "As partes identificadas declaram ciência e concordância com as informações aqui registradas, comprometendo-se a cumprir as responsabilidades, prazos e condições estabelecidas para a correta execução do projeto cultural indicado.",
  },
  "Autorização de Compra": {
    description: "aprovação de compra por produtor, gestor, setor ou projeto",
    prefix: "COMP",
    subject: "autorização de compra",
    title: "Autorização de compra",
    content:
      "Fica autorizada a aquisição dos materiais, produtos ou serviços descritos neste documento, desde que vinculados ao projeto cultural indicado, observada a rubrica orçamentária correspondente e a necessidade de anexar nota fiscal, cupom fiscal e comprovante de pagamento.",
  },
  "Memorando Interno": {
    description: "comunicação administrativa interna",
    prefix: "MEMO",
    subject: "memorando interno",
    title: "Memorando interno",
    content:
      "Encaminha-se este memorando para ciência interna e providências administrativas relacionadas ao projeto cultural indicado, devendo os responsáveis observar os prazos, anexos e registros necessários.",
  },
  Declaração: {
    description: "declarações oficiais da instituição",
    prefix: "DECL",
    subject: "declaração institucional",
    title: "Declaração",
    content:
      "A Companhia de Artes Viva declara, para os devidos fins, que as informações descritas neste documento correspondem ao registro institucional válido, sujeito à verificação dos dados, assinatura do responsável e arquivamento nos documentos oficiais do projeto.",
  },
  Relatório: {
    description: "relatórios de atividade, projeto, compra, evento ou gestão",
    prefix: "REL",
    subject: "relatório institucional",
    title: "Relatório institucional",
    content:
      "Este relatório apresenta o registro das atividades, decisões, documentos e evidências relacionadas ao projeto cultural indicado, com finalidade de acompanhamento interno, organização administrativa e prestação de contas.",
  },
  "Termo / Contrato": {
    description: "minutas, termos de voluntariado, autorização e parceria",
    prefix: "TERMO",
    subject: "termo institucional",
    title: "Termo / contrato",
    content:
      "Pelo presente termo, as partes qualificadas assumem as responsabilidades descritas neste documento, observadas as condições de participação, prestação de serviço, autorização ou parceria vinculadas ao projeto cultural indicado.",
  },
  "Projeto Cultural": {
    description: "estrutura de projetos, editais, Salic e patrocínios",
    prefix: "PROJ",
    subject: "estrutura de projeto cultural",
    title: "Projeto cultural",
    content:
      "O presente documento consolida a estrutura do projeto cultural indicado, incluindo apresentação, justificativa, objetivos, público, cronograma, orçamento, equipe técnica e estratégia de documentação para execução e prestação de contas.",
  },
  "Autorização de Imagem": {
    description: "uso de imagem, voz, registro fotográfico e divulgação",
    prefix: "AIMG",
    subject: "autorização de uso de imagem e voz",
    title: "Autorização de imagem",
    content:
      "Autorizo a Companhia de Artes Viva a utilizar minha imagem, voz, nome e registros fotográficos/audiovisuais captados durante as atividades do projeto cultural indicado, para fins de divulgação institucional, memória, portfólio e prestação de contas, sem finalidade comercial direta.",
  },
  "Autorização de Responsável": {
    description: "autorização para participação de menor de idade",
    prefix: "ARESP",
    subject: "autorização de responsável legal",
    title: "Autorização de responsável",
    content:
      "Na qualidade de responsável legal, autorizo a participação do(a) menor identificado(a) nas atividades do projeto cultural indicado, bem como declaro estar ciente dos horários, locais, registros de presença, registros fotográficos e demais procedimentos necessários.",
  },
  "Recibo de Prestador PF": {
    description: "recibo para serviço sem emissão de nota fiscal",
    prefix: "REC-PF",
    subject: "recibo de prestação de serviço pessoa física",
    title: "Recibo de prestador pessoa física",
    content:
      "Recebi da Companhia de Artes Viva o valor indicado neste documento, referente à prestação de serviço vinculada ao projeto cultural mencionado. Declaro que o serviço foi realizado conforme combinado e autorizo o uso deste recibo para fins administrativos e de prestação de contas.",
  },
  "Recibo de Ator/Artista": {
    description: "recibo para pagamento de elenco pessoa física",
    prefix: "REC-ART",
    subject: "recibo de pagamento artístico",
    title: "Recibo de ator/artista",
    content:
      "Recebi da Companhia de Artes Viva o valor indicado neste documento, referente à participação artística no projeto cultural mencionado. Declaro a realização das atividades acordadas e autorizo o arquivamento deste recibo para fins de comprovação financeira.",
  },
};

const today = "2026-06-19";

function createInitialState(
  template: OfficialDocumentTemplate = "Ofício",
  project?: Project,
): DocumentState {
  const detail = templateDetails[template];

  return {
    template,
    title: detail.title,
    fileName: detail.title,
    code: `${detail.prefix}-${project?.registrationNumber ?? "0001"}/2026`,
    date: today,
    city: "Araquari/SC",
    subject: project ? `${detail.subject} - ${project.name}` : detail.subject,
    status: "Rascunho",
    recipient: "",
    recipientRole: "",
    institution: "",
    address: "",
    signerOne: "Eduardo",
    signerOneRole: "Diretor Presidente",
    signerTwo: "",
    signerTwoRole: "",
    approver: "Eduardo",
    content: detail.content,
    footerText:
      "Rua das Artes, 123 - Centro - Araquari/SC - CEP 89245-000 | (47) 0000-0000 | contato@ciaviva.org.br | www.ciaviva.org.br",
    footerDocument: "CNPJ 00.000.000/0001-00",
    headerLogo: null,
    footerImage: null,
  };
}

function formatLongDate(value: string) {
  if (!value) {
    return "";
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function makeExportText(documentState: DocumentState) {
  const recipientLines = [
    documentState.recipient,
    documentState.recipientRole,
    documentState.institution,
    documentState.address,
  ].filter(Boolean);
  const signatureLines = [
    [documentState.signerOne, documentState.signerOneRole].filter(Boolean).join(" - "),
    [documentState.signerTwo, documentState.signerTwoRole].filter(Boolean).join(" - "),
  ].filter(Boolean);
  const cityDate = [
    documentState.city,
    documentState.date ? formatLongDate(documentState.date) : "",
  ]
    .filter(Boolean)
    .join(", ");
  const groups = [
    ["COMPANHIA DE ARTES VIVA", "Instituição Cultural", "Documentos Oficiais e Administrativos"],
    [`${documentState.template.toUpperCase()} ${documentState.code}`, cityDate ? `${cityDate}.` : ""],
    recipientLines.length ? ["Ao Senhor(a)", ...recipientLines] : [],
    documentState.subject ? [`Assunto: ${documentState.subject}`] : [],
    documentState.content ? [documentState.content] : [],
    ["Atenciosamente,"],
    signatureLines,
    [documentState.footerText, documentState.footerDocument],
  ];

  return groups
    .map((group) => group.filter(Boolean))
    .filter((group) => group.length > 0)
    .map((group) => group.join("\n"))
    .join("\n\n");
}

export function OfficialDocumentsWorkspace({
  project,
  savedDocuments,
}: {
  project: Project;
  savedDocuments: OfficialDocument[];
}) {
  const [documentState, setDocumentState] = useState<DocumentState>(() =>
    createInitialState("Ofício", project),
  );
  const [previewMode, setPreviewMode] = useState(true);
  const [feedback, setFeedback] = useState("Documento pronto para edição.");
  const [saved, setSaved] = useState(savedDocuments);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const selectedDescription = templateDetails[documentState.template].description;
  const exportText = useMemo(() => makeExportText(documentState), [documentState]);

  function updateField<K extends keyof DocumentState>(key: K, value: DocumentState[K]) {
    setDocumentState((current) => ({ ...current, [key]: value }));
  }

  function applyTemplate(template: OfficialDocumentTemplate) {
    setDocumentState((current) => ({
      ...createInitialState(template, project),
      headerLogo: current.headerLogo,
      footerImage: current.footerImage,
      footerText: current.footerText,
      footerDocument: current.footerDocument,
    }));
    setPreviewMode(false);
    setFeedback(`Modelo "${template}" carregado para edição.`);
  }

  function handleImageUpload(
    file: File | undefined,
    field: "headerLogo" | "footerImage",
  ) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateField(field, String(reader.result));
      setFeedback(field === "headerLogo" ? "Logo do cabeçalho atualizada." : "Imagem do rodapé atualizada.");
    };
    reader.readAsDataURL(file);
  }

  function insertSnippet(snippet: string) {
    const textarea = editorRef.current;

    if (!textarea) {
      updateField("content", `${documentState.content}\n${snippet}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextContent = `${documentState.content.slice(0, start)}${snippet}${documentState.content.slice(end)}`;

    updateField("content", nextContent);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  }

  function saveDocument(asNew = false) {
    const entry: OfficialDocument = {
      id: `${documentState.code}-${Date.now()}`,
      projectId: project.id,
      template: documentState.template,
      title: documentState.title,
      code: documentState.code,
      date: documentState.date,
      subject: documentState.subject,
      status: documentState.status,
      recipient: documentState.recipient,
      recipientRole: documentState.recipientRole,
      institution: documentState.institution,
      signerOne: documentState.signerOne,
      signerOneRole: documentState.signerOneRole,
      signerTwo: documentState.signerTwo,
      signerTwoRole: documentState.signerTwoRole,
      content: documentState.content,
    };

    setSaved((current) => (asNew ? [entry, ...current] : [entry, ...current.slice(1)]));
    setFeedback(asNew ? "Documento salvo como novo." : "Documento salvo.");
  }

  function duplicateDocument() {
    setDocumentState((current) => ({
      ...current,
      title: `${current.title} - cópia`,
      fileName: `${current.fileName} - copia`,
      code: `${current.code.replace("/2026", "")}-COPIA/2026`,
      status: "Rascunho",
    }));
    setPreviewMode(false);
    setFeedback("Documento duplicado para nova edição.");
  }

  function downloadTxt() {
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${documentState.fileName || documentState.code}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback("TXT gerado.");
  }

  function downloadPdf() {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 46;
    let y = 62;
    const recipientLines = [
      documentState.recipient,
      documentState.recipientRole,
      documentState.institution,
      documentState.address,
    ].filter(Boolean);

    pdf.setFont("helvetica", "bold");
    if (documentState.headerLogo) {
      try {
        pdf.addImage(documentState.headerLogo, "PNG", margin, y - 12, 120, 54);
      } catch {
        pdf.rect(margin, y - 12, 120, 54);
      }
    } else {
      pdf.rect(margin, y - 12, 120, 54);
      pdf.text("VIVA", margin + 36, y + 20);
    }

    pdf.setFontSize(17);
    pdf.text("COMPANHIA DE ARTES VIVA", margin + 160, y + 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Instituição Cultural", margin + 160, y + 26);
    pdf.text("Documentos Oficiais e Administrativos", margin + 160, y + 42);

    y += 100;
    pdf.setFont("helvetica", "bold");
    pdf.text(`${documentState.template.toUpperCase()} ${documentState.code}`, margin, y);
    pdf.setFont("helvetica", "normal");
    if (documentState.city || documentState.date) {
      pdf.text(
        `${[documentState.city, formatLongDate(documentState.date)].filter(Boolean).join(", ")}.`,
        pageWidth - margin - 145,
        y,
      );
    }

    if (recipientLines.length > 0) {
      y += 42;
      pdf.text("Ao Senhor(a)", margin, y);
      y += 16;
      recipientLines.forEach((line) => {
        pdf.text(line, margin, y);
        y += 16;
      });
    }

    if (documentState.subject) {
      y += 22;
      pdf.setFont("helvetica", "bold");
      pdf.text("Assunto:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(documentState.subject, margin + 46, y);
    }

    y += 34;
    if (documentState.content) {
      const lines = pdf.splitTextToSize(documentState.content, pageWidth - margin * 2);
      pdf.text(lines, margin, y);
      y += lines.length * 14 + 44;
    }

    pdf.text("Atenciosamente,", margin, y);
    y += 58;
    if (documentState.signerOne || documentState.signerOneRole) {
      pdf.line(margin, y, margin + 210, y);
      if (documentState.signerOne) {
        pdf.text(documentState.signerOne, margin + 72, y + 18);
      }
      if (documentState.signerOneRole) {
        pdf.text(documentState.signerOneRole, margin + 54, y + 34);
      }
    }
    if (documentState.signerTwo || documentState.signerTwoRole) {
      pdf.line(pageWidth - margin - 210, y, pageWidth - margin, y);
      if (documentState.signerTwo) {
        pdf.text(documentState.signerTwo, pageWidth - margin - 138, y + 18);
      }
      if (documentState.signerTwoRole) {
        pdf.text(documentState.signerTwoRole, pageWidth - margin - 150, y + 34);
      }
    }

    const footerY = 742;
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    if (documentState.footerImage) {
      try {
        pdf.addImage(documentState.footerImage, "PNG", margin, footerY + 10, 34, 24);
      } catch {
        pdf.rect(margin, footerY + 10, 34, 24);
      }
    }
    pdf.setFontSize(8);
    if (documentState.footerText) {
      pdf.text(documentState.footerText, pageWidth / 2, footerY + 18, {
        align: "center",
      });
    }
    if (documentState.footerDocument) {
      pdf.text(documentState.footerDocument, pageWidth / 2, footerY + 34, {
        align: "center",
      });
    }

    pdf.save(`${documentState.fileName || documentState.code}.pdf`);
    setFeedback("PDF gerado.");
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Logo especial dos documentos oficiais"
        description="Use uma logo própria para papel timbrado, ofícios e PDFs."
        actions={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium">
            <ImagePlus className="size-4 text-primary" />
            Alterar logo
            <input
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                handleImageUpload(event.target.files?.[0], "headerLogo")
              }
            />
          </label>
        }
      >
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-36 items-center justify-center rounded-lg bg-slate-950 text-white">
            {documentState.headerLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Logo dos documentos oficiais"
                className="h-full w-full rounded-lg object-contain"
                src={documentState.headerLogo}
              />
            ) : (
              <span className="text-3xl font-black">VIVA</span>
            )}
          </div>
          <div>
            <p className="font-semibold">Cabeçalho dos documentos oficiais</p>
            <p className="mt-1 text-sm text-muted-foreground">
              PNG/JPG/WebP. Para PDF, prefira PNG transparente.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Modelos oficiais profissionais" description="Clique em um modelo para carregar conteúdo válido e editável.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {officialDocumentTemplates.map((template) => (
            <button
              key={template}
              type="button"
              className={
                documentState.template === template
                  ? "rounded-lg border border-primary bg-primary/10 p-3 text-left transition"
                  : "rounded-lg border border-border bg-white p-3 text-left transition hover:border-primary hover:bg-primary/5"
              }
              onClick={() => applyTemplate(template)}
            >
              <FileText className="mb-2 size-4 text-primary" />
              <p className="text-sm font-semibold">{template}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {templateDetails[template].description}
              </p>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
        <div className="space-y-4">
          <SectionCard title="Dados do arquivo" description={selectedDescription}>
            <div className="grid gap-3">
              <Field label="Modelo">
                <select
                  className="form-input mt-1"
                  value={documentState.template}
                  onChange={(event) =>
                    applyTemplate(event.target.value as OfficialDocumentTemplate)
                  }
                >
                  {officialDocumentTemplates.map((template) => (
                    <option key={template}>{template}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nome do documento">
                <input
                  className="form-input mt-1"
                  value={documentState.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
              </Field>
              <Field label="Nome do arquivo">
                <input
                  className="form-input mt-1"
                  value={documentState.fileName}
                  onChange={(event) => updateField("fileName", event.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Número/código">
                  <input
                    className="form-input mt-1"
                    value={documentState.code}
                    onChange={(event) => updateField("code", event.target.value)}
                  />
                </Field>
                <Field label="Data">
                  <input
                    className="form-input mt-1"
                    type="date"
                    value={documentState.date}
                    onChange={(event) => updateField("date", event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Cidade/UF">
                <input
                  className="form-input mt-1"
                  value={documentState.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </Field>
              <Field label="Assunto/tema">
                <input
                  className="form-input mt-1"
                  value={documentState.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                />
              </Field>
              <Field label="Status">
                <select
                  className="form-input mt-1"
                  value={documentState.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value as DocumentState["status"],
                    )
                  }
                >
                  <option>Rascunho</option>
                  <option>Finalizado</option>
                  <option>Assinado</option>
                  <option>Arquivado</option>
                </select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Destinatário e assinatura">
            <div className="grid gap-3">
              <input
                className="form-input"
                value={documentState.recipient}
                onChange={(event) => updateField("recipient", event.target.value)}
                placeholder="Destinatário"
              />
              <input
                className="form-input"
                value={documentState.recipientRole}
                onChange={(event) =>
                  updateField("recipientRole", event.target.value)
                }
                placeholder="Cargo"
              />
              <input
                className="form-input"
                value={documentState.institution}
                onChange={(event) => updateField("institution", event.target.value)}
                placeholder="Instituição"
              />
              <input
                className="form-input"
                value={documentState.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Endereço"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="form-input"
                  value={documentState.signerOne}
                  onChange={(event) => updateField("signerOne", event.target.value)}
                  placeholder="Assinante 1"
                />
                <input
                  className="form-input"
                  value={documentState.signerOneRole}
                  onChange={(event) =>
                    updateField("signerOneRole", event.target.value)
                  }
                  placeholder="Cargo 1"
                />
                <input
                  className="form-input"
                  value={documentState.signerTwo}
                  onChange={(event) => updateField("signerTwo", event.target.value)}
                  placeholder="Assinante 2"
                />
                <input
                  className="form-input"
                  value={documentState.signerTwoRole}
                  onChange={(event) =>
                    updateField("signerTwoRole", event.target.value)
                  }
                  placeholder="Cargo 2"
                />
              </div>
              <input
                className="form-input"
                value={documentState.approver}
                onChange={(event) => updateField("approver", event.target.value)}
                placeholder="Aprovador/responsável"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Rodapé do documento"
            description="Texto, CNPJ e imagem opcional do rodapé."
          >
            <div className="grid gap-3">
              <textarea
                className="form-input min-h-20"
                value={documentState.footerText}
                onChange={(event) => updateField("footerText", event.target.value)}
              />
              <input
                className="form-input"
                value={documentState.footerDocument}
                onChange={(event) =>
                  updateField("footerDocument", event.target.value)
                }
              />
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-white px-3 py-3 text-sm font-medium">
                <ImagePlus className="size-4 text-primary" />
                Colocar foto/logo no rodapé
                <input
                  className="hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    handleImageUpload(event.target.files?.[0], "footerImage")
                  }
                />
              </label>
              {documentState.footerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Imagem do rodapé"
                  className="h-16 w-full rounded-lg border border-border object-contain"
                  src={documentState.footerImage}
                />
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Documentos salvos">
            <div className="space-y-3">
              {saved.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  className="w-full rounded-lg border border-border bg-white p-3 text-left transition hover:border-primary"
                  onClick={() => {
                    setDocumentState((current) => ({
                      ...current,
                      template: document.template,
                      title: document.title,
                      fileName: document.title,
                      code: document.code,
                      date: document.date,
                      subject: document.subject,
                      status: document.status,
                      recipient: document.recipient,
                      recipientRole: document.recipientRole,
                      institution: document.institution,
                      signerOne: document.signerOne,
                      signerOneRole: document.signerOneRole,
                      signerTwo: document.signerTwo,
                      signerTwoRole: document.signerTwoRole,
                      content: document.content,
                    }));
                    setFeedback("Documento salvo carregado para edição.");
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{document.title}</p>
                    <StatusBadge value={document.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {document.template} · {document.code} · {formatDate(document.date)}
                  </p>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title={previewMode ? "Prévia oficial" : "Editor de texto"}
          description={
            previewMode
              ? "Visualização em papel timbrado antes de exportar."
              : "Edite diretamente no sistema com formatação básica."
          }
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewMode((current) => !current)}
              >
                {previewMode ? (
                  <>
                    <RotateCcw className="size-4" />
                    Voltar ao editor
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    Ver prévia
                  </>
                )}
              </Button>
              <Button type="button" onClick={() => saveDocument(false)}>
                <Save className="size-4" />
                Salvar
              </Button>
              <Button type="button" variant="outline" onClick={() => saveDocument(true)}>
                <Save className="size-4" />
                Salvar como novo
              </Button>
              <Button type="button" variant="outline" onClick={duplicateDocument}>
                <Copy className="size-4" />
                Duplicar
              </Button>
              <Button type="button" variant="outline" onClick={downloadTxt}>
                <Download className="size-4" />
                TXT
              </Button>
              <Button type="button" variant="outline" onClick={downloadPdf}>
                <FileText className="size-4" />
                PDF
              </Button>
            </>
          }
        >
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {feedback}
          </div>

          {previewMode ? (
            <DocumentPreview documentState={documentState} />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { label: "B", snippet: "**texto em negrito**" },
                  { label: "I", snippet: "_texto em itálico_" },
                  { label: "U", snippet: "__texto sublinhado__" },
                  { label: "Título", snippet: "\n\nTÍTULO DA SEÇÃO\n" },
                  { label: "Cláusula", snippet: "\n\nCLÁUSULA: " },
                  { label: "Tabela", snippet: "\n\nItem | Descrição | Valor\n1 |  | R$ 0,00\n" },
                ].map((tool) => (
                  <button
                    key={tool.label}
                    type="button"
                    className="rounded-md border border-border bg-white px-2 py-1 text-xs font-medium"
                    onClick={() => insertSnippet(tool.snippet)}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="sr-only">Conteúdo do documento</span>
                <textarea
                  ref={editorRef}
                  className="form-input min-h-[520px] resize-y"
                  placeholder="Digite o conteúdo do documento aqui..."
                  value={documentState.content}
                  onChange={(event) => updateField("content", event.target.value)}
                />
              </label>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                <Type className="size-4 text-primary" />
                Todos os campos ao lado atualizam a prévia, TXT e PDF.
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function DocumentPreview({ documentState }: { documentState: DocumentState }) {
  const recipientLines = [
    documentState.recipient,
    documentState.recipientRole,
    documentState.institution,
    documentState.address,
  ].filter(Boolean);
  const signatures = [
    { name: documentState.signerOne, role: documentState.signerOneRole },
    { name: documentState.signerTwo, role: documentState.signerTwoRole },
  ].filter((signature) => signature.name || signature.role);
  const showFooter =
    documentState.footerText || documentState.footerDocument || documentState.footerImage;

  return (
    <div className="overflow-auto rounded-lg bg-slate-900/85 p-4">
      <article className="mx-auto min-h-[760px] w-full max-w-[760px] bg-white p-10 text-[13px] leading-6 text-black shadow-xl sm:p-14">
        <header className="grid items-center gap-8 sm:grid-cols-[220px_1fr]">
          <div className="flex h-20 items-center justify-center bg-zinc-900 text-white">
            {documentState.headerLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Logo do documento"
                className="h-full w-full object-contain"
                src={documentState.headerLogo}
              />
            ) : (
              <span className="text-4xl font-black">VIVA</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black">COMPANHIA DE ARTES VIVA</h2>
            <p>Instituição Cultural</p>
            <p>Documentos Oficiais e Administrativos</p>
          </div>
        </header>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold">
            {documentState.template.toUpperCase()} {documentState.code}
          </p>
          {documentState.city || documentState.date ? (
            <p>
              {[documentState.city, formatLongDate(documentState.date)]
                .filter(Boolean)
                .join(", ")}
              .
            </p>
          ) : null}
        </div>

        {recipientLines.length > 0 ? (
          <div className="mt-10 whitespace-pre-line">
            {["Ao Senhor(a)", ...recipientLines].join("\n")}
          </div>
        ) : null}

        {documentState.subject ? (
          <p className="mt-10">
            <strong>Assunto:</strong> {documentState.subject}
          </p>
        ) : null}

        {documentState.content ? (
          <div className="mt-10 whitespace-pre-line text-justify">
            {documentState.content}
          </div>
        ) : null}

        <p className="mt-12">Atenciosamente,</p>

        {signatures.length > 0 ? (
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {signatures.map((signature) => (
              <Signature
                key={`${signature.name}-${signature.role}`}
                name={signature.name}
                role={signature.role}
              />
            ))}
          </div>
        ) : null}

        {showFooter ? (
          <footer className="mt-16 border-t border-black/60 pt-3 text-center text-[11px] leading-5">
            {documentState.footerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Imagem do rodapé"
                className="mx-auto mb-2 h-10 max-w-full object-contain"
                src={documentState.footerImage}
              />
            ) : null}
            {documentState.footerText ? <p>{documentState.footerText}</p> : null}
            {documentState.footerDocument ? <p>{documentState.footerDocument}</p> : null}
          </footer>
        ) : null}
      </article>
    </div>
  );
}

function Signature({ name, role }: { name: string; role: string }) {
  return (
    <div className="text-center">
      <div className="mb-2 border-t border-black" />
      <p>{name}</p>
      <p>{role}</p>
    </div>
  );
}
