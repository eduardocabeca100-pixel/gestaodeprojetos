"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  UploadCloud,
  UserRound,
} from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role?: string;
  area?: string;
  cpf?: string;
  cnpj?: string;
  document?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  fee?: number;
  expectedAmount?: number;
  paidAmount?: number;
  paymentStatus?: string;
  resume?: string;
  resumeShort?: string;
  portfolioText?: string;
  observations?: string;
};

type Profile = {
  id?: string;
  project_id?: string;
  person_key?: string;
  person_name?: string;
  role?: string;
  areas?: string[];
  links?: Record<string, string>;
  resume?: string;
  portfolio?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

type Doc = {
  id: string;
  category: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  signedUrl?: string;
  created_at?: string;
};

const areaOptions = [
  "Atuação",
  "Direção",
  "Dramaturgia",
  "Produção executiva",
  "Produção cultural",
  "Técnico de iluminação",
  "Técnico de som",
  "Audiovisual",
  "Fotografia",
  "Cenografia",
  "Figurino",
  "Maquiagem",
  "Música",
  "Preparação vocal",
  "Dança",
  "LIBRAS",
  "Acessibilidade",
  "Comunicação",
  "Prestação de contas",
  "Coordenação geral",
  "Oficina / Formação",
];

const docCategories = [
  "Currículo PDF",
  "Currículo Word",
  "Certificado",
  "Diploma",
  "Portfólio",
  "Foto",
  "Documento pessoal",
  "Carta de anuência",
  "Comprovante de pagamento",
  "Recibo",
  "Imagem / peça",
  "Outros",
];

const reportOptions = [
  ["dados", "Dados cadastrais"],
  ["areas", "Áreas e funções"],
  ["curriculo", "Currículo completo"],
  ["portfolio", "Portfólio"],
  ["links", "Links"],
  ["documentos", "Lista de documentos"],
  ["imagens", "Imagens anexadas"],
  ["financeiro", "Dados financeiros"],
  ["observacoes", "Observações internas"],
] as const;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function money(value: unknown) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

function slug(value: string) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function personKey(member: TeamMember | null) {
  if (!member) return "";
  return slug(member.cpf || member.document || member.email || member.name || member.id);
}

function escapeHtml(value: string) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function nl2br(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

function fileSize(size: number) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildReportHtml({
  member,
  profile,
  docs,
  selected,
}: {
  member: TeamMember;
  profile: Profile;
  docs: Doc[];
  selected: Record<string, boolean>;
}) {
  const areas = profile.areas?.length
    ? profile.areas
    : [member.role || member.area || "Equipe"].filter(Boolean);

  const links = profile.links || {};
  const imageDocs = docs.filter((doc) => doc.mime_type?.startsWith("image/") && doc.signedUrl);

  return `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório do integrante</title>
  <style>
    @page { size: A4; margin: 13mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      margin: 0;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      line-height: 1.42;
    }
    .header {
      border: 1.5px solid #111827;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 14px;
    }
    .badge {
      display: inline-block;
      border-radius: 999px;
      background: #ede9fe;
      color: #5b21b6;
      padding: 5px 10px;
      font-size: 8.5pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    h1 { margin: 9px 0 3px; font-size: 24pt; line-height: 1.05; }
    h2 {
      margin: 15px 0 8px;
      padding-bottom: 5px;
      border-bottom: 1px solid #d1d5db;
      font-size: 14pt;
    }
    p { margin: 3px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
    .box {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #f8fafc;
      padding: 11px;
      margin-bottom: 8px;
    }
    .doc {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 8px 10px;
      margin-bottom: 6px;
      break-inside: avoid;
    }
    .doc strong { display: block; }
    .images {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .image-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 8px;
      break-inside: avoid;
    }
    img {
      width: 100%;
      max-height: 180mm;
      object-fit: contain;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      margin-top: 6px;
    }
    ul { margin-top: 4px; }
    .muted { color: #64748b; }
  </style>
</head>
<body>
  <section class="header">
    <span class="badge">Relatório individual de equipe</span>
    <h1>${escapeHtml(member.name || "Integrante")}</h1>
    <p><strong>Função principal:</strong> ${escapeHtml(member.role || member.area || profile.role || "Não informado")}</p>
    <p><strong>Áreas:</strong> ${escapeHtml(areas.join(", ") || "Não informado")}</p>
  </section>

  ${selected.dados ? `
    <h2>Dados cadastrais</h2>
    <div class="grid box">
      <p><strong>Nome completo:</strong> ${escapeHtml(member.name || "-")}</p>
      <p><strong>CPF/CNPJ:</strong> ${escapeHtml(member.cpf || member.cnpj || member.document || "-")}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(member.email || "-")}</p>
      <p><strong>Telefone:</strong> ${escapeHtml(member.phone || "-")}</p>
      <p><strong>Cidade/UF:</strong> ${escapeHtml(member.city || "-")}</p>
      <p><strong>Endereço:</strong> ${escapeHtml(member.address || "-")}</p>
    </div>
  ` : ""}

  ${selected.areas ? `
    <h2>Áreas, funções e atuação</h2>
    <div class="box">
      <p><strong>Função no projeto:</strong> ${escapeHtml(member.role || profile.role || "-")}</p>
      <p><strong>Áreas selecionadas:</strong> ${escapeHtml(areas.join(", ") || "-")}</p>
    </div>
  ` : ""}

  ${selected.curriculo ? `
    <h2>Currículo completo</h2>
    <div class="box">${nl2br(profile.resume || member.resume || member.resumeShort || "Não informado.")}</div>
  ` : ""}

  ${selected.portfolio ? `
    <h2>Portfólio e histórico artístico/técnico</h2>
    <div class="box">${nl2br(profile.portfolio || member.portfolioText || "Não informado.")}</div>
  ` : ""}

  ${selected.links ? `
    <h2>Links</h2>
    <div class="box">
      <ul>
        ${Object.entries(links)
          .filter(([, value]) => clean(value))
          .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(value))}</li>`)
          .join("") || "<li>Nenhum link cadastrado.</li>"}
      </ul>
    </div>
  ` : ""}

  ${selected.financeiro ? `
    <h2>Dados financeiros</h2>
    <div class="grid box">
      <p><strong>Cachê/valor previsto:</strong> ${money(member.expectedAmount || member.fee)}</p>
      <p><strong>Valor pago:</strong> ${money(member.paidAmount)}</p>
      <p><strong>Status:</strong> ${escapeHtml(member.paymentStatus || "Não informado")}</p>
    </div>
  ` : ""}

  ${selected.documentos ? `
    <h2>Documentos registrados</h2>
    ${docs.length
      ? docs.map((doc) => `
        <div class="doc">
          <strong>${escapeHtml(doc.category)}</strong>
          <span>${escapeHtml(doc.file_name)} ${doc.size_bytes ? "• " + fileSize(doc.size_bytes) : ""}</span>
        </div>
      `).join("")
      : '<p class="muted">Nenhum documento registrado.</p>'
    }
  ` : ""}

  ${selected.imagens ? `
    <h2>Imagens anexadas</h2>
    <div class="images">
      ${imageDocs.length
        ? imageDocs.map((doc) => `
          <div class="image-card">
            <strong>${escapeHtml(doc.category)}</strong>
            <p class="muted">${escapeHtml(doc.file_name)}</p>
            <img src="${doc.signedUrl}" />
          </div>
        `).join("")
        : '<p class="muted">Nenhuma imagem anexada.</p>'
      }
    </div>
  ` : ""}

  ${selected.observacoes ? `
    <h2>Observações internas</h2>
    <div class="box">${nl2br(profile.notes || member.observations || "Não informado.")}</div>
  ` : ""}
