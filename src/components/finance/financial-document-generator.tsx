"use client";

import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  FileSignature,
  FileText,
  ReceiptText,
  Send,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { escapePdfHtml, openSystemPdf } from "@/lib/pdf/pdf-template";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { TeamMember } from "@/modules/team/types";

type FinancialDocumentType =
  | "Solicitação de pagamento"
  | "Comprovante de pagamento"
  | "Recibo simples para artista/ator"
  | "RPA / recibo para prestador PF"
  | "Declaração de recebimento"
  | "Encaminhamento de nota/recibo";

const documentTypes: Array<{
  type: FinancialDocumentType;
  description: string;
  icon: typeof FileText;
}> = [
  {
    type: "Solicitação de pagamento",
    description: "Documento interno solicitando pagamento de despesa vinculada à rubrica.",
    icon: Send,
  },
  {
    type: "Comprovante de pagamento",
    description: "Resumo formal do pagamento realizado para anexar junto à prestação.",
    icon: WalletCards,
  },
  {
    type: "Recibo simples para artista/ator",
    description: "Recibo para pessoa física quando couber recibo simples.",
    icon: ReceiptText,
  },
  {
    type: "RPA / recibo para prestador PF",
    description: "Modelo base para prestador pessoa física, com dados do serviço.",
    icon: FileSignature,
  },
  {
    type: "Declaração de recebimento",
    description: "Declaração assinável de que o favorecido recebeu o valor.",
    icon: BadgeDollarSign,
  },
  {
    type: "Encaminhamento de nota/recibo",
    description: "Capa de encaminhamento para nota fiscal, recibo ou comprovante.",
    icon: FileText,
  },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateBr(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function makeMoney(value: string) {
  const normalized = Number(String(value || "0").replace(",", "."));
  return Number.isFinite(normalized) ? normalized : 0;
}

function paragraph(value: string) {
  return `<p>${escapePdfHtml(value)}</p>`;
}

function buildDocumentBody({
  type,
  projectName,
  rubrica,
  beneficiaryName,
  beneficiaryDocument,
  beneficiaryRole,
  amount,
  paymentDate,
  paymentMethod,
  description,
  notes,
}: {
  type: FinancialDocumentType;
  projectName: string;
  rubrica: string;
  beneficiaryName: string;
  beneficiaryDocument: string;
  beneficiaryRole: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  description: string;
  notes: string;
}) {
  const value = formatCurrency(amount);
  const date = formatDateBr(paymentDate);

  if (type === "Solicitação de pagamento") {
    return `
      ${paragraph(`Solicita-se a autorização e processamento do pagamento referente ao projeto cultural ${projectName}.`)}
      <table>
        <tbody>
          <tr><th>Rubrica</th><td>${escapePdfHtml(rubrica)}</td></tr>
          <tr><th>Favorecido</th><td>${escapePdfHtml(beneficiaryName)}</td></tr>
          <tr><th>CPF/CNPJ</th><td>${escapePdfHtml(beneficiaryDocument)}</td></tr>
          <tr><th>Função/serviço</th><td>${escapePdfHtml(beneficiaryRole)}</td></tr>
          <tr><th>Valor solicitado</th><td>${escapePdfHtml(value)}</td></tr>
          <tr><th>Forma de pagamento</th><td>${escapePdfHtml(paymentMethod)}</td></tr>
          <tr><th>Descrição</th><td>${escapePdfHtml(description)}</td></tr>
        </tbody>
      </table>
      ${notes ? paragraph(`Observações: ${notes}`) : ""}
    `;
  }

  if (type === "Comprovante de pagamento") {
    return `
      ${paragraph(`Declaramos, para fins de controle interno e prestação de contas, que foi registrado pagamento vinculado ao projeto cultural ${projectName}.`)}
      <table>
        <tbody>
          <tr><th>Favorecido</th><td>${escapePdfHtml(beneficiaryName)}</td></tr>
          <tr><th>CPF/CNPJ</th><td>${escapePdfHtml(beneficiaryDocument)}</td></tr>
          <tr><th>Rubrica</th><td>${escapePdfHtml(rubrica)}</td></tr>
          <tr><th>Valor pago</th><td>${escapePdfHtml(value)}</td></tr>
          <tr><th>Data do pagamento</th><td>${escapePdfHtml(date)}</td></tr>
          <tr><th>Forma de pagamento</th><td>${escapePdfHtml(paymentMethod)}</td></tr>
          <tr><th>Referência</th><td>${escapePdfHtml(description)}</td></tr>
        </tbody>
      </table>
      ${paragraph("Este documento deve ser acompanhado do comprovante bancário, nota fiscal, recibo ou documento fiscal correspondente, quando aplicável.")}
    `;
  }

  if (type === "Recibo simples para artista/ator") {
    return `
      ${paragraph(`Eu, ${beneficiaryName}, inscrito(a) no CPF/CNPJ sob nº ${beneficiaryDocument}, declaro ter recebido da Cia de Artes Viva o valor de ${value}, referente à participação/prestação artística no projeto cultural ${projectName}.`)}
      <table>
        <tbody>
          <tr><th>Projeto</th><td>${escapePdfHtml(projectName)}</td></tr>
          <tr><th>Rubrica</th><td>${escapePdfHtml(rubrica)}</td></tr>
          <tr><th>Função/atividade</th><td>${escapePdfHtml(beneficiaryRole || description)}</td></tr>
          <tr><th>Valor</th><td>${escapePdfHtml(value)}</td></tr>
          <tr><th>Data</th><td>${escapePdfHtml(date)}</td></tr>
          <tr><th>Forma de pagamento</th><td>${escapePdfHtml(paymentMethod)}</td></tr>
        </tbody>
      </table>
      ${paragraph("Dou plena quitação do valor acima descrito, para os devidos fins de prestação de contas.")}
    `;
  }

  if (type === "RPA / recibo para prestador PF") {
    return `
      ${paragraph(`Recibo emitido para registro de prestação de serviço por pessoa física no projeto cultural ${projectName}.`)}
      <table>
        <tbody>
          <tr><th>Prestador</th><td>${escapePdfHtml(beneficiaryName)}</td></tr>
          <tr><th>CPF</th><td>${escapePdfHtml(beneficiaryDocument)}</td></tr>
          <tr><th>Serviço prestado</th><td>${escapePdfHtml(description || beneficiaryRole)}</td></tr>
          <tr><th>Rubrica orçamentária</th><td>${escapePdfHtml(rubrica)}</td></tr>
          <tr><th>Valor bruto</th><td>${escapePdfHtml(value)}</td></tr>
          <tr><th>Data</th><td>${escapePdfHtml(date)}</td></tr>
          <tr><th>Forma de pagamento</th><td>${escapePdfHtml(paymentMethod)}</td></tr>
        </tbody>
      </table>
      ${paragraph("O presente recibo não substitui documento fiscal quando este for exigido pela legislação, edital ou órgão concedente.")}
    `;
  }

  if (type === "Declaração de recebimento") {
    return `
      ${paragraph(`Eu, ${beneficiaryName}, inscrito(a) no CPF/CNPJ sob nº ${beneficiaryDocument}, declaro para os devidos fins que recebi o valor de ${value}, referente a ${description || "serviço/atividade vinculada ao projeto cultural"}.`)}
      <table>
        <tbody>
          <tr><th>Projeto</th><td>${escapePdfHtml(projectName)}</td></tr>
          <tr><th>Rubrica</th><td>${escapePdfHtml(rubrica)}</td></tr>
          <tr><th>Data do recebimento</th><td>${escapePdfHtml(date)}</td></tr>
          <tr><th>Forma de pagamento</th><td>${escapePdfHtml(paymentMethod)}</td></tr>
        </tbody>
      </table>
      ${paragraph("Declaro, ainda, estar ciente de que este documento poderá compor a prestação de contas do projeto.")}
    `;
  }

  return `
    ${paragraph(`Encaminhamos para conferência e arquivamento financeiro o documento relativo ao projeto cultural ${projectName}.`)}
    <table>
      <tbody>
        <tr><th>Tipo de documento</th><td>${escapePdfHtml(type)}</td></tr>
        <tr><th>Rubrica</th><td>${escapePdfHtml(rubrica)}</td></tr>
        <tr><th>Favorecido/fornecedor</th><td>${escapePdfHtml(beneficiaryName)}</td></tr>
        <tr><th>CPF/CNPJ</th><td>${escapePdfHtml(beneficiaryDocument)}</td></tr>
        <tr><th>Valor relacionado</th><td>${escapePdfHtml(value)}</td></tr>
        <tr><th>Descrição</th><td>${escapePdfHtml(description)}</td></tr>
      </tbody>
    </table>
    ${notes ? paragraph(`Observações: ${notes}`) : ""}
  `;
}

export function FinancialDocumentGenerator({
  project,
  teamMembers,
}: {
  project: { id: string; name: string };
  teamMembers: TeamMember[];
}) {
  const [selectedType, setSelectedType] =
    useState<FinancialDocumentType>("Solicitação de pagamento");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryDocument, setBeneficiaryDocument] = useState("");
  const [beneficiaryRole, setBeneficiaryRole] = useState("");
  const [rubrica, setRubrica] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const selectedTemplate = useMemo(
    () => documentTypes.find((item) => item.type === selectedType) ?? documentTypes[0],
    [selectedType],
  );

  function selectMember(memberId: string) {
    setSelectedMemberId(memberId);

    const member = teamMembers.find((item) => item.id === memberId);

    if (!member) return;

    setBeneficiaryName(member.name);
    setBeneficiaryDocument(member.document);
    setBeneficiaryRole(member.role);
    setDescription((current) => current || member.role);
  }

  function generatePdf() {
    const bodyHtml = buildDocumentBody({
      type: selectedType,
      projectName: project.name,
      rubrica,
      beneficiaryName,
      beneficiaryDocument,
      beneficiaryRole,
      amount: makeMoney(amount),
      paymentDate,
      paymentMethod,
      description,
      notes,
    });

    openSystemPdf({
      title: selectedType,
      documentLabel: selectedType,
      preparedBy: "Marcel Eduardo Cabeça Domingues",
      fileName: `${selectedType.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${project.name}.pdf`,
      bodyHtml,
    });
  }

  return (
    <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
            Documentos financeiros
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Gerador de documentos para pagamento
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Gere solicitação, comprovante, recibo, RPA ou encaminhamento financeiro em PDF,
            usando dados da equipe ou fornecedor externo.
          </p>
        </div>

        <Button type="button" onClick={generatePdf}>
          <FileText className="size-4" />
          Gerar PDF
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {documentTypes.map((item) => {
          const Icon = item.icon;
          const selected = item.type === selectedType;

          return (
            <button
              key={item.type}
              type="button"
              onClick={() => setSelectedType(item.type)}
              className={
                selected
                  ? "rounded-2xl border border-primary bg-primary/10 p-4 text-left"
                  : "rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
              }
            >
              <Icon className="mb-3 size-5 text-primary" />
              <p className="font-black text-slate-950">{item.type}</p>
              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <selectedTemplate.icon className="size-5 text-primary" />
          <h3 className="font-black text-slate-950">{selectedTemplate.type}</h3>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Selecionar pessoa da equipe">
            <select
              className="form-input"
              value={selectedMemberId}
              onChange={(event) => selectMember(event.target.value)}
            >
              <option value="">Fornecedor externo/manual</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} — {member.role}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nome/Razão social">
            <input
              className="form-input"
              value={beneficiaryName}
              onChange={(event) => setBeneficiaryName(event.target.value)}
              placeholder="Nome do favorecido"
            />
          </Field>

          <Field label="CPF/CNPJ">
            <input
              className="form-input"
              value={beneficiaryDocument}
              onChange={(event) => setBeneficiaryDocument(event.target.value)}
              placeholder="CPF ou CNPJ"
            />
          </Field>

          <Field label="Função/serviço">
            <input
              className="form-input"
              value={beneficiaryRole}
              onChange={(event) => setBeneficiaryRole(event.target.value)}
              placeholder="Ex.: Técnico de som"
            />
          </Field>

          <Field label="Rubrica">
            <input
              className="form-input"
              value={rubrica}
              onChange={(event) => setRubrica(event.target.value)}
              placeholder="Ex.: Técnico de Som"
            />
          </Field>

          <Field label="Valor">
            <input
              className="form-input"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
            />
          </Field>

          <Field label="Data">
            <input
              className="form-input"
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          </Field>

          <Field label="Forma de pagamento">
            <select
              className="form-input"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option>Pix</option>
              <option>Transferência bancária</option>
              <option>Boleto</option>
              <option>Cartão</option>
              <option>Dinheiro</option>
              <option>Outro</option>
            </select>
          </Field>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Descrição/referência">
            <textarea
              className="form-input min-h-24"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva o serviço, compra ou pagamento..."
            />
          </Field>

          <Field label="Observações internas">
            <textarea
              className="form-input min-h-24"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observações do financeiro/prestação de contas..."
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
