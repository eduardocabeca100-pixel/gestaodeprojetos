"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { escapePdfHtml, openSystemPdf } from "@/lib/pdf/pdf-template";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { TeamMember } from "@/modules/team/types";

const documentTypes = [
  "Solicitação de pagamento",
  "Comprovante de pagamento",
  "Recibo simples para artista/ator",
  "RPA / recibo para prestador PF",
  "Declaração de recebimento",
  "Encaminhamento de nota/recibo",
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateBr(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function money(value: string) {
  const parsed = Number(String(value || "0").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildBody({
  type,
  projectName,
  beneficiaryName,
  beneficiaryDocument,
  beneficiaryRole,
  rubrica,
  amount,
  date,
  paymentMethod,
  description,
  notes,
}: {
  type: string;
  projectName: string;
  beneficiaryName: string;
  beneficiaryDocument: string;
  beneficiaryRole: string;
  rubrica: string;
  amount: number;
  date: string;
  paymentMethod: string;
  description: string;
  notes: string;
}) {
  const value = formatCurrency(amount);

  return `
    <p>Documento financeiro emitido para controle interno, pagamento e prestação de contas do projeto cultural <strong>${escapePdfHtml(projectName)}</strong>.</p>

    <table>
      <tbody>
        <tr><th>Tipo de documento</th><td>${escapePdfHtml(type)}</td></tr>
        <tr><th>Favorecido</th><td>${escapePdfHtml(beneficiaryName)}</td></tr>
        <tr><th>CPF/CNPJ</th><td>${escapePdfHtml(beneficiaryDocument)}</td></tr>
        <tr><th>Função/serviço</th><td>${escapePdfHtml(beneficiaryRole)}</td></tr>
        <tr><th>Rubrica</th><td>${escapePdfHtml(rubrica)}</td></tr>
        <tr><th>Valor</th><td>${escapePdfHtml(value)}</td></tr>
        <tr><th>Data</th><td>${escapePdfHtml(formatDateBr(date))}</td></tr>
        <tr><th>Forma de pagamento</th><td>${escapePdfHtml(paymentMethod)}</td></tr>
        <tr><th>Descrição</th><td>${escapePdfHtml(description)}</td></tr>
      </tbody>
    </table>

    ${
      type.includes("Recibo") || type.includes("Declaração")
        ? `<p>Declaro, para os devidos fins, o recebimento do valor acima indicado, referente à atividade/serviço descrito neste documento.</p>`
        : `<p>Este documento deve ser acompanhado da nota fiscal, recibo, comprovante bancário ou demais anexos financeiros aplicáveis.</p>`
    }

    ${notes ? `<p><strong>Observações:</strong> ${escapePdfHtml(notes)}</p>` : ""}
  `;
}

export function FinancialDocumentGenerator({
  project,
  teamMembers,
}: {
  project: { id: string; name: string };
  teamMembers: TeamMember[];
}) {
  const [type, setType] = useState(documentTypes[0]);
  const [memberId, setMemberId] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryDocument, setBeneficiaryDocument] = useState("");
  const [beneficiaryRole, setBeneficiaryRole] = useState("");
  const [rubrica, setRubrica] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const selectedMember = useMemo(
    () => teamMembers.find((member) => member.id === memberId),
    [memberId, teamMembers],
  );

  function selectMember(nextMemberId: string) {
    setMemberId(nextMemberId);

    const member = teamMembers.find((item) => item.id === nextMemberId);

    if (!member) return;

    setBeneficiaryName(member.name);
    setBeneficiaryDocument(member.document);
    setBeneficiaryRole(member.role);
    setDescription((current) => current || member.role);
    setAmount((current) => current || String(member.expectedAmount || ""));
  }

  function generatePdf() {
    openSystemPdf({
      title: type,
      documentLabel: type,
      preparedBy: "Marcel Eduardo Cabeça Domingues",
      fileName: `${type.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${project.name}.pdf`,
      bodyHtml: buildBody({
        type,
        projectName: project.name,
        beneficiaryName,
        beneficiaryDocument,
        beneficiaryRole,
        rubrica,
        amount: money(amount),
        date,
        paymentMethod,
        description,
        notes,
      }),
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
            Gerador de documentos de pagamento
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Gere solicitação de pagamento, comprovante, recibo, RPA, declaração de recebimento ou encaminhamento financeiro.
          </p>
        </div>

        <Button type="button" onClick={generatePdf}>
          <FileText className="size-4" />
          Gerar PDF
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Tipo de documento">
          <select className="form-input" value={type} onChange={(event) => setType(event.target.value)}>
            {documentTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>

        <Field label="Pessoa da equipe ou fornecedor">
          <select className="form-input" value={memberId} onChange={(event) => selectMember(event.target.value)}>
            <option value="">Fornecedor externo/manual</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} — {member.role}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nome/Razão social">
          <input className="form-input" value={beneficiaryName} onChange={(event) => setBeneficiaryName(event.target.value)} />
        </Field>

        <Field label="CPF/CNPJ">
          <input className="form-input" value={beneficiaryDocument} onChange={(event) => setBeneficiaryDocument(event.target.value)} />
        </Field>

        <Field label="Função/serviço">
          <input className="form-input" value={beneficiaryRole} onChange={(event) => setBeneficiaryRole(event.target.value)} />
        </Field>

        <Field label="Rubrica">
          <input className="form-input" value={rubrica} onChange={(event) => setRubrica(event.target.value)} />
        </Field>

        <Field label="Valor">
          <input className="form-input" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </Field>

        <Field label="Data">
          <input className="form-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>

        <Field label="Forma de pagamento">
          <select className="form-input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
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
        <Field label="Descrição">
          <textarea className="form-input min-h-24" value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>

        <Field label="Observações">
          <textarea className="form-input min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>

      {selectedMember ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Selecionado: {selectedMember.name} — {selectedMember.role}
        </p>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
