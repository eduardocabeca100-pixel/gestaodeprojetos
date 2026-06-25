"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, ReceiptText, Trash2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  issueDate: string;
  dueDate: string;
  competence: string;
  project: string;
  recipientType: "Equipe" | "Fornecedor";
  recipientName: string;
  recipientDocument: string;
  recipientAddress: string;
  recipientPhone: string;
  reference: string;
  notes: string;
  status: "Rascunho" | "Emitido" | "Pago" | "Vencido";
  items: Item[];
};

type TeamPerson = {
  name: string;
  role?: string;
  document?: string;
  phone?: string;
  address?: string;
};

const storageKeyBase = "viva:central-cultural:demonstratives:v3";

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
  const people = roster.map((person) => ({
    name: String(person.name || person.fullName || "Pessoa sem nome"),
    role: String(person.role || person.rubric || ""),
    document: String(person.cpf || person.cnpj || person.document || ""),
    phone: String(person.phone || person.telefone || ""),
    address: String(person.address || person.endereco || ""),
  }));

  const map = new Map<string, TeamPerson>();

  for (const person of people) {
    if (!map.has(person.name)) map.set(person.name, person);
  }

  return Array.from(map.values()).filter((person) => person.name !== "Pessoa sem nome");
}

function newDemo(index: number): Demonstrative {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: makeId("demo"),
    number: String(index).padStart(4, "0"),
    docNumber: String(Date.now()).slice(-6),
    issueDate: today,
    dueDate: today,
    competence: today.slice(0, 7),
    project: getActiveProjectScope().name,
    recipientType: "Equipe",
    recipientName: "",
    recipientDocument: "",
    recipientAddress: "",
    recipientPhone: "",
    reference: "Serviços prestados ao projeto cultural.",
    notes: "A quitação deste demonstrativo ocorrerá mediante comprovante de pagamento.",
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

function total(demo: Demonstrative) {
  return demo.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitValue || 0), 0);
}

