"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  FileCheck2,
  Paperclip,
  RefreshCw,
  Table2,
  UsersRound,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format-currency";

type ConnectedDoc = {
  name?: string;
  category?: string;
  status?: string;
  validUntil?: string;
  fileName?: string;
};

type CentralData = {
  financeSummary?: {
    approved?: number;
    executed?: number;
    pending?: number;
  };
  demonstratives?: Array<{
    number?: string;
    client?: string;
    total?: number;
    status?: string;
  }>;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function countStoredItems(pattern: RegExp) {
  if (typeof window === "undefined") return 0;

  let total = 0;

  for (const key of Object.keys(window.localStorage)) {
    if (!pattern.test(key)) continue;

    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");

      if (Array.isArray(parsed)) {
        total += parsed.length;
      } else if (parsed && typeof parsed === "object") {
        total += Object.values(parsed).flat().length;
      }
    } catch {
      continue;
    }
  }

  return total;
}

function getData() {
  const documents = readJson<ConnectedDoc[]>("viva:central-cultural:documents:v1", []);
  const central = readJson<CentralData>("viva:central-cultural:v2", {});
  const assignments = readJson<Record<string, unknown[]>>("viva:project-team-assignments:v1", {});
  const roster = readJson<unknown[]>("viva:team-roster:v1", []);

  const teamCount = Object.values(assignments).flat().length || roster.length;
  const scheduleCount = countStoredItems(/viva:schedule.*activities/i);
  const participantsCount = countStoredItems(/participant|participante|aluno|presenca|attendance/i);
  const approved = Number(central.financeSummary?.approved ?? 0);
  const executed = Number(central.financeSummary?.executed ?? 0);

  return {
    documents,
    teamCount,
    scheduleCount,
    participantsCount,
    finance: {
      approved,
      executed,
      balance: approved - executed,
    },
    demonstratives: central.demonstratives ?? [],
  };
}

function buildSummaryHtml(data: ReturnType<typeof getData>) {
  const pendingDocs = data.documents.filter((doc) => doc.status !== "Aprovado").length;

  return `
    <h2>Resumo conectado do sistema</h2>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <tbody>
        <tr><td><strong>Participantes encontrados</strong></td><td>${data.participantsCount}</td></tr>
        <tr><td><strong>Pessoas na equipe</strong></td><td>${data.teamCount}</td></tr>
        <tr><td><strong>Aulas/atividades no cronograma</strong></td><td>${data.scheduleCount}</td></tr>
        <tr><td><strong>Documentos cadastrados</strong></td><td>${data.documents.length}</td></tr>
        <tr><td><strong>Documentos pendentes</strong></td><td>${pendingDocs}</td></tr>
        <tr><td><strong>Valor aprovado</strong></td><td>${formatCurrency(data.finance.approved)}</td></tr>
        <tr><td><strong>Valor executado</strong></td><td>${formatCurrency(data.finance.executed)}</td></tr>
        <tr><td><strong>Saldo estimado</strong></td><td>${formatCurrency(data.finance.balance)}</td></tr>
      </tbody>
    </table>
    <p><br></p>
  `;
}

function buildDocumentsHtml(data: ReturnType<typeof getData>) {
  const rows = data.documents.length
    ? data.documents
        .slice(0, 80)
        .map(
          (doc) =>
            `<tr><td>${doc.name ?? "-"}</td><td>${doc.category ?? "-"}</td><td>${doc.status ?? "-"}</td><td>${doc.validUntil ?? "-"}</td><td>${doc.fileName ?? "sem arquivo"}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="5">Nenhum documento cadastrado.</td></tr>`;

  return `
    <h2>Documentos e certidões</h2>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr><th>Documento</th><th>Categoria</th><th>Status</th><th>Validade</th><th>Arquivo</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p><br></p>
  `;
}

function buildFinanceHtml(data: ReturnType<typeof getData>) {
  return `
    <h2>Resumo financeiro</h2>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <tbody>
        <tr><td><strong>Valor aprovado</strong></td><td>${formatCurrency(data.finance.approved)}</td></tr>
        <tr><td><strong>Valor executado</strong></td><td>${formatCurrency(data.finance.executed)}</td></tr>
        <tr><td><strong>Saldo estimado</strong></td><td>${formatCurrency(data.finance.balance)}</td></tr>
      </tbody>
    </table>
    <p><br></p>
  `;
}

function buildDemonstrativesHtml(data: ReturnType<typeof getData>) {
  const rows = data.demonstratives.length
    ? data.demonstratives
        .slice(0, 80)
        .map(
          (item) =>
            `<tr><td>${item.number ?? "-"}</td><td>${item.client ?? "-"}</td><td>${formatCurrency(Number(item.total ?? 0))}</td><td>${item.status ?? "-"}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="4">Nenhum demonstrativo cadastrado.</td></tr>`;

  return `
    <h2>Demonstrativos administrativos</h2>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr><th>Nº</th><th>Favorecido/cliente</th><th>Valor</th><th>Status</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p><br></p>
  `;
}

export function AccountabilityConnectedPanel({
  onInsert,
}: {
  onInsert: (html: string) => void;
}) {
  const [version, setVersion] = useState(0);
  const data = useMemo(() => getData(), [version]);
  const pendingDocs = data.documents.filter((doc) => doc.status !== "Aprovado").length;

  return (
    <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h4 className="text-lg font-black text-slate-950">
            Dados conectados das outras abas
          </h4>
          <p className="text-sm text-slate-500">
            Use estes botões para inserir no relatório informações salvas em documentos, equipe, participantes, cronograma, financeiro e demonstrativos.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={() => setVersion((item) => item + 1)}>
          <RefreshCw className="size-4" />
          Atualizar dados
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={UsersRound} label="Participantes" value={String(data.participantsCount)} />
        <Metric icon={UsersRound} label="Equipe" value={String(data.teamCount)} />
        <Metric icon={FileCheck2} label="Documentos" value={`${data.documents.length} / ${pendingDocs} pend.`} />
        <Metric icon={BarChart3} label="Atividades" value={String(data.scheduleCount)} />
        <Metric icon={Wallet} label="Executado" value={formatCurrency(data.finance.executed)} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onInsert(buildSummaryHtml(data))}>
          <Table2 className="size-4" />
          Inserir resumo geral
        </Button>
        <Button type="button" variant="outline" onClick={() => onInsert(buildDocumentsHtml(data))}>
          <Paperclip className="size-4" />
          Inserir documentos
        </Button>
        <Button type="button" variant="outline" onClick={() => onInsert(buildFinanceHtml(data))}>
          <Wallet className="size-4" />
          Inserir financeiro
        </Button>
        <Button type="button" variant="outline" onClick={() => onInsert(buildDemonstrativesHtml(data))}>
          Inserir demonstrativos
        </Button>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}
