"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Download, Plus, ReceiptText, Trash2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { escapePdfHtml, getPdfSettings } from "@/lib/pdf/pdf-template";
import { getActiveProjectScope, projectScopedKey } from "@/lib/project-scope";
import { formatCurrency } from "@/lib/utils/format-currency";

type Item = {
  id: string;
  quantity: number;
  description: string;
  unitValue: number;
};

type Demonstrative = {
  id: string;
  number: string;
  docNumber: string;
  nfNumber: string;
  issueDate: string;
  dueDate: string;
  competence: string;
  project: string;
  recipientType: "Equipe" | "Fornecedor";
  recipientName: string;
  recipientDocument: string;
  recipientAddress: string;
  recipientPhone: string;
  associateCode: string;
  issuerName: string;
  issuerAddress: string;
  issuerContactLine: string;
  issuerDocumentLine: string;
  reference: string;
  paymentNote: string;
  status: "Rascunho" | "Emitido" | "Pago" | "Vencido";
  items: Item[];
};

declare global {
  interface Window {
    __vivaOriginalOpen?: typeof window.open;
  }
}

type TeamPerson = {
  name: string;
  role?: string;
  document?: string;
  phone?: string;
  address?: string;
};

const storageKeyBase = "viva:central-cultural:demonstratives:v4";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readTeamPeople(): TeamPerson[] {
  const roster = readJson<Array<Record<string, unknown>>>("viva:team-roster:v1", []);

  return roster
    .map((person) => ({
      name: String(person.name || person.fullName || "Pessoa sem nome"),
      role: String(person.role || person.rubric || ""),
      document: String(person.cpf || person.cnpj || person.document || ""),
      phone: String(person.phone || person.telefone || ""),
      address: String(person.address || person.endereco || ""),
    }))
    .filter((person) => person.name !== "Pessoa sem nome");
}

function getIssuerDefaults() {
  const settings = getPdfSettings();
  const contact = [
    settings.phone ? `Fone: ${settings.phone}` : "",
    settings.site || "",
    settings.email || "",
  ].filter(Boolean);

  return {
    issuerName: settings.companyName || "Cia de Artes Viva",
    issuerAddress: settings.cityUf || "Jaraguá do Sul | SC",
    issuerContactLine: contact.join(" - ") || "Contato não informado",
    issuerDocumentLine: settings.cnpj ? `CNPJ: ${settings.cnpj}` : "CNPJ/CPF: preencher no cadastro da companhia",
  };
}

function newDemo(index: number): Demonstrative {
  const today = new Date().toISOString().slice(0, 10);
  const project = getActiveProjectScope();
  const issuer = getIssuerDefaults();

  return {
    id: makeId("demo"),
    number: String(index).padStart(4, "0"),
    docNumber: String(Date.now()).slice(-6),
    nfNumber: "",
    issueDate: today,
    dueDate: today,
    competence: today.slice(0, 7),
    project: project.name,
    recipientType: "Equipe",
    recipientName: "",
    recipientDocument: "",
    recipientAddress: "",
    recipientPhone: "",
    associateCode: "",
    ...issuer,
    reference: `[${project.name}] Serviço/atividade vinculada ao projeto cultural`,
    paymentNote: "A quitação deste recibo se dará mediante comprovante de pagamento.",
    status: "Rascunho",
    items: [
      {
        id: makeId("item"),
        quantity: 1,
        description: "Prestação de serviço cultural",
        unitValue: 0,
      },
    ],
  };
}

function normalizeDemo(demo: Partial<Demonstrative>, index: number): Demonstrative {
  const base = newDemo(index + 1);

  return {
    ...base,
    ...demo,
    id: demo.id || base.id,
    nfNumber: demo.nfNumber || "",
    associateCode: demo.associateCode || "",
    issuerName: demo.issuerName || base.issuerName,
    issuerAddress: demo.issuerAddress || base.issuerAddress,
    issuerContactLine: demo.issuerContactLine || base.issuerContactLine,
    issuerDocumentLine: demo.issuerDocumentLine || base.issuerDocumentLine,
    paymentNote: demo.paymentNote || base.paymentNote,
    reference: demo.reference || base.reference,
    items: Array.isArray(demo.items) && demo.items.length ? demo.items : base.items,
  };
}