function printPdf(demo: Demonstrative) {
  const rows = demo.items
    .map(
      (item) => `
        <tr>
          <td>${item.quantity}</td>
          <td>${item.description}</td>
          <td>${formatCurrency(item.unitValue)}</td>
          <td>${formatCurrency(Number(item.quantity || 0) * Number(item.unitValue || 0))}</td>
        </tr>
      `,
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Demonstrativo ${demo.number}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #111827; margin: 0; background: #f3f4f6; }
  .page { width: 297mm; min-height: 210mm; margin: 0 auto; background: #fff; padding: 12mm; border: 1px solid #111827; }
  .top { display: grid; grid-template-columns: 120px 1fr; gap: 18px; align-items: center; border-bottom: 3px solid #7f1d1d; padding-bottom: 14px; }
  .logo { width: 92px; height: 92px; border-radius: 20px; background: #7f1d1d; color: white; display: grid; place-items: center; font-weight: 900; font-size: 28px; }
  h1 { margin: 0; font-size: 22px; }
  p { margin: 4px 0; font-size: 12px; }
  .docbar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 14px 0; font-size: 12px; font-weight: 700; }
  .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; }
  .recipient { display: grid; grid-template-columns: 1.3fr 1fr; gap: 12px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #111827; padding: 8px; vertical-align: top; }
  th { background: #f9fafb; }
  .total { display: flex; justify-content: flex-end; gap: 20px; font-size: 18px; font-weight: 900; margin-top: 14px; }
  .ref { margin-top: 14px; font-size: 13px; }
  .note { margin-top: 16px; border-top: 1px solid #d1d5db; padding-top: 10px; font-size: 12px; }
  .stamp { display: inline-block; padding: 8px 14px; border: 2px solid #7f1d1d; color: #7f1d1d; font-weight: 900; border-radius: 10px; transform: rotate(-2deg); }
  @media print { body { background: white; } .page { width: auto; min-height: auto; margin: 0; border: 0; } }
</style>
</head>
<body>
  <main class="page">
    <section class="top">
      <div class="logo">VIVA</div>
      <div>
        <h1>CIA DE ARTES VIVA</h1>
        <p>Demonstrativo administrativo para controle interno de pagamento/cobrança.</p>
        <p>CNPJ: preencher no cadastro da companhia • Endereço: preencher no cadastro da companhia</p>
        <p>Este documento não substitui Nota Fiscal quando exigida pelo edital, órgão público ou legislação.</p>
      </div>
    </section>

    <section class="docbar">
      <div class="box">Demonstrativo Nº<br/>${demo.number}</div>
      <div class="box">Nº Doc.<br/>${demo.docNumber}</div>
      <div class="box">Emissão<br/>${demo.issueDate}</div>
      <div class="box">Vencimento<br/>${demo.dueDate}</div>
      <div class="box"><span class="stamp">${demo.status}</span></div>
    </section>

    <section class="recipient">
      <div class="box">
        <strong>${demo.recipientType.toUpperCase()}</strong>
        <p>${demo.recipientName || "Nome/Razão social"}</p>
        <p>${demo.recipientAddress || "Endereço não informado"}</p>
      </div>
      <div class="box">
        <p><strong>CPF/CNPJ:</strong> ${demo.recipientDocument || "não informado"}</p>
        <p><strong>Fone:</strong> ${demo.recipientPhone || "não informado"}</p>
        <p><strong>Projeto:</strong> ${demo.project}</p>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th style="width: 80px;">Quant.</th>
          <th>Discriminação</th>
          <th style="width: 160px;">Valor Unitário</th>
          <th style="width: 160px;">Valor Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="total">
      <span>TOTAL:</span>
      <span>${formatCurrency(total(demo))}</span>
    </div>

    <div class="ref">
      <p><strong>Ref. competência:</strong> ${demo.competence}</p>
      <p><strong>Referência:</strong> ${demo.reference}</p>
    </div>

    <div class="note">${demo.notes}</div>
  </main>

  <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1100,height=850");

  if (!win) {
    window.alert("O navegador bloqueou a janela de impressão. Libere pop-ups para gerar o PDF.");
    return;
  }

  win.document.write(html);
  win.document.close();
}

export function AdministrativeDemonstratives() {
  const [items, setItems] = useState<Demonstrative[]>([newDemo(1)]);
  const [selectedId, setSelectedId] = useState("");
  const [team, setTeam] = useState<TeamPerson[]>([]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const saved = readJson<Demonstrative[]>(projectScopedKey(storageKeyBase), []);
      const next = saved.length ? saved : [newDemo(1)];
      setItems(next);
      setSelectedId(next[0]?.id ?? "");
      setTeam(readTeamPeople());
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
    commit(items.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
  }

  function updateItem(itemId: string, patch: Partial<Item>) {
    if (!selected) return;

    update({
      items: selected.items.map((item) => item.id === itemId ? { ...item, ...patch } : item),
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
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
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
              className={demo.id === selected.id ? "w-full rounded-2xl border border-primary bg-primary/10 p-3 text-left" : "w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left"}
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
            <p className="text-sm text-slate-500">Modelo administrativo, não substitui NF oficial.</p>
          </div>
          <Button type="button" onClick={() => printPdf(selected)}>
            <Download className="size-4" />
            Baixar PDF
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Número"><input className="form-input" value={selected.number} onChange={(event) => update({ number: event.target.value })} /></Field>
          <Field label="Nº Doc."><input className="form-input" value={selected.docNumber} onChange={(event) => update({ docNumber: event.target.value })} /></Field>
          <Field label="Emissão"><input className="form-input" type="date" value={selected.issueDate} onChange={(event) => update({ issueDate: event.target.value })} /></Field>
          <Field label="Vencimento"><input className="form-input" type="date" value={selected.dueDate} onChange={(event) => update({ dueDate: event.target.value })} /></Field>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Tipo">
            <select className="form-input" value={selected.recipientType} onChange={(event) => update({ recipientType: event.target.value as Demonstrative["recipientType"] })}>
              <option>Equipe</option>
              <option>Fornecedor</option>
            </select>
          </Field>

          <Field label="Status">
            <select className="form-input" value={selected.status} onChange={(event) => update({ status: event.target.value as Demonstrative["status"] })}>
              <option>Rascunho</option>
              <option>Emitido</option>
              <option>Pago</option>
              <option>Vencido</option>
            </select>
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
                <option key={person.name} value={person.name}>{person.name} — {person.role || "Equipe"}</option>
              ))}
            </select>
          </Field>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Nome/Razão social"><input className="form-input" value={selected.recipientName} onChange={(event) => update({ recipientName: event.target.value })} /></Field>
          <Field label="CPF/CNPJ"><input className="form-input" value={selected.recipientDocument} onChange={(event) => update({ recipientDocument: event.target.value })} /></Field>
          <Field label="Telefone"><input className="form-input" value={selected.recipientPhone} onChange={(event) => update({ recipientPhone: event.target.value })} /></Field>
          <Field label="Projeto"><input className="form-input" value={selected.project} onChange={(event) => update({ project: event.target.value })} /></Field>
        </div>

        <div className="mt-4 grid gap-3">
          <Field label="Endereço"><input className="form-input" value={selected.recipientAddress} onChange={(event) => update({ recipientAddress: event.target.value })} /></Field>
          <Field label="Referência"><input className="form-input" value={selected.reference} onChange={(event) => update({ reference: event.target.value })} /></Field>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-black text-slate-950">Itens</h4>
            <Button type="button" size="sm" onClick={() => update({ items: [...selected.items, { id: makeId("item"), quantity: 1, description: "Novo item", unitValue: 0 }] })}>
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

        <Field label="Observação">
          <textarea className="form-input min-h-20" value={selected.notes} onChange={(event) => update({ notes: event.target.value })} />
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

        <div className="mt-5 rounded-2xl border border-slate-900 bg-white p-4 text-xs">
          <div className="flex gap-3 border-b-2 border-red-900 pb-3">
            <div className="grid size-16 place-items-center rounded-2xl bg-red-900 text-lg font-black text-white">VIVA</div>
            <div>
              <p className="text-base font-black">CIA DE ARTES VIVA</p>
              <p>Demonstrativo administrativo</p>
              <p>Não substitui Nota Fiscal quando exigida.</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <p><strong>Nº:</strong> {selected.number}</p>
            <p><strong>Doc.:</strong> {selected.docNumber}</p>
            <p><strong>Emissão:</strong> {selected.issueDate}</p>
            <p><strong>Venc.:</strong> {selected.dueDate}</p>
          </div>

          <div className="mt-3 rounded border p-2">
            <p><strong>{selected.recipientType}:</strong> {selected.recipientName || "Nome/Razão social"}</p>
            <p><strong>CPF/CNPJ:</strong> {selected.recipientDocument || "não informado"}</p>
          </div>

          <table className="mt-3 w-full border-collapse">
            <tbody>
              {selected.items.map((item) => (
                <tr key={item.id}>
                  <td className="border p-1">{item.quantity}</td>
                  <td className="border p-1">{item.description}</td>
                  <td className="border p-1">{formatCurrency(item.unitValue)}</td>
                  <td className="border p-1">{formatCurrency(item.quantity * item.unitValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3 text-right text-base font-black">TOTAL: {formatCurrency(total(selected))}</p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
