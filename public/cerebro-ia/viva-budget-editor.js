(function () {
  const params = new URLSearchParams(window.location.search);
  const vivaMode = params.get("viva") === "1";
  const projectId = params.get("project") || params.get("projectId") || "sem-projeto";

  if (!vivaMode) return;

  const STORAGE_KEY = `viva:cerebro:budget-editor:${projectId}`;
  const CEILING_KEY = `viva:cerebro:budget-ceiling:${projectId}`;

  const defaultRows = [
    {
      id: crypto.randomUUID(),
      rubrica: "Coordenação geral",
      item: "Coordenação, acompanhamento e organização geral do projeto",
      unidade: "Serviço",
      quantidade: 1,
      pessoas: 1,
      valorUnitario: 1800,
      justificativa: "Responsável pela condução geral, planejamento, comunicação e acompanhamento do projeto.",
    },
    {
      id: crypto.randomUUID(),
      rubrica: "Elenco e equipe artística",
      item: "Cachês de artistas, atores, direção e preparação",
      unidade: "Cachê fechado",
      quantidade: 1,
      pessoas: 1,
      valorUnitario: 3000,
      justificativa: "Remuneração da equipe artística envolvida na criação e execução das ações.",
    },
    {
      id: crypto.randomUUID(),
      rubrica: "Produção executiva",
      item: "Produção, logística, agenda, contatos e execução",
      unidade: "Serviço",
      quantidade: 1,
      pessoas: 1,
      valorUnitario: 1200,
      justificativa: "Atuação na organização prática e operacional do projeto.",
    },
    {
      id: crypto.randomUUID(),
      rubrica: "Comunicação",
      item: "Divulgação, redes sociais, peças gráficas e impulsionamento",
      unidade: "Serviço",
      quantidade: 1,
      pessoas: 1,
      valorUnitario: 900,
      justificativa: "Divulgação pública do projeto e ampliação de acesso ao público.",
    },
    {
      id: crypto.randomUUID(),
      rubrica: "Figurino/cenografia",
      item: "Materiais, figurinos, cenário e elementos visuais",
      unidade: "Item/material",
      quantidade: 1,
      pessoas: 1,
      valorUnitario: 800,
      justificativa: "Aquisição e preparação dos elementos visuais necessários.",
    },
    {
      id: crypto.randomUUID(),
      rubrica: "Técnica e equipamentos",
      item: "Som, luz, operação técnica e equipamentos",
      unidade: "Diária",
      quantidade: 3,
      pessoas: 1,
      valorUnitario: 400,
      justificativa: "Estrutura técnica necessária para ensaios, montagem e apresentação.",
    },
    {
      id: crypto.randomUUID(),
      rubrica: "Acessibilidade",
      item: "LIBRAS, mediação, recursos de acesso e inclusão",
      unidade: "Serviço",
      quantidade: 1,
      pessoas: 1,
      valorUnitario: 600,
      justificativa: "Garantia de acessibilidade e inclusão para públicos diversos.",
    },
    {
      id: crypto.randomUUID(),
      rubrica: "Prestação de contas",
      item: "Organização documental e acompanhamento financeiro",
      unidade: "Serviço",
      quantidade: 1,
      pessoas: 1,
      valorUnitario: 500,
      justificativa: "Controle, organização e conferência dos documentos do projeto.",
    },
  ];

  const unidades = [
    "Cachê fechado",
    "Diária",
    "Hora",
    "Apresentação",
    "Encontro/aula",
    "Mês",
    "Serviço",
    "Item/material",
    "Km/deslocamento",
  ];

  function clean(value) {
    return String(value || "").trim();
  }

  function normalize(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function money(value) {
    const number = Number(value || 0);

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number.isFinite(number) ? number : 0);
  }

  function loadRows() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}

    return defaultRows;
  }

  function saveRows(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }

  function loadCeiling() {
    return Number(localStorage.getItem(CEILING_KEY) || 10000);
  }

  function saveCeiling(value) {
    localStorage.setItem(CEILING_KEY, String(Number(value || 0)));
  }

  function totalRow(row) {
    return Number(row.quantidade || 0) * Number(row.pessoas || 0) * Number(row.valorUnitario || 0);
  }

  function totalBudget(rows) {
    return rows.reduce((sum, row) => sum + totalRow(row), 0);
  }

  function toastSafe(message) {
    try {
      if (typeof toast === "function") toast(message);
      else console.log("[CÉREBRO]", message);
    } catch {
      console.log("[CÉREBRO]", message);
    }
  }

  function injectStyle() {
    if (document.getElementById("viva-budget-editor-style")) return;

    const style = document.createElement("style");
    style.id = "viva-budget-editor-style";

    style.innerHTML = `
      .viva-budget-editor {
        margin-top: 18px;
        border-radius: 28px;
        border: 1px solid #e2e8f0;
        background: linear-gradient(135deg, #ffffff, #f8f5ff);
        padding: 18px;
        box-shadow: 0 18px 50px rgba(15,23,42,.08);
      }

      .viva-budget-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 14px;
      }

      .viva-budget-head h3 {
        margin: 0;
        color: #111827;
        font-size: 22px;
        letter-spacing: -.04em;
      }

      .viva-budget-head p {
        margin: 5px 0 0;
        color: #667085;
        line-height: 1.45;
      }

      .viva-budget-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: flex-end;
      }

      .viva-budget-btn {
        border: 0;
        border-radius: 999px;
        background: linear-gradient(90deg,#7c3aed,#db2777);
        color: white;
        min-height: 40px;
        padding: 0 14px;
        font-weight: 950;
        cursor: pointer;
      }

      .viva-budget-btn.light {
        background: #f1f5f9;
        color: #334155;
      }

      .viva-budget-info {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 220px 220px;
        gap: 10px;
        margin: 14px 0;
      }

      .viva-budget-info-card {
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 14px;
      }

      .viva-budget-info-card strong {
        display: block;
        color: #111827;
        font-size: 15px;
      }

      .viva-budget-info-card span {
        display: block;
        margin-top: 4px;
        color: #667085;
        font-size: 12px;
        line-height: 1.4;
      }

      .viva-budget-ceiling {
        width: 100%;
        height: 38px;
        border-radius: 14px;
        border: 1px solid #d7deea;
        padding: 0 10px;
        color: #111827;
      }

      .viva-budget-table-wrap {
        overflow-x: auto;
      }

      .viva-budget-table {
        width: 100%;
        min-width: 1160px;
        border-collapse: separate;
        border-spacing: 0 9px;
      }

      .viva-budget-table th {
        padding: 0 8px 4px;
        text-align: left;
        color: #64748b;
        font-size: 11px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .08em;
      }

      .viva-budget-table td {
        padding: 8px;
        background: white;
        border-top: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
      }

      .viva-budget-table td:first-child {
        border-left: 1px solid #e2e8f0;
        border-radius: 18px 0 0 18px;
      }

      .viva-budget-table td:last-child {
        border-right: 1px solid #e2e8f0;
        border-radius: 0 18px 18px 0;
      }

      .viva-budget-table input,
      .viva-budget-table select,
      .viva-budget-table textarea {
        width: 100%;
        border-radius: 14px;
        border: 1px solid #d7deea;
        background: #fff;
        color: #111827;
        padding: 9px 10px;
        outline: none;
        font: inherit;
        font-size: 13px;
      }

      .viva-budget-table textarea {
        min-height: 64px;
        resize: vertical;
      }

      .viva-budget-total {
        font-weight: 950;
        color: #111827;
        white-space: nowrap;
      }

      .viva-budget-delete {
        border: 0;
        border-radius: 999px;
        background: #fee2e2;
        color: #991b1b;
        padding: 8px 10px;
        font-weight: 950;
        cursor: pointer;
      }

      .viva-budget-footer {
        margin-top: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        border-top: 1px solid #e2e8f0;
        padding-top: 14px;
      }

      .viva-budget-grand {
        border-radius: 999px;
        background: #111827;
        color: white;
        padding: 10px 16px;
        font-weight: 950;
      }

      .viva-budget-alert {
        border-radius: 16px;
        padding: 10px 12px;
        font-weight: 900;
        font-size: 13px;
      }

      .viva-budget-alert.ok {
        background: #dcfce7;
        color: #166534;
      }

      .viva-budget-alert.bad {
        background: #fee2e2;
        color: #991b1b;
      }

      @media (max-width: 980px) {
        .viva-budget-info {
          grid-template-columns: 1fr;
        }

        .viva-budget-head {
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function findBudgetAnchor() {
    const nodes = Array.from(document.querySelectorAll("h1,h2,h3,strong,b,div,section"));

    const heading = nodes.find((node) => {
      const text = normalize(node.textContent || "");
      return text.includes("orcamento inteligente");
    });

    if (!heading) return null;

    let card = heading.closest("section") || heading.closest("div") || heading.parentElement;

    for (let i = 0; card && i < 4; i += 1) {
      const text = normalize(card.textContent || "");
      const rect = card.getBoundingClientRect();

      if (text.includes("orcamento inteligente") && rect.width > 500) return card;

      card = card.parentElement;
    }

    return heading.parentElement;
  }

  function render() {
    if (!normalize(document.body.innerText || "").includes("orcamento inteligente")) return;

    injectStyle();

    let panel = document.getElementById("viva-budget-editor");

    if (!panel) {
      const anchor = findBudgetAnchor();

      if (!anchor) return;

      panel = document.createElement("section");
      panel.id = "viva-budget-editor";
      panel.className = "viva-budget-editor";

      anchor.parentElement.insertBefore(panel, anchor.nextSibling);
    }

    const rows = loadRows();
    const ceiling = loadCeiling();
    const total = totalBudget(rows);
    const difference = ceiling - total;

    panel.innerHTML = `
      <div class="viva-budget-head">
        <div>
          <h3>Planilha editável de orçamento</h3>
          <p>
            Edite rubricas, tipo de cálculo, quantidade, pessoas/itens, valor unitário e justificativa.
            Se for por dia, use <strong>Unidade = Diária</strong> e coloque a quantidade de dias.
          </p>
        </div>

        <div class="viva-budget-actions">
          <button type="button" class="viva-budget-btn" data-add-row>+ Nova rubrica</button>
          <button type="button" class="viva-budget-btn light" data-export-csv>Exportar CSV</button>
          <button type="button" class="viva-budget-btn light" data-reset-budget>Restaurar modelo</button>
        </div>
      </div>

      <div class="viva-budget-info">
        <div class="viva-budget-info-card">
          <strong>Como funciona o cálculo?</strong>
          <span>Total = Quantidade × Pessoas/itens × Valor unitário. Exemplo: 3 diárias × 1 técnico × R$ 400 = R$ 1.200.</span>
        </div>

        <div class="viva-budget-info-card">
          <strong>Teto do edital</strong>
          <input class="viva-budget-ceiling" type="number" min="0" step="0.01" value="${ceiling}" data-ceiling />
        </div>

        <div class="viva-budget-info-card">
          <strong>Saldo</strong>
          <span class="${difference >= 0 ? "viva-budget-alert ok" : "viva-budget-alert bad"}">
            ${difference >= 0 ? "Dentro do teto" : "Passou do teto"}: ${money(difference)}
          </span>
        </div>
      </div>

      <div class="viva-budget-table-wrap">
        <table class="viva-budget-table">
          <thead>
            <tr>
              <th>Rubrica</th>
              <th>Descrição / item</th>
              <th>Unidade</th>
              <th>Qtd.</th>
              <th>Pessoas/itens</th>
              <th>Valor unitário</th>
              <th>Total</th>
              <th>Justificativa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row) => `
                <tr data-row-id="${row.id}">
                  <td>
                    <input value="${escapeAttr(row.rubrica)}" data-field="rubrica" />
                  </td>
                  <td>
                    <input value="${escapeAttr(row.item)}" data-field="item" />
                  </td>
                  <td>
                    <select data-field="unidade">
                      ${unidades
                        .map((unidade) => `
                          <option value="${escapeAttr(unidade)}" ${row.unidade === unidade ? "selected" : ""}>
                            ${unidade}
                          </option>
                        `)
                        .join("")}
                    </select>
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01" value="${Number(row.quantidade || 0)}" data-field="quantidade" />
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01" value="${Number(row.pessoas || 0)}" data-field="pessoas" />
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01" value="${Number(row.valorUnitario || 0)}" data-field="valorUnitario" />
                  </td>
                  <td class="viva-budget-total">${money(totalRow(row))}</td>
                  <td>
                    <textarea data-field="justificativa">${escapeHtml(row.justificativa || "")}</textarea>
                  </td>
                  <td>
                    <button type="button" class="viva-budget-delete" data-delete-row="${row.id}">Excluir</button>
                  </td>
                </tr>
              `)
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="viva-budget-footer">
        <div class="${difference >= 0 ? "viva-budget-alert ok" : "viva-budget-alert bad"}">
          ${difference >= 0 ? "Orçamento dentro do teto." : "Orçamento acima do teto. Ajuste rubricas ou valores."}
        </div>

        <div class="viva-budget-grand">
          Total previsto: ${money(total)}
        </div>
      </div>
    `;
  }

  function escapeHtml(value) {
    return clean(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll('"', "&quot;");
  }

  function updateRow(rowId, field, value) {
    const rows = loadRows();

    const next = rows.map((row) => {
      if (row.id !== rowId) return row;

      const numeric = ["quantidade", "pessoas", "valorUnitario"].includes(field);

      return {
        ...row,
        [field]: numeric ? Number(value || 0) : value,
      };
    });

    saveRows(next);
    render();
  }

  function addRow() {
    const rows = loadRows();

    rows.push({
      id: crypto.randomUUID(),
      rubrica: "Nova rubrica",
      item: "",
      unidade: "Serviço",
      quantidade: 1,
      pessoas: 1,
      valorUnitario: 0,
      justificativa: "",
    });

    saveRows(rows);
    render();
  }

  function deleteRow(id) {
    const rows = loadRows().filter((row) => row.id !== id);
    saveRows(rows.length ? rows : defaultRows);
    render();
  }

  function resetBudget() {
    if (!window.confirm("Restaurar o modelo inicial de orçamento?")) return;

    saveRows(defaultRows);
    render();
  }

  function exportCsv() {
    const rows = loadRows();

    const header = [
      "Rubrica",
      "Descrição",
      "Unidade",
      "Quantidade",
      "Pessoas/itens",
      "Valor unitário",
      "Total",
      "Justificativa",
    ];

    const body = rows.map((row) => [
      row.rubrica,
      row.item,
      row.unidade,
      row.quantidade,
      row.pessoas,
      row.valorUnitario,
      totalRow(row),
      row.justificativa,
    ]);

    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "orcamento-cerebro-ia.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  document.addEventListener("input", function (event) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    if (target.matches("[data-ceiling]")) {
      saveCeiling(target.value);
      render();
      return;
    }

    const field = target.getAttribute("data-field");
    const row = target.closest("[data-row-id]");

    if (!field || !row) return;

    updateRow(row.getAttribute("data-row-id"), field, target.value);
  });

  document.addEventListener("change", function (event) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    const field = target.getAttribute("data-field");
    const row = target.closest("[data-row-id]");

    if (!field || !row) return;

    updateRow(row.getAttribute("data-row-id"), field, target.value);
  });

  document.addEventListener("click", function (event) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    if (target.hasAttribute("data-add-row")) {
      addRow();
    }

    if (target.hasAttribute("data-reset-budget")) {
      resetBudget();
    }

    if (target.hasAttribute("data-export-csv")) {
      exportCsv();
    }

    const deleteId = target.getAttribute("data-delete-row");

    if (deleteId) {
      deleteRow(deleteId);
    }
  });

  function boot() {
    render();

    const observer = new MutationObserver(render);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    setInterval(render, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
