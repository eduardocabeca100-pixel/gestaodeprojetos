"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Receipt, Trash2, UserRound } from "lucide-react";

type DemonstrativePerson = {
  id: string;
  type: "Equipe" | "Fornecedor";
  name: string;
  document: string;
  role: string;
  phone: string;
  address: string;
};

type DemonstrativeItem = {
  id: string;
  quantity: string;
  description: string;
  unitValue: string;
};

type Demonstrative = {
  id: string;
  number: string;
  docNumber: string;
  nfNumber: string;
  issueDate: string;
  dueDate: string;
  competence: string;
  status: string;
  payerName: string;
  payerDocument: string;
  payerAddress: string;
  payerContact: string;
  person: DemonstrativePerson;
  items: DemonstrativeItem[];
  reference: string;
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthCompetence() {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function formatDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function numberValue(value: string) {
  const parsed = Number(String(value || "0").replace(",", "."));
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
  number: "0001",
  docNumber: "411391",
  nfNumber: "",
  issueDate: todayIso(),
  dueDate: todayIso(),
  competence: monthCompetence(),
  status: "Rascunho",
  payerName: "Cia de Artes Viva",
  payerDocument: "CNPJ/CPF: preencher no cadastro",
  payerAddress: "Jaraguá do Sul | SC",
  payerContact: "Fone: (47) 992747545 - www.ciaviva.com - eduardo@ciaviva.com",
  person: {
    id: "person-1",
    type: "Equipe",
    name: "Julia Titz",
    document: "",
    role: "Atriz",
    phone: "",
    address: "Endereço não informado",
  },
  items: [
    {
      id: "item-1",
      quantity: "1",
      description: "PRESTAÇÃO DE SERVIÇO CULTURAL",
      unitValue: "0",
    },
  ],
  reference: "Serviços prestados ao projeto cultural. A quitação deste recibo se dará mediante comprovante de pagamento.",
};

function buildPdfHtml(demonstrative: Demonstrative) {
  const total = demonstrative.items.reduce((sum, item) => {
    return sum + numberValue(item.quantity) * numberValue(item.unitValue);
  }, 0);

  const rows = demonstrative.items
    .map((item) => {
      const quantity = numberValue(item.quantity);
      const unit = numberValue(item.unitValue);
      const subtotal = quantity * unit;

      return `
        <tr>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(item.description)}</td>
          <td>${currency(unit)}</td>
          <td>${currency(subtotal)}</td>
        </tr>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Demonstrativo ${escapeHtml(demonstrative.number)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    background: #f3f4f6;
    color: #111827;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10.5pt;
    line-height: 1.25;
  }
  .sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 16px auto;
    background: #fff;
    padding: 14mm;
    box-shadow: 0 20px 60px rgba(0,0,0,.12);
  }
  .box {
    border: 1.5px solid #111827;
    border-radius: 10px;
    overflow: hidden;
  }
  .header {
    display: grid;
    grid-template-columns: 34mm 1fr;
    gap: 8mm;
    padding: 8mm;
    border-bottom: 1.5px solid #111827;
  }
  .logo {
    width: 24mm;
    height: 24mm;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #173b8f;
    color: #fff;
    font-weight: 900;
  }
  h1 {
    margin: 0;
    font-size: 15pt;
    font-weight: 900;
    text-transform: uppercase;
  }
  .muted { color: #4b5563; }
  .meta {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-bottom: 1.5px solid #111827;
  }
  .meta div {
    padding: 3mm;
    border-right: 1px solid #111827;
    font-size: 9pt;
    font-weight: 700;
  }
  .meta div:last-child { border-right: 0; }
  .person {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1.5px solid #111827;
  }
  .person div {
    padding: 4mm;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border-right: 1px solid #111827;
    border-bottom: 1px solid #111827;
    padding: 3mm;
    text-align: left;
  }
  th:last-child, td:last-child { border-right: 0; }
  th {
    background: #f3f4f6;
    font-weight: 900;
  }
  .total {
    padding: 5mm;
    text-align: right;
    font-size: 13pt;
    font-weight: 900;
  }
  .footer {
    padding: 5mm;
    border-top: 1.5px solid #111827;
    font-size: 9.5pt;
  }
  @media print {
    body { background: #fff; }
    .sheet { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
  <section class="sheet">
    <div class="box">
      <div class="header">
        <div class="logo">VIVA</div>
        <div>
          <h1>${escapeHtml(demonstrative.payerName)}</h1>
          <p class="muted">Demonstrativo administrativo de pagamento</p>
          <p>${escapeHtml(demonstrative.payerAddress)}</p>
          <p>${escapeHtml(demonstrative.payerContact)}</p>
          <p>${escapeHtml(demonstrative.payerDocument)}</p>
        </div>
      </div>

      <div class="meta">
        <div>Nº ${escapeHtml(demonstrative.number)}</div>
        <div>Doc. ${escapeHtml(demonstrative.docNumber)}</div>
        <div>NF ${escapeHtml(demonstrative.nfNumber || "-")}</div>
        <div>${formatDate(demonstrative.issueDate)}</div>
        <div>${formatDate(demonstrative.dueDate)}</div>
      </div>

      <div class="person">
        <div>
          <strong>${escapeHtml(demonstrative.person.name)}</strong><br />
          ${escapeHtml(demonstrative.person.role)}<br />
          ${escapeHtml(demonstrative.person.address)}
        </div>
        <div>
          <strong>CPF/CNPJ:</strong> ${escapeHtml(demonstrative.person.document || "-")}<br />
          <strong>Fone:</strong> ${escapeHtml(demonstrative.person.phone || "-")}<br />
          <strong>Status:</strong> ${escapeHtml(demonstrative.status)}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 18mm;">Quant.</th>
            <th>Discriminação</th>
            <th style="width: 32mm;">Unit.</th>
            <th style="width: 32mm;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="total">TOTAL: ${currency(total)}</div>

      <div class="footer">
        <p><strong>Ref. competência:</strong> ${escapeHtml(demonstrative.competence)}</p>
        <p><strong>Referência:</strong> ${escapeHtml(demonstrative.reference)}</p>
      </div>
    </div>
  </section>
</body>
</html>`;
}

function printDemonstrative(html: string) {
  if (typeof window === "undefined") return;

  const frameId = "viva-demonstrative-frame";
  const oldFrame = window.document.getElementById(frameId);
  oldFrame?.remove();

  const iframe = window.document.createElement("iframe");
  iframe.id = frameId;
  iframe.title = "Demonstrativo";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  window.document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    window.alert("Não foi possível preparar o demonstrativo.");
    iframe.remove();
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  window.setTimeout(() => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } catch {
      window.alert("Não foi possível abrir a impressão do demonstrativo.");
    }

    window.setTimeout(() => iframe.remove(), 1500);
  }, 300);
}

export function AdministrativeDemonstratives() {
  const [demonstratives, setDemonstratives] = useState<Demonstrative[]>([initialDemonstrative]);
  const [activeId, setActiveId] = useState(initialDemonstrative.id);

  const active = demonstratives.find((item) => item.id === activeId) ?? demonstratives[0];

  const total = useMemo(() => {
    return active.items.reduce((sum, item) => {
      return sum + numberValue(item.quantity) * numberValue(item.unitValue);
    }, 0);
  }, [active]);

  function updateActive(patch: Partial<Demonstrative>) {
    setDemonstratives((current) =>
      current.map((item) =>
        item.id === active.id ? { ...item, ...patch } : item,
      ),
    );
  }

  function updatePerson(patch: Partial<DemonstrativePerson>) {
    updateActive({
      person: {
        ...active.person,
        ...patch,
      },
    });
  }

  function updateItem(itemId: string, patch: Partial<DemonstrativeItem>) {
    updateActive({
      items: active.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
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

  function addDemonstrative(type: DemonstrativePerson["type"]) {
    const next: Demonstrative = {
      ...initialDemonstrative,
      id: makeId("demo"),
      number: String(demonstratives.length + 1).padStart(4, "0"),
      person: {
        ...initialDemonstrative.person,
        id: makeId("person"),
        type,
        name: type === "Equipe" ? "Nova pessoa da equipe" : "Novo fornecedor",
      },
    };

    setDemonstratives((current) => [next, ...current]);
    setActiveId(next.id);
  }

  function removeActive() {
    if (demonstratives.length <= 1) return;
    const next = demonstratives.filter((item) => item.id !== active.id);
    setDemonstratives(next);
    setActiveId(next[0].id);
  }

  function generatePdf() {
    printDemonstrative(buildPdfHtml(active));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-black text-slate-950">Demonstrativos</h3>
        <p className="text-sm text-slate-500">Equipe e fornecedores.</p>

        <div className="mt-4 grid gap-2">
          <button type="button" className="btn-primary justify-center" onClick={() => addDemonstrative("Equipe")}>
            <UserRound className="size-4" />
            Novo para equipe
          </button>

          <button type="button" className="btn-secondary justify-center" onClick={() => addDemonstrative("Fornecedor")}>
            <Plus className="size-4" />
            Novo fornecedor
          </button>
        </div>

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
              <p className="mt-1 text-sm text-slate-500">{demo.person.name}</p>
              <p className="mt-1 text-sm font-black text-primary">{currency(total)}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">Editar demonstrativo</h3>
            <p className="text-sm text-slate-500">Documento administrativo para controle de pagamento.</p>
          </div>

          <button type="button" className="btn-primary" onClick={generatePdf}>
            <Download className="size-4" />
            Gerar PDF
          </button>
        </div>

        <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-3 text-sm font-black text-emerald-900">
            Cabeçalho do demonstrativo
          </p>

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

          <Field label="Tipo">
            <select className="form-input" value={active.person.type} onChange={(event) => updatePerson({ type: event.target.value as DemonstrativePerson["type"] })}>
              <option>Equipe</option>
              <option>Fornecedor</option>
            </select>
          </Field>

          <Field label="Status">
            <select className="form-input" value={active.status} onChange={(event) => updateActive({ status: event.target.value })}>
              <option>Rascunho</option>
              <option>Conferido</option>
              <option>Pago</option>
              <option>Cancelado</option>
            </select>
          </Field>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Nome/Razão social">
            <input className="form-input" value={active.person.name} onChange={(event) => updatePerson({ name: event.target.value })} />
          </Field>

          <Field label="CPF/CNPJ">
            <input className="form-input" value={active.person.document} onChange={(event) => updatePerson({ document: event.target.value })} />
          </Field>

          <Field label="Função/serviço">
            <input className="form-input" value={active.person.role} onChange={(event) => updatePerson({ role: event.target.value })} />
          </Field>

          <Field label="Telefone">
            <input className="form-input" value={active.person.phone} onChange={(event) => updatePerson({ phone: event.target.value })} />
          </Field>

          <Field label="Endereço do favorecido">
            <input className="form-input" value={active.person.address} onChange={(event) => updatePerson({ address: event.target.value })} />
          </Field>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-black text-slate-950">Itens</h4>
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

        <div className="mt-4">
          <Field label="Referência">
            <textarea className="form-input min-h-24" value={active.reference} onChange={(event) => updateActive({ reference: event.target.value })} />
          </Field>
        </div>

        {demonstratives.length > 1 ? (
          <button type="button" className="btn-danger mt-4" onClick={removeActive}>
            <Trash2 className="size-4" />
            Excluir demonstrativo
          </button>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Prévia</p>
            <h3 className="text-lg font-black text-slate-950">Demonstrativo</h3>
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
              <p className="font-black">{active.payerName.toUpperCase()}</p>
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
              <p className="font-black">{active.person.name.toUpperCase()}</p>
              <p>{active.person.address}</p>
            </div>
            <div className="p-3">
              <p><strong>CPF/CNPJ:</strong> {active.person.document || "-"}</p>
              <p><strong>Fone:</strong> {active.person.phone || "-"}</p>
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

          <div className="mt-4 text-[10px]">
            <p><strong>Ref. competência:</strong> {active.competence}</p>
            <p><strong>Referência:</strong> {active.reference}</p>
          </div>
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
