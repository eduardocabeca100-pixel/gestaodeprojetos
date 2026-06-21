"use client";

import { useMemo, useState, type ReactNode } from "react";
import jsPDF from "jspdf";
import { Download, FileSignature, RotateCcw, Save } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { Project } from "@/modules/projects/types";

type ReceiptState = {
  type: "Recibo de ator/artista" | "Recibo de prestador PF" | "RPA";
  code: string;
  date: string;
  city: string;
  receiver: string;
  document: string;
  role: string;
  amount: string;
  amountText: string;
  service: string;
  paymentMethod: string;
  bankInfo: string;
  notes: string;
  signer: string;
  signerRole: string;
  footer: string;
};

function createInitialReceipt(project: Project): ReceiptState {
  return {
    type: "Recibo de ator/artista",
    code: `REC-${project.registrationNumber}/2026`,
    date: "2026-06-19",
    city: "Jaraguá do Sul/SC",
    receiver: "",
    document: "",
    role: "",
    amount: "",
    amountText: "",
    service: `Prestação de serviço vinculada ao projeto ${project.name}.`,
    paymentMethod: "PIX",
    bankInfo: "",
    notes: "",
    signer: "Marcel Eduardo Cabeça Domingues",
    signerRole: "Diretor geral",
    footer: "Companhia de Artes Viva - CNPJ 59.053.899/0001-53",
  };
}

