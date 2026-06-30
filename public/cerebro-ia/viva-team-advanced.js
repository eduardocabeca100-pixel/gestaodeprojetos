(function () {
  const params = new URLSearchParams(window.location.search);
  const vivaMode = params.get("viva") === "1";
  const projectId = params.get("project") || params.get("projectId") || "sem-projeto";

  if (!vivaMode) return;

  const AREAS = [
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

  const LINK_FIELDS = [
    ["instagram", "Instagram"],
    ["youtube", "YouTube"],
    ["site", "Site"],
    ["portfolioOnline", "Portfólio online"],
    ["drive", "Drive / pasta"],
    ["extra", "Link extra"],
  ];

  const DOC_TYPES = [
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

  function escapeHtml(value) {
    return clean(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function toastSafe(message) {
    try {
      if (typeof toast === "function") toast(message);
      else console.log("[CÉREBRO]", message);
    } catch {
      console.log("[CÉREBRO]", message);
    }
  }

  function labelTextFor(field) {
    const id = field.getAttribute("id");
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || "";
    }

    const parent = field.parentElement;
    if (!parent) return "";

    const label =
      parent.querySelector("label") ||
      parent.previousElementSibling ||
      parent.closest("label");

    return label?.textContent || field.getAttribute("placeholder") || field.getAttribute("name") || "";
  }

  function fields(modal) {
    return Array.from(modal.querySelectorAll("input, textarea, select"));
  }

  function findField(modal, labels, tag) {
    const search = labels.map(normalize);

    return fields(modal).find((field) => {
      if (tag && field.tagName.toLowerCase() !== tag) return false;

      const full = normalize(
        [
          labelTextFor(field),
          field.getAttribute("placeholder"),
          field.getAttribute("name"),
          field.getAttribute("aria-label"),
        ].join(" "),
      );

      return search.some((item) => full.includes(item));
    });
  }

  function setValue(field, value) {
    if (!field) return;

    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getPersonName(modal) {
    return clean(findField(modal, ["nome completo", "nome"], "input")?.value) || "Integrante";
  }

  function getPersonRole(modal) {
    return clean(findField(modal, ["função", "funcao", "cargo"], "input")?.value);
  }

  function getPersonKey(modal) {
    const cpf = clean(findField(modal, ["cpf"], "input")?.value);
    const email = clean(findField(modal, ["e-mail", "email"], "input")?.value);
    const name = getPersonName(modal);

    return normalize(cpf || email || name).replace(/[^a-z0-9._-]+/g, "-") || "integrante";
  }

  function isTeamModal(element) {
    const text = normalize(element.textContent || "");
    const rect = element.getBoundingClientRect();
    const count = element.querySelectorAll("input, textarea").length;

    return (
      rect.width > 600 &&
      rect.height > 360 &&
      count >= 8 &&
      text.includes("funcao") &&
      text.includes("cpf") &&
      text.includes("curriculo") &&
      text.includes("portfolio")
    );
  }

  function findTeamModals() {
    return Array.from(document.querySelectorAll("div, section, form"))
      .filter(isTeamModal)
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return ar.width * ar.height - br.width * br.height;
      });
  }

  async function loadProfile(modal) {
    const personKey = getPersonKey(modal);
    const response = await fetch(
      `/api/cerebro/team-profile?projectId=${encodeURIComponent(projectId)}&personKey=${encodeURIComponent(personKey)}`,
      { credentials: "same-origin", cache: "no-store" },
    );

    const data = await response.json().catch(() => ({}));
    return data.profile || null;
  }

  async function saveProfile(modal, panel) {
    const personKey = getPersonKey(modal);
    const personName = getPersonName(modal);
    const role = getPersonRole(modal);

    const areas = Array.from(panel.querySelectorAll("[data-area].active"))
      .map((item) => item.getAttribute("data-area"))
      .filter(Boolean);

    const links = {};
    for (const input of panel.querySelectorAll("[data-link-key]")) {
      links[input.getAttribute("data-link-key")] = clean(input.value);
    }

    const resume = clean(findField(modal, ["currículo", "curriculo"], "textarea")?.value);
    const portfolio = clean(findField(modal, ["portfólio", "portfolio"], "textarea")?.value);
    const notes = clean(panel.querySelector("[data-notes]")?.value);

    const response = await fetch("/api/cerebro/team-profile", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        personKey,
        personName,
        role,
        areas,
        links,
        resume,
        portfolio,
        notes,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (data.ok) toastSafe("Perfil avançado salvo.");
    else toastSafe(data.message || "Não consegui salvar perfil avançado.");

    const areaField = findField(modal, ["área", "area"], "input");
    const linksField = findField(modal, ["links", "link"], "textarea");
    const docsField = findField(modal, ["documentos", "documento"], "textarea");

    setValue(areaField, areas.join(", "));

    const linksText = LINK_FIELDS.map(([key, label]) => {
      return links[key] ? `${label}: ${links[key]}` : "";
    }).filter(Boolean).join("\n");

    if (linksText) setValue(linksField, linksText);

    const docs = panel.__documents || [];
    if (docsField && docs.length) {
      setValue(
        docsField,
        docs.map((doc) => `${doc.category}: ${doc.file_name}`).join("\n"),
      );
    }
  }

  async function loadDocuments(modal, panel) {
    const personKey = getPersonKey(modal);

    const response = await fetch(
      `/api/cerebro/team-documents?projectId=${encodeURIComponent(projectId)}&personKey=${encodeURIComponent(personKey)}`,
      { credentials: "same-origin", cache: "no-store" },
    );

    const data = await response.json().catch(() => ({}));
    panel.__documents = data.documents || [];
    renderDocuments(panel);
  }

  function renderDocuments(panel) {
    const list = panel.querySelector(".viva-doc-list");
    const docs = panel.__documents || [];

    if (!docs.length) {
      list.innerHTML = `<div class="viva-doc-empty">Nenhum documento enviado ainda.</div>`;
      return;
    }

    list.innerHTML = docs.map((doc) => `
      <div class="viva-doc-item">
        <div>
          <strong>${escapeHtml(doc.category)}</strong>
          <span>${escapeHtml(doc.file_name)} • ${Math.max(1, Math.round((doc.size_bytes || 0) / 1024))} KB</span>
        </div>
        <div class="viva-doc-actions">
          ${doc.signedUrl ? `<a href="${doc.signedUrl}" target="_blank" rel="noreferrer">Abrir</a>` : ""}
          <button type="button" data-remove-doc="${doc.id}">Remover</button>
        </div>
      </div>
    `).join("");
  }

  async function uploadDocument(modal, panel, input) {
    const files = Array.from(input.files || []);
    const category = input.getAttribute("data-doc-category") || "Documento";

    if (!files.length) return;

    for (const file of files) {
      const form = new FormData();

      form.append("projectId", projectId);
      form.append("personKey", getPersonKey(modal));
      form.append("personName", getPersonName(modal));
      form.append("category", category);
      form.append("file", file);

      const response = await fetch("/api/cerebro/team-documents", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });

      const data = await response.json().catch(() => ({}));

      if (!data.ok) {
        toastSafe(data.message || "Não consegui enviar documento.");
      }
    }

    input.value = "";
    await loadDocuments(modal, panel);
    await saveProfile(modal, panel);
  }

  async function removeDocument(panel, id) {
    const response = await fetch(`/api/cerebro/team-documents?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    const data = await response.json().catch(() => ({}));
    toastSafe(data.message || "Documento processado.");
  }

  function buildReportHtml(modal, panel) {
    const docs = panel.__documents || [];
    const areas = Array.from(panel.querySelectorAll("[data-area].active"))
      .map((item) => item.getAttribute("data-area"))
      .filter(Boolean);

    const links = LINK_FIELDS.map(([key, label]) => {
      const value = clean(panel.querySelector(`[data-link-key="${key}"]`)?.value);
      return value ? `<li><strong>${label}:</strong> ${escapeHtml(value)}</li>` : "";
    }).join("");

    const include = {};
    for (const box of panel.querySelectorAll("[data-report-option]")) {
      include[box.getAttribute("data-report-option")] = box.checked;
    }

    const name = getPersonName(modal);
    const role = getPersonRole(modal);
    const cpf = clean(findField(modal, ["cpf"], "input")?.value);
    const email = clean(findField(modal, ["e-mail", "email"], "input")?.value);
    const phone = clean(findField(modal, ["telefone"], "input")?.value);
    const address = clean(findField(modal, ["endereço", "endereco"], "input")?.value);
    const city = clean(findField(modal, ["cidade"], "input")?.value);
    const resume = clean(findField(modal, ["currículo", "curriculo"], "textarea")?.value);
    const portfolio = clean(findField(modal, ["portfólio", "portfolio"], "textarea")?.value);
    const notes = clean(panel.querySelector("[data-notes]")?.value);

    const imageDocs = docs.filter((doc) => String(doc.mime_type || "").startsWith("image/") && doc.signedUrl);

    return `
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatório do integrante</title>
        <style>
          @page { size: A4; margin: 14mm; }
          body { font-family: Arial, sans-serif; color: #111827; line-height: 1.45; }
          h1 { font-size: 24px; margin: 0 0 4px; }
          h2 { margin: 18px 0 8px; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          p { margin: 3px 0; }
          .box { border: 1px solid #ddd; border-radius: 12px; padding: 12px; margin: 10px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .doc { border: 1px solid #e5e7eb; padding: 8px; border-radius: 10px; margin-bottom: 6px; }
          img { max-width: 100%; border-radius: 10px; margin: 8px 0; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(name)}</h1>
        <p><strong>Função principal:</strong> ${escapeHtml(role || "Não informado")}</p>
        <p><strong>Áreas:</strong> ${escapeHtml(areas.join(", ") || "Não informado")}</p>

        ${include.dados ? `
          <h2>Dados cadastrais</h2>
          <div class="grid">
            <p><strong>CPF:</strong> ${escapeHtml(cpf || "-")}</p>
            <p><strong>E-mail:</strong> ${escapeHtml(email || "-")}</p>
            <p><strong>Telefone:</strong> ${escapeHtml(phone || "-")}</p>
            <p><strong>Cidade/UF:</strong> ${escapeHtml(city || "-")}</p>
            <p><strong>Endereço:</strong> ${escapeHtml(address || "-")}</p>
          </div>
        ` : ""}

        ${include.curriculo ? `
          <h2>Currículo</h2>
          <div class="box">${escapeHtml(resume || "Não informado").replaceAll("\n", "<br>")}</div>
        ` : ""}

        ${include.portfolio ? `
          <h2>Portfólio</h2>
          <div class="box">${escapeHtml(portfolio || "Não informado").replaceAll("\n", "<br>")}</div>
        ` : ""}

        ${include.links ? `
          <h2>Links</h2>
          <ul>${links || "<li>Não informado.</li>"}</ul>
        ` : ""}

        ${include.documentos ? `
          <h2>Documentos registrados</h2>
          ${docs.map((doc) => `
            <div class="doc">
              <strong>${escapeHtml(doc.category)}</strong><br>
              ${escapeHtml(doc.file_name)}
            </div>
          `).join("") || "<p>Nenhum documento registrado.</p>"}
        ` : ""}

        ${include.imagens ? `
          <h2>Imagens anexadas</h2>
          ${imageDocs.map((doc) => `
            <div class="doc">
              <strong>${escapeHtml(doc.category)}:</strong> ${escapeHtml(doc.file_name)}
              <br><img src="${doc.signedUrl}" />
            </div>
          `).join("") || "<p>Nenhuma imagem anexada.</p>"}
        ` : ""}

        ${include.observacoes ? `
          <h2>Observações internas</h2>
          <div class="box">${escapeHtml(notes || "Não informado").replaceAll("\n", "<br>")}</div>
        ` : ""}
      </body>
      </html>
    `;
  }

  function printReport(modal, panel) {
    const html = buildReportHtml(modal, panel);
    const frame = document.createElement("iframe");

    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";

    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document;
    if (!doc || !frame.contentWindow) {
      frame.remove();
      toastSafe("Não consegui preparar PDF.");
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 1400);
    }, 450);
  }

  function injectStyle() {
    if (document.getElementById("viva-team-advanced-style")) return;

    const style = document.createElement("style");
    style.id = "viva-team-advanced-style";
    style.innerHTML = `
      .viva-team-advanced {
        margin-top: 18px;
        border-radius: 26px;
        border: 1px solid #e2e8f0;
        background: linear-gradient(135deg, #ffffff, #f8f5ff);
        padding: 18px;
      }
      .viva-team-advanced h3 { margin: 0; color: #111827; font-size: 20px; }
      .viva-team-advanced p { margin: 5px 0 0; color: #667085; line-height: 1.45; }
      .viva-team-section { margin-top: 16px; border-radius: 22px; border: 1px solid #e5e7eb; background: rgba(255,255,255,.9); padding: 15px; }
      .viva-team-title { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
      .viva-team-title strong { color: #111827; font-size: 14px; font-weight: 950; }
      .viva-chip-grid, .viva-doc-grid, .viva-report-grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .viva-chip, .viva-doc-chip, .viva-report-grid label {
        min-height: 36px; display: inline-flex; align-items: center; gap: 7px;
        border-radius: 999px; border: 1px solid #e2e8f0; background: white;
        color: #334155; padding: 0 12px; font-size: 12px; font-weight: 900; cursor: pointer;
      }
      .viva-chip.active { border-color: #7c3aed; background: #f1edff; color: #6d28d9; }
      .viva-custom-area { margin-top: 10px; display: grid; grid-template-columns: 1fr auto; gap: 8px; }
      .viva-links-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .viva-links-grid label { display: grid; gap: 5px; color: #334155; font-size: 12px; font-weight: 900; }
      .viva-custom-area input, .viva-links-grid input, .viva-notes {
        width: 100%; border-radius: 16px; border: 1px solid #d7deea; background: white;
        padding: 11px 12px; outline: none; color: #111827; font: inherit;
      }
      .viva-notes { min-height: 92px; resize: vertical; }
      .viva-btn {
        border: 0; border-radius: 999px; background: linear-gradient(90deg,#7c3aed,#db2777);
        color: white; min-height: 40px; padding: 0 15px; font-weight: 950; cursor: pointer;
      }
      .viva-doc-list { margin-top: 12px; display: grid; gap: 8px; }
      .viva-doc-item, .viva-doc-empty {
        display: flex; justify-content: space-between; align-items: center; gap: 8px;
        border-radius: 16px; border: 1px solid #e2e8f0; background: white; padding: 10px 12px;
        color: #334155; font-size: 12px;
      }
      .viva-doc-item strong { display: block; color: #111827; }
      .viva-doc-actions { display: flex; gap: 8px; align-items: center; }
      .viva-doc-actions a, .viva-doc-actions button {
        border: 0; border-radius: 999px; background: #f1f5f9; color: #334155;
        padding: 7px 10px; font-size: 12px; font-weight: 900; text-decoration: none; cursor: pointer;
      }
      .viva-footer { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
      @media (max-width: 820px) {
        .viva-links-grid, .viva-custom-area { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  async function createPanel(modal) {
    injectStyle();

    const panel = document.createElement("section");
    panel.className = "viva-team-advanced";
    panel.innerHTML = `
      <h3>Cadastro avançado do integrante</h3>
      <p>Áreas múltiplas, links, currículo, portfólio, documentos, imagens e relatório individual em PDF.</p>

      <div class="viva-team-section">
        <div class="viva-team-title"><strong>Áreas de atuação</strong><span>selecione uma ou várias</span></div>
        <div class="viva-chip-grid">
          ${AREAS.map((area) => `<button type="button" class="viva-chip" data-area="${area}">${area}</button>`).join("")}
        </div>
        <div class="viva-custom-area">
          <input type="text" placeholder="Adicionar outra área ou função..." data-custom-area />
          <button type="button" class="viva-btn" data-add-area>Adicionar área</button>
        </div>
      </div>

      <div class="viva-team-section">
        <div class="viva-team-title"><strong>Links e presença digital</strong><span>Instagram, YouTube, site, Drive...</span></div>
        <div class="viva-links-grid">
          ${LINK_FIELDS.map(([key, label]) => `
            <label>${label}<input type="url" placeholder="https://..." data-link-key="${key}" /></label>
          `).join("")}
        </div>
      </div>

      <div class="viva-team-section">
        <div class="viva-team-title"><strong>Documentos reais do integrante</strong><span>pode subir vários arquivos</span></div>
        <div class="viva-doc-grid">
          ${DOC_TYPES.map((type) => `
            <label class="viva-doc-chip">+ ${type}<input type="file" multiple hidden data-doc-category="${type}" /></label>
          `).join("")}
        </div>
        <div class="viva-doc-list"></div>
      </div>

      <div class="viva-team-section">
        <div class="viva-team-title"><strong>Relatório individual em PDF</strong><span>selecione o que vai no relatório</span></div>
        <div class="viva-report-grid">
          ${[
            ["dados", "Dados cadastrais"],
            ["curriculo", "Currículo"],
            ["portfolio", "Portfólio"],
            ["links", "Links"],
            ["documentos", "Lista de documentos"],
            ["imagens", "Imagens anexadas"],
            ["observacoes", "Observações"],
          ].map(([key, label]) => `<label><input type="checkbox" data-report-option="${key}" checked /> ${label}</label>`).join("")}
        </div>
      </div>

      <div class="viva-team-section">
        <div class="viva-team-title"><strong>Observações internas</strong></div>
        <textarea class="viva-notes" data-notes placeholder="Histórico com a companhia, peças que participou, disponibilidade, observações para edital..."></textarea>
      </div>

      <div class="viva-footer">
        <button type="button" class="viva-btn" data-save-profile>Salvar perfil avançado</button>
        <button type="button" class="viva-btn" data-pdf-report>Gerar PDF do integrante</button>
      </div>
    `;

    modal.appendChild(panel);

    const profile = await loadProfile(modal);
    if (profile) {
      for (const area of profile.areas || []) {
        let chip = panel.querySelector(`[data-area="${CSS.escape(area)}"]`);
        if (!chip) {
          chip = document.createElement("button");
          chip.type = "button";
          chip.className = "viva-chip";
          chip.setAttribute("data-area", area);
          chip.textContent = area;
          panel.querySelector(".viva-chip-grid").appendChild(chip);
        }
        chip.classList.add("active");
      }

      for (const [key] of LINK_FIELDS) {
        const input = panel.querySelector(`[data-link-key="${key}"]`);
        if (input) input.value = profile.links?.[key] || "";
      }

      const notes = panel.querySelector("[data-notes]");
      if (notes) notes.value = profile.notes || "";
    }

    await loadDocuments(modal, panel);

    panel.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const area = target.getAttribute("data-area");
      if (area) {
        target.classList.toggle("active");
        await saveProfile(modal, panel);
      }

      if (target.hasAttribute("data-add-area")) {
        const input = panel.querySelector("[data-custom-area]");
        const value = clean(input?.value);
        if (!value) return;

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "viva-chip active";
        chip.setAttribute("data-area", value);
        chip.textContent = value;
        panel.querySelector(".viva-chip-grid").appendChild(chip);
        input.value = "";
        await saveProfile(modal, panel);
      }

      const removeId = target.getAttribute("data-remove-doc");
      if (removeId) {
        await removeDocument(panel, removeId);
        await loadDocuments(modal, panel);
      }

      if (target.hasAttribute("data-save-profile")) {
        await saveProfile(modal, panel);
      }

      if (target.hasAttribute("data-pdf-report")) {
        printReport(modal, panel);
      }
    });

    panel.addEventListener("change", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;

      if (target.hasAttribute("data-doc-category")) {
        await uploadDocument(modal, panel, target);
      } else {
        await saveProfile(modal, panel);
      }
    });
  }

  function scan() {
    const modals = findTeamModals();

    for (const modal of modals) {
      if (!modal.querySelector(".viva-team-advanced")) {
        void createPanel(modal);
      }
    }
  }

  function boot() {
    injectStyle();
    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    setInterval(scan, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