</body>
</html>`;
}

function printHtml(html: string) {
  const old = document.getElementById("team-report-print-frame");
  old?.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "team-report-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;

  if (!win || !doc) {
    iframe.remove();
    alert("Não foi possível preparar o PDF.");
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(() => iframe.remove(), 1500);
  }, 400);
}

export function TeamMemberReportWorkspace({ projectId }: { projectId: string }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [profile, setProfile] = useState<Profile>({});
  const [docs, setDocs] = useState<Doc[]>([]);
  const [category, setCategory] = useState(docCategories[0]);
  const [customArea, setCustomArea] = useState("");
  const [message, setMessage] = useState("Carregando equipe...");
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Record<string, boolean>>(
    Object.fromEntries(reportOptions.map(([key]) => [key, true])),
  );

  const filteredTeam = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return team;

    return team.filter((member) =>
      [member.name, member.role, member.area, member.email, member.phone]
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [team, query]);

  const selectedMember = useMemo(
    () => team.find((member) => member.id === selectedId) || filteredTeam[0] || null,
    [team, selectedId, filteredTeam],
  );

  useEffect(() => {
    async function loadTeam() {
      setLoading(true);

      try {
        const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
        const response = await fetch(`/api/cerebro/equipe${q}`, {
          credentials: "same-origin",
          cache: "no-store",
        });

        const data = await response.json();

        if (data.ok && Array.isArray(data.team)) {
          setTeam(data.team);
          setMessage(`Equipe carregada: ${data.team.length} integrante(s).`);
        } else {
          setMessage(data.message || "Não consegui carregar equipe.");
        }
      } catch {
        setMessage("Erro ao carregar equipe.");
      } finally {
        setLoading(false);
      }
    }

    void loadTeam();
  }, [projectId]);

  useEffect(() => {
    if (selectedMember && !selectedId) setSelectedId(selectedMember.id);
  }, [selectedMember, selectedId]);

  useEffect(() => {
    async function loadExtra() {
      if (!selectedMember) return;

      const key = personKey(selectedMember);

      try {
        const [profileResponse, docsResponse] = await Promise.all([
          fetch(`/api/cerebro/team-profile?projectId=${encodeURIComponent(projectId)}&personKey=${encodeURIComponent(key)}`, {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch(`/api/cerebro/team-documents?projectId=${encodeURIComponent(projectId)}&personKey=${encodeURIComponent(key)}`, {
            credentials: "same-origin",
            cache: "no-store",
          }),
        ]);

        const profileData = await profileResponse.json().catch(() => ({}));
        const docsData = await docsResponse.json().catch(() => ({}));

        setProfile(profileData.profile || {});
        setDocs(docsData.documents || []);
      } catch {
        setProfile({});
        setDocs([]);
      }
    }

    void loadExtra();
  }, [selectedMember, projectId]);

  function toggleArea(area: string) {
    const areas = profile.areas || [];
    const next = areas.includes(area)
      ? areas.filter((item) => item !== area)
      : [...areas, area];

    setProfile((current) => ({ ...current, areas: next }));
  }

  async function saveProfile() {
    if (!selectedMember) return;

    setLoading(true);

    try {
      const response = await fetch("/api/cerebro/team-profile", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          personKey: personKey(selectedMember),
          personName: selectedMember.name,
          role: selectedMember.role || selectedMember.area || "",
          areas: profile.areas || [],
          links: profile.links || {},
          resume: profile.resume || selectedMember.resume || selectedMember.resumeShort || "",
          portfolio: profile.portfolio || selectedMember.portfolioText || "",
          notes: profile.notes || "",
          metadata: profile.metadata || {},
        }),
      });

      const data = await response.json().catch(() => ({}));
      setMessage(data.message || "Perfil salvo.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocs(files: FileList | null) {
    if (!selectedMember || !files?.length) return;

    setLoading(true);

    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("projectId", projectId);
        form.append("personKey", personKey(selectedMember));
        form.append("personName", selectedMember.name);
        form.append("category", category);
        form.append("file", file);

        await fetch("/api/cerebro/team-documents", {
          method: "POST",
          credentials: "same-origin",
          body: form,
        });
      }

      const response = await fetch(`/api/cerebro/team-documents?projectId=${encodeURIComponent(projectId)}&personKey=${encodeURIComponent(personKey(selectedMember))}`, {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));
      setDocs(data.documents || []);
      setMessage("Documento(s) enviado(s).");
    } finally {
      setLoading(false);
    }
  }

  async function removeDoc(id: string) {
    await fetch(`/api/cerebro/team-documents?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    setDocs((current) => current.filter((doc) => doc.id !== id));
  }

  function generatePdf() {
    if (!selectedMember) return;

    printHtml(
      buildReportHtml({
        member: selectedMember,
        profile,
        docs,
        selected: selectedReport,
      }),
    );
  }

  function setLink(key: string, value: string) {
    setProfile((current) => ({
      ...current,
      links: {
        ...(current.links || {}),
        [key]: value,
      },
    }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
              Equipe
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-black text-slate-950">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </span>
              Relatório individual de integrante
            </h1>
            <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-500">
              Gere um PDF profissional com dados, currículo, documentos, imagens, recibos, comprovantes e histórico do artista ou técnico.
            </p>
          </div>

          <button type="button" className="btn-primary" onClick={generatePdf} disabled={!selectedMember}>
            <Download className="size-4" />
            Gerar PDF
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="form-input pl-10"
              placeholder="Buscar integrante..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="mt-4 grid max-h-[720px] gap-3 overflow-y-auto pr-1">
            {loading && team.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                <Loader2 className="mr-2 inline size-4 animate-spin" />
                Carregando...
              </div>
            ) : null}

            {filteredTeam.map((member) => {
              const active = member.id === selectedMember?.id;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedId(member.id)}
                  className={
                    active
                      ? "rounded-3xl border border-primary bg-primary/10 p-4 text-left"
                      : "rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-primary/40 hover:bg-white"
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 font-black text-primary">
                      {member.name?.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-950">{member.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {member.role || member.area || "Equipe"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {selectedMember ? (
          <main className="space-y-6">
            <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">{selectedMember.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedMember.role || selectedMember.area || "Equipe"}
              </p>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Info label="CPF/CNPJ" value={selectedMember.cpf || selectedMember.cnpj || selectedMember.document || "-"} />
                <Info label="E-mail" value={selectedMember.email || "-"} />
                <Info label="Telefone" value={selectedMember.phone || "-"} />
                <Info label="Cidade/UF" value={selectedMember.city || "-"} />
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Áreas de atuação</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {areaOptions.map((area) => {
                  const active = profile.areas?.includes(area);

                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className={
                        active
                          ? "rounded-full bg-primary px-4 py-2 text-sm font-black text-white"
                          : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600"
                      }
                    >
                      {active ? <CheckCircle2 className="mr-1 inline size-4" /> : null}
                      {area}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  className="form-input"
                  placeholder="Adicionar outra área..."
                  value={customArea}
                  onChange={(event) => setCustomArea(event.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (!customArea.trim()) return;
                    setProfile((current) => ({
                      ...current,
                      areas: [...(current.areas || []), customArea.trim()],
                    }));
                    setCustomArea("");
                  }}
                >
                  Adicionar
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Currículo, portfólio e links</h3>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Currículo completo
                  </span>
                  <textarea
                    className="form-input mt-1 min-h-36"
                    value={profile.resume ?? selectedMember.resume ?? selectedMember.resumeShort ?? ""}
                    onChange={(event) => setProfile((current) => ({ ...current, resume: event.target.value }))}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Portfólio / histórico / peças
                  </span>
                  <textarea
                    className="form-input mt-1 min-h-36"
                    value={profile.portfolio ?? selectedMember.portfolioText ?? ""}
                    onChange={(event) => setProfile((current) => ({ ...current, portfolio: event.target.value }))}
                  />
                </label>

                {["instagram", "youtube", "site", "drive", "portfolioOnline", "extra"].map((key) => (
                  <label key={key} className="block">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      {key}
                    </span>
                    <input
                      className="form-input mt-1"
                      placeholder="https://..."
                      value={profile.links?.[key] || ""}
                      onChange={(event) => setLink(key, event.target.value)}
                    />
                  </label>
                ))}

                <label className="block lg:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Observações internas
                  </span>
                  <textarea
                    className="form-input mt-1 min-h-28"
                    value={profile.notes || ""}
                    onChange={(event) => setProfile((current) => ({ ...current, notes: event.target.value }))}
                  />
                </label>
              </div>

              <button type="button" className="btn-primary mt-5" onClick={() => void saveProfile()}>
                Salvar perfil avançado
              </button>
            </section>

            <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Documentos do integrante</h3>
              <p className="mt-1 text-sm text-slate-500">
                Envie currículos, certificados, recibos, comprovantes, fotos, documentos pessoais e imagens de peças.
              </p>

              <div className="mt-5 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
                <select className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {docCategories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <label className="btn-primary cursor-pointer justify-center">
                  <UploadCloud className="size-4" />
                  Subir documentos
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void uploadDocs(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-3">
                {docs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                    Nenhum documento enviado para este integrante.
                  </div>
                ) : null}

                {docs.map((doc) => (
                  <div key={doc.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-black text-slate-950">{doc.category}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {doc.file_name} {doc.size_bytes ? `• ${fileSize(doc.size_bytes)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {doc.signedUrl ? (
                        <a className="btn-secondary" href={doc.signedUrl} target="_blank" rel="noreferrer">
                          <Eye className="size-4" />
                          Abrir
                        </a>
                      ) : null}
                      <button type="button" className="btn-secondary" onClick={() => void removeDoc(doc.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Montar PDF individual</h3>
              <p className="mt-1 text-sm text-slate-500">
                Selecione o que deve aparecer no relatório profissional.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {reportOptions.map(([key, label]) => (
                  <label key={key} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedReport[key]}
                      onChange={(event) =>
                        setSelectedReport((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>

              <button type="button" className="btn-primary mt-5" onClick={generatePdf}>
                <FileText className="size-4" />
                Gerar PDF profissional
              </button>
            </section>
          </main>
        ) : null}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}
