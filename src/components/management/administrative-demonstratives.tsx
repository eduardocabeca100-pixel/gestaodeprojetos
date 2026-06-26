"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Receipt, Trash2, UserRound } from "lucide-react";

import { printHtmlInHiddenFrame } from "@/lib/browser/print-html";

type TeamOption = {
  id?: string;
  name?: string;
  role?: string;
  document?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

type DemonstrativeItem = {
  id: string;
  quantity: string;
  description: string;
  unitValue: string;
};

type Demonstrative = {
  id: string;
  kind: "RECIBO" | "DEMONSTRATIVO";
  number: string;
  docNumber: string;
  nfNumber: string;
  issueDate: string;
  dueDate: string;
  competence: string;
  payerName: string;
  payerAddress: string;
  payerContact: string;
  payerDocument: string;
  beneficiaryName: string;
  beneficiaryDocument: string;
  beneficiaryAddress: string;
  beneficiaryPhone: string;
  beneficiaryCode: string;
  beneficiaryRole: string;
  referenceTitle: string;
  paymentText: string;
  items: DemonstrativeItem[];
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Intl.DateTimeFormat("pt-BR", { month: "2-digit", year: "numeric" }).format(new Date());
}

function formatDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function numberValue(value: string) {
  const normalized = String(value || "0").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function escapeHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const initialDemonstrative: Demonstrative = {
  id: "demo-1",
  kind: "RECIBO",
  number: "0001",
  docNumber: "411391",
  nfNumber: "",
  issueDate: todayIso(),
  dueDate: todayIso(),
  competence: currentMonth(),
  payerName: "CIA DE ARTES VIVA",
  payerAddress: "Jaraguá do Sul | SC",
  payerContact: "Fone: (47) 992747545 - www.ciaviva.com - eduardo@ciaviva.com",
  payerDocument: "CNPJ/CPF: preencher no cadastro da companhia",
  beneficiaryName: "Julia Titz",
  beneficiaryDocument: "",
  beneficiaryAddress: "Endereço não informado",
  beneficiaryPhone: "",
  beneficiaryCode: "",
  beneficiaryRole: "Atriz",
  referenceTitle: "SERVIÇOS CULTURAIS PRESTADOS AO PROJETO",
  paymentText: "A quitação deste recibo se dará mediante ao comprovante de pagamento.",
  items: [
    {
      id: "item-1",
      quantity: "1",
      description: "PRESTAÇÃO DE SERVIÇO CULTURAL",
      unitValue: "0",
    },
  ],
};

function getTotal(demo: Demonstrative) {
  return demo.items.reduce((sum, item) => {
    return sum + numberValue(item.quantity) * numberValue(item.unitValue);
  }, 0);
}

function buildBlockHtml(demo: Demonstrative, title: "RECIBO" | "Demonstrativo") {
  const total = getTotal(demo);

  const rows = demo.items.map((item) => {
    const quantity = numberValue(item.quantity);
    const unitValue = numberValue(item.unitValue);
    const rowTotal = quantity * unitValue;

    return `
      <tr>
        <td class="center">${escapeHtml(item.quantity)}</td>
        <td class="desc">${escapeHtml(item.description)}</td>
        <td class="money">${currency(unitValue)}</td>
        <td class="money">${currency(rowTotal)}</td>
      </tr>
    `;
  }).join("");

  return `
    <section class="doc-block">
      <header class="doc-header">
        <div class="logo">VIVA</div>
        <div class="header-text">
          <strong>${escapeHtml(demo.payerName)}</strong><br />
          ${escapeHtml(demo.payerAddress)}<br />
          ${escapeHtml(demo.payerContact)}<br />
          ${escapeHtml(demo.payerDocument)}
        </div>
      </header>

      <div class="doc-meta">
        <div><strong>${title}</strong> Nº ${escapeHtml(demo.number)}</div>
        <div><strong>Nº Doc.:</strong> ${escapeHtml(demo.docNumber)}</div>
        <div><strong>Nº NF.:</strong> ${escapeHtml(demo.nfNumber || "-")}</div>
        <div><strong>Emissão:</strong> ${formatDate(demo.issueDate)}</div>
        <div><strong>Vencimento:</strong> ${formatDate(demo.dueDate)}</div>
      </div>

      <div class="beneficiary">
        <div>
          <strong>${escapeHtml(demo.beneficiaryName.toUpperCase())}</strong><br />
          ${escapeHtml(demo.beneficiaryAddress)}<br />
          ${escapeHtml(demo.beneficiaryRole)}
        </div>
        <div>
          <strong>CPF/CNPJ:</strong> ${escapeHtml(demo.beneficiaryDocument || "-")}<br />
          <strong>Fone:</strong> ${escapeHtml(demo.beneficiaryPhone || "-")}<br />
          <strong>Cód.:</strong> ${escapeHtml(demo.beneficiaryCode || "-")}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Quant.</th>
            <th>Discriminação</th>
            <th>Valor Unitário</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="summary">
        <div>
          <strong>${escapeHtml(demo.beneficiaryName.toUpperCase())}</strong><br />
          <em>Ref. competência: ${escapeHtml(demo.competence)}</em><br />
          ${escapeHtml(demo.referenceTitle)}
        </div>
        <div class="summary-values">
          <strong>TOTAL: ${currency(total)}</strong><br />
          <strong>VALOR PARCELA: ${currency(total)}</strong>
        </div>
      </div>

      <div class="signature">
        <div>
          Recebido em: ______/______/_______<br />
          ${escapeHtml(demo.paymentText)}
        </div>
        <div class="sig-line">
          ___________________________________________<br />
          Assinatura
        </div>
      </div>
    </section>
  `;
}

function buildPdfHtml(demo: Demonstrative) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Demonstrativo ${escapeHtml(demo.number)}</title>
<style>
  @page { size: A4; margin: 8mm; }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    margin: 0;
    background: #f3f4f6;
    color: #111;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 8.3pt;
    line-height: 1.18;
  }

  .sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #fff;
    padding: 4mm;
  }

  .doc-block {
    min-height: 103mm;
    border: 1.5px solid #111;
    margin-bottom: 3mm;
    overflow: hidden;
  }

  .doc-block + .doc-block {
    border-top-style: dashed;
  }

  .doc-header {
    display: grid;
    grid-template-columns: 28mm 1fr;
    gap: 5mm;
    padding: 2.5mm 4mm 2mm;
  }

  .logo {
    width: 20mm;
    height: 20mm;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #173b8f;
    color: #fff;
    font-weight: 900;
    font-size: 8pt;
  }

  .header-text {
    font-size: 8.2pt;
  }

  .doc-meta {
    display: grid;
    grid-template-columns: 1.1fr 1fr .8fr 1fr 1fr;
    border-top: 1.5px solid #111;
    border-bottom: 1.5px solid #111;
  }

  .doc-meta div {
    padding: 2mm;
    border-right: 1px solid #111;
    font-size: 8.2pt;
    font-weight: 700;
  }

  .doc-meta div:last-child {
    border-right: 0;
  }

  .beneficiary {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    padding: 2mm 3mm;
    border-bottom: 1.5px solid #111;
    font-weight: 700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  th, td {
    border-right: 1px solid #111;
    border-bottom: 1px solid #111;
    padding: 1.1mm;
  }

  th:last-child, td:last-child {
    border-right: 0;
  }

  th {
    font-weight: 900;
    text-align: center;
    background: #f5f5f5;
  }

  .center {
    text-align: center;
    width: 18mm;
  }

  .desc {
    font-family: "Courier New", monospace;
    text-align: center;
  }

  .money {
    text-align: right;
    width: 32mm;
    white-space: nowrap;
  }


  .summary {
    display: grid;
    grid-template-columns: 1fr 48mm;
    gap: 8mm;
    padding: 1.8mm 3mm 1mm;
    min-height: 10mm;
  }

  .summary-values {
    text-align: right;
    font-size: 9pt;
    line-height: 1.5;
  }

  .signature {
    display: grid;
    grid-template-columns: 1fr 70mm;
    gap: 8mm;
    padding: 0 3mm 1.5mm;
    align-items: end;
  }

  .sig-line {
    text-align: center;
    font-family: "Courier New", monospace;
  }

  @media print {
    body { background: #fff; }
    .sheet { margin: 0; }
  }
</style>
</head>
<body>
  <main class="sheet">
    ${buildBlockHtml(demo, "RECIBO")}
    ${buildBlockHtml({ ...demo, kind: "DEMONSTRATIVO" }, "Demonstrativo")}
  </main>
</body>
</html>`;
}

export function AdministrativeDemonstratives({
  teamMembers = [],
}: {
  teamMembers?: TeamOption[];
}) {
  const [demonstratives, setDemonstratives] = useState<Demonstrative[]>([initialDemonstrative]);
  const [activeId, setActiveId] = useState(initialDemonstrative.id);

  const active = demonstratives.find((demo) => demo.id === activeId) ?? demonstratives[0];
  const total = useMemo(() => getTotal(active), [active]);

  function updateActive(patch: Partial<Demonstrative>) {
    setDemonstratives((current) =>
      current.map((demo) => (demo.id === active.id ? { ...demo, ...patch } : demo)),
    );
  }

  function updateItem(itemId: string, patch: Partial<DemonstrativeItem>) {
    updateActive({
      items: active.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    });
  }

  function selectTeamMember(memberId: string) {
    const member = teamMembers.find((item) => String(item.id) === memberId);
    if (!member) return;

    updateActive({
      beneficiaryName: member.name || active.beneficiaryName,
      beneficiaryRole: member.role || active.beneficiaryRole,
      beneficiaryDocument: member.document || active.beneficiaryDocument,
      beneficiaryPhone: member.phone || active.beneficiaryPhone,
    });
  }

  function addDemonstrative() {
    const next: Demonstrative = {
      ...initialDemonstrative,
      id: makeId("demo"),
      number: String(demonstratives.length + 1).padStart(4, "0"),
    };

    setDemonstratives((current) => [next, ...current]);
    setActiveId(next.id);
  }

  function addItem() {
    updateActive({
      items: [
        ...active.items,
        {
          id: makeId("item"),
          quantity: "1",
          description: "PRESTAÇÃO DE SERVIÇO CULTURAL",
          unitValue: "0",
        },
      ],
    });
  }

  function removeItem(itemId: string) {
    updateActive({
      items: active.items.filter((item) => item.id !== itemId),
    });
  }

  function generatePdf() {
    printHtmlInHiddenFrame(buildPdfHtml(active), "Demonstrativo");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-black text-slate-950">Demonstrativos</h3>
        <p className="text-sm text-slate-500">Recibos e demonstrativos administrativos.</p>

        <button type="button" className="btn-primary mt-4 w-full justify-center" onClick={addDemonstrative}>
          <Plus className="size-4" />
          Novo demonstrativo
        </button>

        <div className="mt-4 space-y-2">
          {demonstratives.map((demo) => (
            <button
              key={demo.id}
              type="button"
              className={
                demo.id === active.id
                  ? "w-full rounded-2xl border border-primary bg-primary/10 p-4 text-left"
                  : "w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"
              }
              onClick={() => setActiveId(demo.id)}
            >
              <p className="font-black text-slate-950">Nº {demo.number}</p>
              <p className="mt-1 text-sm text-slate-500">{demo.beneficiaryName}</p>
              <p className="mt-1 text-sm font-black text-primary">{currency(getTotal(demo))}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-950">Editar demonstrativo</h3>
            <p className="text-sm text-slate-500">Modelo com recibo e demonstrativo na mesma folha.</p>
          </div>

          <button type="button" className="btn-primary" onClick={generatePdf}>
            <Download className="size-4" />
            Gerar PDF
          </button>
        </div>

        <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-3 text-sm font-black text-emerald-900">Cabeçalho do emitente</p>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Instituição / emitente">
              <input className="form-input" value={active.payerName} onChange={(event) => updateActive({ payerName: event.target.value })} />
            </Field>

            <Field label="CNPJ/CPF do emitente">
              <input className="form-input" value={active.payerDocument} onChange={(event) => updateActive({ payerDocument: event.target.value })} />
            </Field>

            <Field label="Endereço do emitente">
              <input className="form-input" value={active.payerAddress} onChange={(event) => updateActive({ payerAddress: event.target.value })} />
            </Field>

            <Field label="Contato do emitente">
              <input className="form-input" value={active.payerContact} onChange={(event) => updateActive({ payerContact: event.target.value })} />
            </Field>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Número">
            <input className="form-input" value={active.number} onChange={(event) => updateActive({ number: event.target.value })} />
          </Field>

          <Field label="Nº doc.">
            <input className="form-input" value={active.docNumber} onChange={(event) => updateActive({ docNumber: event.target.value })} />
          </Field>

          <Field label="Nº NF.">
            <input className="form-input" value={active.nfNumber} onChange={(event) => updateActive({ nfNumber: event.target.value })} />
          </Field>

          <Field label="Emissão">
            <input className="form-input" type="date" value={active.issueDate} onChange={(event) => updateActive({ issueDate: event.target.value })} />
          </Field>

          <Field label="Vencimento">
            <input className="form-input" type="date" value={active.dueDate} onChange={(event) => updateActive({ dueDate: event.target.value })} />
          </Field>

          <Field label="Competência">
            <input className="form-input" value={active.competence} onChange={(event) => updateActive({ competence: event.target.value })} />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Selecionar pessoa da equipe">
            <select className="form-input" defaultValue="" onChange={(event) => selectTeamMember(event.target.value)}>
              <option value="">Escolha uma pessoa...</option>
              {teamMembers.map((member) => (
                <option key={String(member.id)} value={String(member.id)}>
                  {member.name} — {member.role || "Equipe"}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Nome/Razão social">
            <input className="form-input" value={active.beneficiaryName} onChange={(event) => updateActive({ beneficiaryName: event.target.value })} />
          </Field>

          <Field label="CPF/CNPJ">
            <input className="form-input" value={active.beneficiaryDocument} onChange={(event) => updateActive({ beneficiaryDocument: event.target.value })} />
          </Field>

          <Field label="Função/serviço">
            <input className="form-input" value={active.beneficiaryRole} onChange={(event) => updateActive({ beneficiaryRole: event.target.value })} />
          </Field>

          <Field label="Telefone">
            <input className="form-input" value={active.beneficiaryPhone} onChange={(event) => updateActive({ beneficiaryPhone: event.target.value })} />
          </Field>

          <Field label="Endereço do favorecido">
            <input className="form-input" value={active.beneficiaryAddress} onChange={(event) => updateActive({ beneficiaryAddress: event.target.value })} />
          </Field>

          <Field label="Código associado / interno">
            <input className="form-input" value={active.beneficiaryCode} onChange={(event) => updateActive({ beneficiaryCode: event.target.value })} />
          </Field>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-black text-slate-950">Itens do demonstrativo</h4>
            <button type="button" className="btn-primary" onClick={addItem}>
              <Plus className="size-4" />
              Item
            </button>
          </div>

          <div className="space-y-3">
            {active.items.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[80px_1fr_140px_44px]">
                <input className="form-input" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} />
                <input className="form-input" value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} />
                <input className="form-input" value={item.unitValue} onChange={(event) => updateItem(item.id, { unitValue: event.target.value })} />
                <button type="button" className="rounded-xl text-red-600 hover:bg-red-50" onClick={() => removeItem(item.id)}>
                  <Trash2 className="mx-auto size-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 text-right text-xl font-black text-slate-950">
            Total: {currency(total)}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <Field label="Referência / locação / descrição geral">
            <input className="form-input" value={active.referenceTitle} onChange={(event) => updateActive({ referenceTitle: event.target.value })} />
          </Field>

          <Field label="Texto de quitação no rodapé">
            <textarea className="form-input min-h-20" value={active.paymentText} onChange={(event) => updateActive({ paymentText: event.target.value })} />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Prévia</p>
            <h3 className="text-lg font-black text-slate-950">Recibo + demonstrativo</h3>
          </div>

          <button type="button" className="btn-primary" onClick={generatePdf}>
            <Download className="size-4" />
            PDF
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-900 bg-white p-4 text-xs">
          <div className="flex gap-3 border-b border-slate-900 pb-3">
            <div className="grid size-12 place-items-center rounded-full bg-blue-900 text-xs font-black text-white">
              VIVA
            </div>
            <div>
              <p className="font-black">{active.payerName}</p>
              <p>{active.payerAddress}</p>
              <p>{active.payerContact}</p>
              <p>{active.payerDocument}</p>
            </div>
          </div>

          <div className="grid grid-cols-5 border-b border-slate-900 text-[10px] font-bold">
            <div className="p-2">Nº {active.number}</div>
            <div className="p-2">Doc. {active.docNumber}</div>
            <div className="p-2">NF {active.nfNumber || "-"}</div>
            <div className="p-2">{formatDate(active.issueDate)}</div>
            <div className="p-2">{formatDate(active.dueDate)}</div>
          </div>

          <div className="grid grid-cols-2 border-b border-slate-900">
            <div className="p-3">
              <p className="font-black">{active.beneficiaryName.toUpperCase()}</p>
              <p>{active.beneficiaryAddress}</p>
              <p>{active.beneficiaryRole}</p>
            </div>
            <div className="p-3">
              <p><strong>CPF/CNPJ:</strong> {active.beneficiaryDocument || "-"}</p>
              <p><strong>Fone:</strong> {active.beneficiaryPhone || "-"}</p>
              <p><strong>Cód.:</strong> {active.beneficiaryCode || "-"}</p>
            </div>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border-b border-slate-900 p-2 text-left">Quant.</th>
                <th className="border-b border-slate-900 p-2 text-left">Discriminação</th>
                <th className="border-b border-slate-900 p-2 text-left">Unit.</th>
                <th className="border-b border-slate-900 p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {active.items.map((item) => {
                const subtotal = numberValue(item.quantity) * numberValue(item.unitValue);

                return (
                  <tr key={item.id}>
                    <td className="border-b border-slate-200 p-2">{item.quantity}</td>
                    <td className="border-b border-slate-200 p-2">{item.description}</td>
                    <td className="border-b border-slate-200 p-2">{currency(numberValue(item.unitValue))}</td>
                    <td className="border-b border-slate-200 p-2">{currency(subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="mt-3 text-right text-base font-black">TOTAL: {currency(total)}</p>
          <p className="mt-3 text-[10px]"><strong>Ref. competência:</strong> {active.competence}</p>
          <p className="text-[10px]"><strong>Referência:</strong> {active.referenceTitle}</p>
        </div>
      </section>
    </div>
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