function total(demo: Demonstrative) {
  return demo.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitValue || 0),
    0,
  );
}

function formatDateBr(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatCompetence(value: string) {
  const [year, month] = value.split("-");

  if (!year || !month) {
    return value;
  }

  return `${month}/${year}`;
}

function printPdf(demo: Demonstrative) {
  const settings = getPdfSettings();
  const safe = escapePdfHtml;
  const primary = settings.primaryColor || "#2f6b2f";
  const dark = settings.titleColor || "#173819";
  const totalValue = total(demo);

  const rows = demo.items
    .map((item) => {
      const itemTotal = Number(item.quantity || 0) * Number(item.unitValue || 0);

      return `
        <tr>
          <td class="qty">${safe(String(item.quantity || 0))}</td>
          <td class="desc">${safe(item.description)}</td>
          <td class="money">${safe(formatCurrency(item.unitValue))}</td>
          <td class="money">${safe(formatCurrency(itemTotal))}</td>
        </tr>
      `;
    })
    .join("");

  const logo = settings.logoDataUrl
    ? `<img src="${settings.logoDataUrl}" alt="Logo" />`
    : `<span>VIVA</span>`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>demonstrativo-${safe(demo.number)}.pdf</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      background: #f3f4f6;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
    }

    .actions {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 20;
    }

    .actions button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      background: ${primary};
      color: white;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(0,0,0,0.22);
    }

    .sheet {
      width: 277mm;
      min-height: 190mm;
      margin: 18px auto;
      background: white;
      border: 1.5px solid #111827;
      box-shadow: 0 24px 70px rgba(0,0,0,0.22);
    }

    .header {
      display: grid;
      grid-template-columns: 33mm 1fr;
      gap: 8mm;
      padding: 7mm 10mm 4mm;
      border-bottom: 1.4px solid #111827;
    }

    .logo {
      width: 25mm;
      height: 25mm;
      display: grid;
      place-items: center;
      border-radius: 50%;
      overflow: hidden;
      background: ${primary};
      color: white;
      font-size: 12pt;
      font-weight: 950;
      text-align: center;
    }

    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: white;
      padding: 2mm;
    }

    .issuer h1 {
      margin: 0;
      color: ${dark};
      font-size: 16pt;
      line-height: 1.05;
      text-transform: uppercase;
    }

    .issuer p {
      margin: 1mm 0 0;
      line-height: 1.25;
      font-size: 9.7pt;
    }

    .issuer .doc-title {
      margin-top: 2mm;
      color: ${primary};
      font-weight: 950;
      text-transform: uppercase;
    }

    .meta {
      display: grid;
      grid-template-columns: 1.1fr 1fr 0.8fr 1fr 1fr;
      border-bottom: 1.4px solid #111827;
      font-weight: 900;
      font-size: 9.8pt;
    }

    .meta div {
      padding: 3mm 4mm;
      border-right: 1px solid #cbd5e1;
    }

    .meta div:last-child {
      border-right: 0;
    }

    .meta span {
      display: block;
      color: ${dark};
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .recipient {
      display: grid;
      grid-template-columns: 1fr 86mm;
      gap: 5mm;
      padding: 4mm 5mm;
      border-bottom: 1.4px solid #111827;
      font-size: 10pt;
      line-height: 1.35;
    }

    .recipient-name {
      font-size: 11pt;
      font-weight: 950;
      text-transform: uppercase;
    }

    .recipient strong {
      font-weight: 950;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    thead th {
      padding: 1.5mm 2mm;
      border-bottom: 1.4px solid #111827;
      border-right: 1px solid #111827;
      font-size: 10.5pt;
      text-align: center;
    }

    thead th:last-child {
      border-right: 0;
    }

    tbody td {
      padding: 2.4mm 3mm;
      border-right: 1px solid #e5e7eb;
      vertical-align: top;
      font-size: 10pt;
    }

    tbody td:last-child {
      border-right: 0;
    }

    tbody tr:last-child td {
      padding-bottom: 36mm;
    }

    .qty {
      width: 23mm;
      text-align: center;
    }

    .desc {
      text-transform: uppercase;
      font-family: "Courier New", monospace;
    }

    .money {
      width: 38mm;
      text-align: right;
      white-space: nowrap;
      font-family: "Courier New", monospace;
    }

    .footer {
      border-top: 1.4px solid #111827;
      padding: 3mm 5mm 5mm;
      font-size: 10pt;
    }

    .total-grid {
      display: grid;
      grid-template-columns: 1fr 80mm;
      gap: 8mm;
      align-items: start;
    }

    .recipient-total {
      font-weight: 950;
      text-transform: uppercase;
    }

    .total-row {
      display: grid;
      grid-template-columns: 1fr 34mm;
      gap: 5mm;
      font-size: 11pt;
      font-weight: 950;
    }

    .total-row span:last-child {
      text-align: right;
    }

    .competence {
      display: grid;
      grid-template-columns: 1fr 80mm;
      gap: 8mm;
      margin-top: 2mm;
    }

    .reference {
      margin-top: 2mm;
      text-transform: uppercase;
    }

    .payment {
      margin-top: 2mm;
      color: #374151;
      font-size: 9.2pt;
    }

    .status {
      display: inline-block;
      margin-left: 3mm;
      border-radius: 999px;
      padding: 1mm 2.5mm;
      background: rgba(47, 107, 47, 0.1);
      color: ${primary};
      font-size: 8pt;
      font-weight: 950;
      letter-spacing: 0.08em;
    }

    @media print {
      body {
        background: white;
      }

      .actions {
        display: none;
      }

      .sheet {
        margin: 0;
        width: auto;
        min-height: auto;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Salvar como PDF</button>
  </div>

  <main class="sheet">
    <header class="header">
      <div class="logo">${logo}</div>
      <div class="issuer">
        <h1>${safe(demo.issuerName)}</h1>
        <p>${safe(demo.issuerAddress)}</p>
        <p>${safe(demo.issuerContactLine)}</p>
        <p>${safe(demo.issuerDocumentLine)}</p>
        <p class="doc-title">Demonstrativo administrativo <span class="status">${safe(demo.status)}</span></p>
      </div>
    </header>

    <section class="meta">
      <div><span>Demonstrativo Nº</span>${safe(demo.number)}</div>
      <div><span>Nº Doc.</span>${safe(demo.docNumber)}</div>
      <div><span>Nº NF.</span>${safe(demo.nfNumber || "-")}</div>
      <div><span>Emissão</span>${safe(formatDateBr(demo.issueDate))}</div>
      <div><span>Vencimento</span>${safe(formatDateBr(demo.dueDate))}</div>
    </section>

    <section class="recipient">
      <div>
        <div class="recipient-name">${safe(demo.recipientName || demo.recipientType)}</div>
        <div>${safe(demo.recipientAddress || "Endereço não informado")}</div>
      </div>
      <div>
        <div><strong>CPF/CNPJ:</strong> ${safe(demo.recipientDocument || "não informado")}</div>
        <div><strong>Fone:</strong> ${safe(demo.recipientPhone || "não informado")}</div>
        <div><strong>Cód. Assoc.:</strong> ${safe(demo.associateCode || "-")}</div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th class="qty">Quant.</th>
          <th>Discriminação</th>
          <th class="money">Valor Unitário</th>
          <th class="money">Valor Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <footer class="footer">
      <div class="total-grid">
        <div class="recipient-total">
          ${safe(demo.recipientName || demo.recipientType)}${demo.associateCode ? ` (${safe(demo.associateCode)})` : ""}
        </div>
        <div class="total-row">
          <span>TOTAL:</span>
          <span>${safe(formatCurrency(totalValue))}</span>
        </div>
      </div>

      <div class="competence">
        <div><strong>Ref. competência:</strong> ${safe(formatCompetence(demo.competence))}</div>
        <div class="total-row">
          <span>VALOR PARCELAS:</span>
          <span>${safe(formatCurrency(totalValue))}</span>
        </div>
      </div>

      <div class="reference"><strong>Referência:</strong> ${safe(demo.reference)}</div>
      <div class="payment">${safe(demo.paymentNote)}</div>
    </footer>
  </main>
</body>
</html>`;

  const originalOpen = window.__vivaOriginalOpen?.bind(window) ?? window.open.bind(window);
  const win = originalOpen("", "_blank", "noopener,noreferrer,width=1200,height=850");

  if (!win) {
    window.alert("O navegador bloqueou a janela do demonstrativo. Libere pop-ups para este site.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

export function AdministrativeDemonstratives() {
  const [items, setItems] = useState<Demonstrative[]>([newDemo(1)]);
  const [selectedId, setSelectedId] = useState("");
  const [team, setTeam] = useState<TeamPerson[]>([]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const savedV4 = readJson<Array<Partial<Demonstrative>>>(projectScopedKey(storageKeyBase), []);
      const savedV3 = readJson<Array<Partial<Demonstrative>>>(
        projectScopedKey("viva:central-cultural:demonstratives:v3"),
        [],
      );

      const saved = savedV4.length ? savedV4 : savedV3;
      const next = saved.length ? saved.map(normalizeDemo) : [newDemo(1)];

      setItems(next);
      setSelectedId(next[0]?.id ?? "");
      setTeam(readTeamPeople());
      window.localStorage.setItem(projectScopedKey(storageKeyBase), JSON.stringify(next));
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  function commit(next: Demonstrative[]) {
    setItems(next);
    window.localStorage.setItem(projectScopedKey(storageKeyBase), JSON.stringify(next));
  }

  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  function update(patch: Partial<Demonstrative>) {
    if (!selected) return;
    commit(items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)));
  }

  function updateItem(itemId: string, patch: Partial<Item>) {
    if (!selected) return;

    update({
      items: selected.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    });
  }

  function addDemo(type: "Equipe" | "Fornecedor") {
    const next = {
      ...newDemo(items.length + 1),
      recipientType: type,
    };

    commit([next, ...items]);
    setSelectedId(next.id);
  }

  if (!selected) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_430px]">
      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Demonstrativos</h3>
        <p className="mt-1 text-sm text-slate-500">Equipe e fornecedores.</p>

        <div className="mt-4 grid gap-2">
          <Button type="button" onClick={() => addDemo("Equipe")}>
            <UsersRound className="size-4" />
            Novo para equipe
          </Button>
          <Button type="button" variant="outline" onClick={() => addDemo("Fornecedor")}>
            <Plus className="size-4" />
            Novo fornecedor
          </Button>
        </div>

        <div className="mt-5 space-y-2">
          {items.map((demo) => (
            <button
              key={demo.id}
              type="button"
              onClick={() => setSelectedId(demo.id)}
              className={
                demo.id === selected.id
                  ? "w-full rounded-2xl border border-primary bg-primary/10 p-3 text-left"
                  : "w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left"
              }
            >
              <p className="text-sm font-black text-slate-950">Nº {demo.number}</p>
              <p className="text-xs text-slate-500">{demo.recipientName || demo.recipientType}</p>
              <p className="mt-1 text-xs font-bold text-primary">{formatCurrency(total(demo))}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-950">Editar demonstrativo</h3>
            <p className="text-sm text-slate-500">
              Modelo inspirado no demonstrativo administrativo enviado.
            </p>
          </div>
          <Button type="button" onClick={() => printPdf(selected)}>
            <Download className="size-4" />
            Gerar PDF
          </Button>
        </div>

        <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-4 text-primary" />
            <h4 className="font-black text-slate-950">Cabeçalho do demonstrativo</h4>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Instituição / emitente">
              <input className="form-input" value={selected.issuerName} onChange={(event) => update({ issuerName: event.target.value })} />
            </Field>

            <Field label="CNPJ/CPF do emitente">
              <input className="form-input" value={selected.issuerDocumentLine} onChange={(event) => update({ issuerDocumentLine: event.target.value })} />
            </Field>

            <Field label="Endereço do emitente">
              <input className="form-input" value={selected.issuerAddress} onChange={(event) => update({ issuerAddress: event.target.value })} />
            </Field>

            <Field label="Contato do emitente">
              <input className="form-input" value={selected.issuerContactLine} onChange={(event) => update({ issuerContactLine: event.target.value })} />
            </Field>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Número">
            <input className="form-input" value={selected.number} onChange={(event) => update({ number: event.target.value })} />
          </Field>

          <Field label="Nº Doc.">
            <input className="form-input" value={selected.docNumber} onChange={(event) => update({ docNumber: event.target.value })} />
          </Field>

          <Field label="Nº NF.">
            <input className="form-input" value={selected.nfNumber} onChange={(event) => update({ nfNumber: event.target.value })} />
          </Field>

          <Field label="Emissão">
            <input className="form-input" type="date" value={selected.issueDate} onChange={(event) => update({ issueDate: event.target.value })} />
          </Field>

          <Field label="Vencimento">
            <input className="form-input" type="date" value={selected.dueDate} onChange={(event) => update({ dueDate: event.target.value })} />
          </Field>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Tipo">
            <select
              className="form-input"
              value={selected.recipientType}
              onChange={(event) => update({ recipientType: event.target.value as Demonstrative["recipientType"] })}
            >
              <option>Equipe</option>
              <option>Fornecedor</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              className="form-input"
              value={selected.status}
              onChange={(event) => update({ status: event.target.value as Demonstrative["status"] })}
            >
              <option>Rascunho</option>
              <option>Emitido</option>
              <option>Pago</option>
              <option>Vencido</option>
            </select>
          </Field>

          <Field label="Competência">
            <input className="form-input" type="month" value={selected.competence} onChange={(event) => update({ competence: event.target.value })} />
          </Field>
        </div>

        {selected.recipientType === "Equipe" ? (
          <Field label="Selecionar pessoa da equipe">
            <select
              className="form-input"
              value=""
              onChange={(event) => {
                const person = team.find((item) => item.name === event.target.value);

                if (!person) return;

                update({
                  recipientName: person.name,
                  recipientDocument: person.document ?? "",
                  recipientPhone: person.phone ?? "",
                  recipientAddress: person.address ?? "",
                  reference: `Serviços de ${person.role || "equipe"} prestados ao projeto cultural.`,
                });
              }}
            >
              <option value="">Escolha uma pessoa...</option>
              {team.map((person) => (
                <option key={person.name} value={person.name}>
                  {person.name} — {person.role || "Equipe"}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Nome/Razão social">
            <input className="form-input" value={selected.recipientName} onChange={(event) => update({ recipientName: event.target.value })} />
          </Field>

          <Field label="CPF/CNPJ">
            <input className="form-input" value={selected.recipientDocument} onChange={(event) => update({ recipientDocument: event.target.value })} />
          </Field>

          <Field label="Telefone">
            <input className="form-input" value={selected.recipientPhone} onChange={(event) => update({ recipientPhone: event.target.value })} />
          </Field>

          <Field label="Cód. associado / código interno">
            <input className="form-input" value={selected.associateCode} onChange={(event) => update({ associateCode: event.target.value })} />
          </Field>
        </div>

        <div className="mt-4 grid gap-3">
          <Field label="Endereço do favorecido">
            <input className="form-input" value={selected.recipientAddress} onChange={(event) => update({ recipientAddress: event.target.value })} />
          </Field>

          <Field label="Projeto">
            <input className="form-input" value={selected.project} onChange={(event) => update({ project: event.target.value })} />
          </Field>

          <Field label="Referência / locação / descrição geral">
            <input className="form-input" value={selected.reference} onChange={(event) => update({ reference: event.target.value })} />
          </Field>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-black text-slate-950">Itens do demonstrativo</h4>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                update({
                  items: [
                    ...selected.items,
                    { id: makeId("item"), quantity: 1, description: "Novo item", unitValue: 0 },
                  ],
                })
              }
            >
              <Plus className="size-4" />
              Item
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {selected.items.map((item) => (
              <div key={item.id} className="grid gap-3 md:grid-cols-[90px_minmax(0,1fr)_150px_44px]">
                <input className="form-input" type="number" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} />
                <input className="form-input" value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} />
                <input className="form-input" type="number" value={item.unitValue} onChange={(event) => updateItem(item.id, { unitValue: Number(event.target.value) })} />
                <Button type="button" variant="destructive" onClick={() => update({ items: selected.items.filter((entry) => entry.id !== item.id) })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Texto de quitação no rodapé">
          <textarea className="form-input min-h-20" value={selected.paymentNote} onChange={(event) => update({ paymentNote: event.target.value })} />
        </Field>
      </div>

      <aside className="sticky top-4 h-fit rounded-3xl border border-white bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Prévia</p>
            <h3 className="text-lg font-black text-slate-950">Demonstrativo</h3>
          </div>
          <Button type="button" onClick={() => printPdf(selected)}>
            <Download className="size-4" />
            PDF
          </Button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-900 bg-white text-[11px]">
          <div className="flex gap-3 border-b border-slate-900 p-3">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-center text-[10px] font-black text-white">
              VIVA
            </div>
            <div>
              <p className="text-sm font-black uppercase text-slate-950">{selected.issuerName}</p>
              <p>{selected.issuerAddress}</p>
              <p>{selected.issuerContactLine}</p>
              <p>{selected.issuerDocumentLine}</p>
            </div>
          </div>

          <div className="grid grid-cols-5 border-b border-slate-900 text-[10px] font-bold">
            <p className="border-r p-2">Nº {selected.number}</p>
            <p className="border-r p-2">Doc. {selected.docNumber}</p>
            <p className="border-r p-2">NF {selected.nfNumber || "-"}</p>
            <p className="border-r p-2">{formatDateBr(selected.issueDate)}</p>
            <p className="p-2">{formatDateBr(selected.dueDate)}</p>
          </div>

          <div className="grid grid-cols-[1fr_140px] border-b border-slate-900 p-3">
            <div>
              <p className="font-black uppercase">{selected.recipientName || selected.recipientType}</p>
              <p>{selected.recipientAddress || "Endereço não informado"}</p>
            </div>
            <div>
              <p><strong>CPF/CNPJ:</strong> {selected.recipientDocument || "-"}</p>
              <p><strong>Fone:</strong> {selected.recipientPhone || "-"}</p>
              <p><strong>Cód.:</strong> {selected.associateCode || "-"}</p>
            </div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-r p-1">Quant.</th>
                <th className="border-b border-r p-1">Discriminação</th>
                <th className="border-b border-r p-1">Unit.</th>
                <th className="border-b p-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {selected.items.map((item) => (
                <tr key={item.id}>
                  <td className="border-r p-1 text-center">{item.quantity}</td>
                  <td className="border-r p-1 uppercase">{item.description}</td>
                  <td className="border-r p-1 text-right">{formatCurrency(item.unitValue)}</td>
                  <td className="p-1 text-right">{formatCurrency(item.quantity * item.unitValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-slate-900 p-3">
            <p className="text-right text-base font-black">TOTAL: {formatCurrency(total(selected))}</p>
            <p className="mt-1"><strong>Ref. competência:</strong> {formatCompetence(selected.competence)}</p>
            <p className="mt-1"><strong>Referência:</strong> {selected.reference}</p>
            <p className="mt-1 text-slate-600">{selected.paymentNote}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