function formatDate(value: string) {
  if (!value) return "";

  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatReceiptAmount(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  return formatCurrency(amount);
}

function makeReceiptText(receipt: ReceiptState, project: Project) {
  const amount = formatReceiptAmount(receipt.amount);
  const receiverLines = [
    receipt.receiver,
    receipt.document ? `CPF/CNPJ: ${receipt.document}` : "",
    receipt.role,
  ].filter(Boolean);
  const groups = [
    ["COMPANHIA DE ARTES VIVA", receipt.type.toUpperCase(), receipt.code],
    [`Projeto: ${project.name}`, `Edital: ${project.edital}`],
    receiverLines.length ? ["Recebedor(a)", ...receiverLines] : [],
    amount ? [`Valor: ${amount}`, receipt.amountText] : [],
    receipt.service ? [`Referente a: ${receipt.service}`] : [],
    receipt.paymentMethod ? [`Forma de pagamento: ${receipt.paymentMethod}`] : [],
    receipt.bankInfo ? [`Dados bancários: ${receipt.bankInfo}`] : [],
    receipt.notes ? [`Observações: ${receipt.notes}`] : [],
    [
      [receipt.city, formatDate(receipt.date)].filter(Boolean).join(", "),
      receipt.signer,
      receipt.signerRole,
      receipt.footer,
    ],
  ];

  return groups
    .map((group) => group.filter(Boolean))
    .filter((group) => group.length > 0)
    .map((group) => group.join("\n"))
    .join("\n\n");
}

export function ReceiptGenerator({ project }: { project: Project }) {
  const [receipt, setReceipt] = useState<ReceiptState>(() =>
    createInitialReceipt(project),
  );
  const [feedback, setFeedback] = useState("Recibo pronto para edição.");
  const receiptText = useMemo(
    () => makeReceiptText(receipt, project),
    [project, receipt],
  );
  const amount = formatReceiptAmount(receipt.amount);

  function updateField<K extends keyof ReceiptState>(
    key: K,
    value: ReceiptState[K],
  ) {
    setReceipt((current) => ({ ...current, [key]: value }));
  }

  function resetReceipt() {
    setReceipt(createInitialReceipt(project));
    setFeedback("Recibo limpo.");
  }

  function downloadTxt() {
    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${receipt.code || "recibo"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback("TXT do recibo gerado.");
  }

  function downloadPdf() {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 52;
    const width = pdf.internal.pageSize.getWidth();
    let y = 64;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(19);
    pdf.text("COMPANHIA DE ARTES VIVA", margin, y);
    pdf.setFontSize(12);
    pdf.text(receipt.type.toUpperCase(), margin, y + 22);
    pdf.setFont("helvetica", "normal");
    pdf.text(receipt.code, width - margin, y + 22, { align: "right" });

    y += 58;
    pdf.setFontSize(10);
    pdf.text(`Projeto: ${project.name}`, margin, y);
    y += 15;
    pdf.text(`Edital: ${project.edital}`, margin, y);
    y += 32;

    if (receipt.receiver) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Recebedor(a)", margin, y);
      pdf.setFont("helvetica", "normal");
      y += 16;
      [receipt.receiver, receipt.document, receipt.role].filter(Boolean).forEach((line) => {
        pdf.text(line, margin, y);
        y += 15;
      });
      y += 16;
    }

    if (amount) {
      pdf.setFont("helvetica", "bold");
      pdf.text(`Valor recebido: ${amount}`, margin, y);
      pdf.setFont("helvetica", "normal");
      y += 18;
    }

    if (receipt.amountText) {
      pdf.text(receipt.amountText, margin, y);
      y += 20;
    }

    if (receipt.service) {
      const serviceLines = pdf.splitTextToSize(
        `Declaro que recebi o valor acima referente a ${receipt.service}`,
        width - margin * 2,
      );
      pdf.text(serviceLines, margin, y);
      y += serviceLines.length * 15 + 20;
    }

    if (receipt.paymentMethod || receipt.bankInfo) {
      pdf.text(
        [receipt.paymentMethod, receipt.bankInfo].filter(Boolean).join(" - "),
        margin,
        y,
      );
      y += 24;
    }

    if (receipt.notes) {
      const notes = pdf.splitTextToSize(receipt.notes, width - margin * 2);
      pdf.text(notes, margin, y);
      y += notes.length * 15 + 24;
    }

    const localDate = [receipt.city, formatDate(receipt.date)]
      .filter(Boolean)
      .join(", ");
    if (localDate) {
      pdf.text(`${localDate}.`, width - margin, y, { align: "right" });
      y += 70;
    }

    pdf.line(margin, y, margin + 220, y);
    pdf.text(receipt.receiver || "Recebedor(a)", margin + 70, y + 18);
    pdf.line(width - margin - 220, y, width - margin, y);
    pdf.text(receipt.signer || "Responsável", width - margin - 150, y + 18);
    if (receipt.signerRole) {
      pdf.text(receipt.signerRole, width - margin - 158, y + 34);
    }

    if (receipt.footer) {
      pdf.setFontSize(8);
      pdf.text(receipt.footer, width / 2, 780, { align: "center" });
    }

    pdf.save(`${receipt.code || "recibo"}.pdf`);
    setFeedback("PDF do recibo gerado.");
  }

  return (
    <SectionCard
      title="Preparar recibo"
      description={feedback}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFeedback("Recibo preparado para assinatura.")}
          >
            <Save className="size-4" />
            Preparar
          </Button>
          <Button type="button" variant="outline" onClick={downloadTxt}>
            <Download className="size-4" />
            TXT
          </Button>
          <Button type="button" onClick={downloadPdf}>
            <FileSignature className="size-4" />
            PDF
          </Button>
        </>
      }
    >
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tipo">
              <select
                className="form-input mt-1"
                value={receipt.type}
                onChange={(event) =>
                  updateField("type", event.target.value as ReceiptState["type"])
                }
              >
                <option>Recibo de ator/artista</option>
                <option>Recibo de prestador PF</option>
                <option>RPA</option>
              </select>
            </Field>
            <Field label="Número">
              <input
                className="form-input mt-1"
                value={receipt.code}
                onChange={(event) => updateField("code", event.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cidade">
              <input
                className="form-input mt-1"
                value={receipt.city}
                onChange={(event) => updateField("city", event.target.value)}
              />
            </Field>
            <Field label="Data">
              <input
                className="form-input mt-1"
                type="date"
                value={receipt.date}
                onChange={(event) => updateField("date", event.target.value)}
              />
            </Field>
          </div>
          <Field label="Nome de quem recebe">
            <input
              className="form-input mt-1"
              value={receipt.receiver}
              onChange={(event) => updateField("receiver", event.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CPF/CNPJ">
              <input
                className="form-input mt-1"
                value={receipt.document}
                onChange={(event) => updateField("document", event.target.value)}
              />
            </Field>
            <Field label="Função">
              <input
                className="form-input mt-1"
                value={receipt.role}
                onChange={(event) => updateField("role", event.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valor">
              <input
                className="form-input mt-1"
                type="number"
                value={receipt.amount}
                onChange={(event) => updateField("amount", event.target.value)}
              />
            </Field>
            <Field label="Valor por extenso">
              <input
                className="form-input mt-1"
                value={receipt.amountText}
                onChange={(event) => updateField("amountText", event.target.value)}
              />
            </Field>
          </div>
          <Field label="Serviço prestado">
            <textarea
              className="form-input mt-1 min-h-24"
              value={receipt.service}
              onChange={(event) => updateField("service", event.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Forma de pagamento">
              <input
                className="form-input mt-1"
                value={receipt.paymentMethod}
                onChange={(event) => updateField("paymentMethod", event.target.value)}
              />
            </Field>
            <Field label="Dados bancários">
              <input
                className="form-input mt-1"
                value={receipt.bankInfo}
                onChange={(event) => updateField("bankInfo", event.target.value)}
              />
            </Field>
          </div>
          <Field label="Observações">
            <textarea
              className="form-input mt-1 min-h-20"
              value={receipt.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Responsável">
              <input
                className="form-input mt-1"
                value={receipt.signer}
                onChange={(event) => updateField("signer", event.target.value)}
              />
            </Field>
            <Field label="Cargo">
              <input
                className="form-input mt-1"
                value={receipt.signerRole}
                onChange={(event) => updateField("signerRole", event.target.value)}
              />
            </Field>
          </div>
          <Field label="Rodapé">
            <textarea
              className="form-input mt-1 min-h-16"
              value={receipt.footer}
              onChange={(event) => updateField("footer", event.target.value)}
            />
          </Field>
          <Button type="button" variant="outline" onClick={resetReceipt}>
            <RotateCcw className="size-4" />
            Limpar recibo
          </Button>
        </div>

        <div className="overflow-auto rounded-lg bg-slate-900/85 p-4">
          <article className="mx-auto min-h-[680px] w-full max-w-[720px] bg-white p-10 text-[13px] leading-6 text-black shadow-xl sm:p-14">
            <header className="border-b border-black pb-5">
              <p className="text-sm font-bold tracking-[0.16em]">
                COMPANHIA DE ARTES VIVA
              </p>
              <h3 className="mt-4 text-2xl font-black">{receipt.type}</h3>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
                <span>{receipt.code}</span>
                <span>{project.name}</span>
              </div>
            </header>

            <section className="mt-8 space-y-5">
              <p>
                <strong>Projeto:</strong> {project.fullTitle}
              </p>
              {receipt.receiver ? (
                <p>
                  <strong>Recebedor(a):</strong> {receipt.receiver}
                  {receipt.document ? ` - ${receipt.document}` : ""}
                  {receipt.role ? ` - ${receipt.role}` : ""}
                </p>
              ) : null}
              {amount ? (
                <p>
                  <strong>Valor recebido:</strong> {amount}
                  {receipt.amountText ? ` (${receipt.amountText})` : ""}
                </p>
              ) : null}
              {receipt.service ? (
                <p className="text-justify">
                  Declaro que recebi o valor indicado referente a {receipt.service}
                </p>
              ) : null}
              {receipt.paymentMethod || receipt.bankInfo ? (
                <p>
                  <strong>Pagamento:</strong>{" "}
                  {[receipt.paymentMethod, receipt.bankInfo].filter(Boolean).join(" - ")}
                </p>
              ) : null}
              {receipt.notes ? <p>{receipt.notes}</p> : null}
            </section>

            <p className="mt-10 text-right">
              {[receipt.city, formatDate(receipt.date)].filter(Boolean).join(", ")}
              {receipt.city || receipt.date ? "." : ""}
            </p>

            <div className="mt-20 grid gap-10 sm:grid-cols-2">
              <Signature label={receipt.receiver || "Recebedor(a)"} />
              <Signature
                label={receipt.signer || "Responsável"}
                helper={receipt.signerRole}
              />
            </div>

            {receipt.footer ? (
              <footer className="mt-16 border-t border-black pt-3 text-center text-[11px]">
                {receipt.footer}
              </footer>
            ) : null}
          </article>
        </div>
      </div>
    </SectionCard>
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

function Signature({ label, helper }: { label: string; helper?: string }) {
  return (
    <div className="text-center">
      <div className="mb-2 border-t border-black" />
      <p>{label}</p>
      {helper ? <p>{helper}</p> : null}
    </div>
  );
}
