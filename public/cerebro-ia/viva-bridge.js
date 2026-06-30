(function () {
  const params = new URLSearchParams(window.location.search);
  const vivaMode = params.get("viva") === "1";
  const projectId = params.get("project") || params.get("projectId") || "";

  if (!vivaMode) return;

  const AUTH_KEY = "viva:cerebro:auth:v1";
  const DOCS_KEY = "viva:cerebro:team-docs:v1";

  function injectStyle() {
    const style = document.createElement("style");

    style.innerHTML = `
      .account,
      .account-card,
      .userbox,
      .logout,
      button.logout,
      [onclick*="logout"],
      [onclick*="Logout"] {
        display: none !important;
      }

      .content {
        max-width: 1280px !important;
      }

      body {
        background: linear-gradient(135deg,#f8fbff,#f7f2ff 55%,#fff8fb) !important;
      }

      .viva-cerebro-lock {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top left, rgba(124,58,237,.22), transparent 32%),
          radial-gradient(circle at top right, rgba(219,39,119,.18), transparent 34%),
          rgba(15,23,42,.72);
        backdrop-filter: blur(16px);
      }

      .viva-cerebro-login {
        width: min(520px, 100%);
        border-radius: 32px;
        border: 1px solid rgba(255,255,255,.72);
        background: rgba(255,255,255,.96);
        box-shadow: 0 30px 100px rgba(15,23,42,.35);
        padding: 28px;
      }

      .viva-cerebro-login-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        background: #f1edff;
        color: #6d28d9;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
        padding: 8px 12px;
      }

      .viva-cerebro-login h1 {
        margin: 18px 0 8px;
        color: #111827;
        font-size: 30px;
        letter-spacing: -.04em;
      }

      .viva-cerebro-login p {
        margin: 0 0 18px;
        color: #667085;
        line-height: 1.5;
      }

      .viva-cerebro-field {
        display: grid;
        gap: 7px;
        margin-top: 14px;
      }

      .viva-cerebro-field label {
        color: #334155;
        font-weight: 900;
        font-size: 13px;
      }

      .viva-cerebro-field input {
        width: 100%;
        height: 52px;
        border-radius: 18px;
        border: 1px solid #d8deea;
        padding: 0 16px;
        outline: none;
        font: inherit;
        color: #111827;
        background: white;
      }

      .viva-cerebro-field input:focus {
        border-color: #a78bfa;
        box-shadow: 0 0 0 4px rgba(124,58,237,.12);
      }

      .viva-cerebro-actions {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 18px;
      }

      .viva-cerebro-btn {
        height: 46px;
        border: 0;
        border-radius: 999px;
        padding: 0 20px;
        cursor: pointer;
        font-weight: 900;
      }

      .viva-cerebro-btn.primary {
        color: white;
        background: linear-gradient(90deg,#7c3aed,#db2777);
      }

      .viva-cerebro-btn.light {
        color: #334155;
        background: #f1f5f9;
      }

      .viva-cerebro-error {
        display: none;
        margin-top: 14px;
        border-radius: 16px;
        border: 1px solid #fecdd3;
        background: #fff1f2;
        color: #991b1b;
        padding: 12px;
        font-weight: 800;
      }

      .viva-docs-panel {
        margin-top: 16px;
        padding: 16px;
        border: 1px dashed #cbd5e1;
        border-radius: 22px;
        background: #f8fbff;
      }

      .viva-docs-panel h3 {
        margin: 0 0 6px;
        color: #111827;
        font-size: 16px;
      }

      .viva-docs-panel p {
        margin: 0 0 12px;
        color: #667085;
      }

      .viva-docs-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .viva-docs-chip {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 34px;
        border-radius: 999px;
        border: 1px solid #e2e8f0;
        background: white;
        padding: 0 12px;
        color: #334155;
        font-weight: 900;
        cursor: pointer;
      }

      .viva-docs-list {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }

      .viva-docs-item {
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        background: white;
        padding: 10px 12px;
        color: #334155;
        font-size: 12px;
      }
    `;

    document.head.appendChild(style);
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function toastSafe(message) {
    try {
      if (typeof toast === "function") toast(message);
      else console.log("[VIVA]", message);
    } catch {
      console.log("[VIVA]", message);
    }
  }

  function getState() {
    try {
      if (typeof state !== "undefined") return state;
    } catch {}
    return null;
  }

  function saveSafe() {
    try {
      if (typeof save === "function") save();
    } catch {}
  }

  function renderSafe() {
    try {
      if (typeof render === "function") render();
    } catch {}
  }

  function getDocsStore() {
    try {
      return JSON.parse(localStorage.getItem(DOCS_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function setDocsStore(value) {
    localStorage.setItem(DOCS_KEY, JSON.stringify(value));
  }

  function personKey(member) {
    return (
      clean(member?.cpf || member?.document).toLowerCase() ||
      clean(member?.email).toLowerCase() ||
      clean(member?.name).toLowerCase()
    );
  }

  function keyOf(member) {
    const cpf = clean(member.cpf || member.document);
    const email = clean(member.email).toLowerCase();
    const name = clean(member.name).toLowerCase();
    const role = clean(member.role || member.area).toLowerCase();

    return cpf || email || `${name}|${role}`;
  }

  function normalizeVivaMember(member) {
    return {
      id: clean(member.id || member.vivaId || member.name || `viva-${Date.now()}`),
      vivaId: clean(member.vivaId || member.id),
      name: clean(member.name) || "Integrante sem nome",
      art: clean(member.art || member.artisticName || member.name),
      artisticName: clean(member.artisticName || member.art || member.name),
      role: clean(member.role || member.area) || "Equipe",
      area: clean(member.area || member.role) || "Artes cênicas",
      cpf: clean(member.cpf || member.document),
      cnpj: clean(member.cnpj),
      birth: clean(member.birth),
      city: clean(member.city || member.cityState) || "Jaraguá do Sul/SC",
      address: clean(member.address),
      phone: clean(member.phone),
      email: clean(member.email),
      fee: Number(member.fee || member.expectedAmount || 0),
      pix: clean(member.pix),
      resumeShort: clean(member.resumeShort || member.resume || member.notes),
      resume: clean(member.resume || member.resumeShort || member.notes),
      portfolio: clean(member.portfolio || member.portfolioText),
      portfolioText: clean(member.portfolioText || member.portfolio),
      links: clean(member.links || member.linksText),
      linksText: clean(member.linksText || member.links),
      docs: clean(member.docs || member.docsText),
      docsText: clean(member.docsText || member.docs),
      projectHistory: clean(member.projectHistory),
      editalFunction: clean(member.editalFunction || member.role || member.area),
      observations: clean(member.observations || member.notes),
      source: "viva"
    };
  }

  function mergeTeam(vivaTeam) {
    const currentState = getState();

    if (!currentState || !Array.isArray(vivaTeam)) return 0;
    if (!Array.isArray(currentState.team)) currentState.team = [];

    const map = new Map();

    for (const member of currentState.team) {
      map.set(keyOf(member), member);
    }

    let added = 0;

    for (const raw of vivaTeam) {
      const incoming = normalizeVivaMember(raw);
      const key = keyOf(incoming);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, incoming);
        added += 1;
      } else {
        map.set(key, {
          ...incoming,
          ...existing,
          id: existing.id || incoming.id,
          vivaId: existing.vivaId || incoming.vivaId,
          source: existing.source || "viva"
        });
      }
    }

    currentState.team = Array.from(map.values());
    saveSafe();

    return added;
  }

  async function loadVivaTeam() {
    if (!projectId) {
      toastSafe("Cérebro IA aberto sem projeto ativo. Equipe será sincronizada quando houver projeto.");
      return;
    }

    try {
      const response = await fetch(`/api/cerebro/equipe?projectId=${encodeURIComponent(projectId)}`, {
        credentials: "same-origin",
        cache: "no-store"
      });

      const data = await response.json();

      if (!data.ok) {
        toastSafe(data.message || "Não consegui carregar equipe do VIVA.");
        return;
      }

      const added = mergeTeam(data.team || []);
      renderSafe();

      if (added > 0) {
        toastSafe(`Equipe do VIVA sincronizada: ${added} integrante(s) adicionados.`);
      } else {
        toastSafe("Equipe do VIVA sincronizada.");
      }
    } catch (error) {
      console.error(error);
      toastSafe("Não consegui sincronizar equipe do VIVA agora.");
    }
  }

  async function syncMemberToViva(member) {
    if (!member || !clean(member.name)) return;

    try {
      const response = await fetch("/api/cerebro/equipe", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          member
        })
      });

      const data = await response.json().catch(() => ({}));

      if (data.ok) {
        toastSafe(data.message || "Integrante sincronizado com o VIVA.");
      } else {
        toastSafe(data.message || "Integrante salvo no Cérebro; sincronização com VIVA pendente.");
      }
    } catch (error) {
      console.error(error);
      toastSafe("Integrante salvo no Cérebro; sincronização com VIVA pendente.");
    }
  }

  function patchSaveTeam() {
    try {
      if (typeof saveTeam !== "function") return;
      if (saveTeam.__vivaPatched) return;

      const originalSaveTeam = saveTeam;

      const patchedSaveTeam = function (id) {
        const result = originalSaveTeam.apply(this, arguments);

        setTimeout(function () {
          const currentState = getState();

          if (!currentState || !Array.isArray(currentState.team)) return;

          const member =
            currentState.team.find((item) => item.id === id) ||
            currentState.team[currentState.team.length - 1];

          if (member) syncMemberToViva(member);
        }, 250);

        return result;
      };

      patchedSaveTeam.__vivaPatched = true;
      saveTeam = patchedSaveTeam;
    } catch {}
  }

  function patchChatIa() {
    try {
      if (typeof sendChat !== "function") return;
      if (sendChat.__vivaPatched) return;

      const patchedSendChat = async function () {
        const input = document.getElementById("chatInput");
        const chatBox = document.getElementById("chatBox");
        const message = input ? clean(input.value) : "";

        if (!message) return;

        if (chatBox) {
          chatBox.innerHTML += `<br><br><b>Você:</b> ${message}<br><b>IA:</b> Gerando resposta...`;
        }

        if (input) input.value = "";

        try {
          const currentState = getState();

          const response = await fetch("/api/ia", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              task: "chat do Cérebro IA",
              message,
              project: currentState?.projects?.[0] || null,
              team: currentState?.team || []
            })
          });

          const data = await response.json().catch(() => ({}));
          const output = data.output || data.message || "A IA não retornou texto.";

          if (chatBox) {
            chatBox.innerHTML = chatBox.innerHTML.replace("Gerando resposta...", output);
            chatBox.scrollTop = chatBox.scrollHeight;
          }
        } catch {
          if (chatBox) {
            chatBox.innerHTML = chatBox.innerHTML.replace(
              "Gerando resposta...",
              "Não consegui conectar com a IA. Confira GROQ_API_KEY e GROQ_MODEL na Vercel."
            );
          }
        }
      };

      patchedSendChat.__vivaPatched = true;
      sendChat = patchedSendChat;
    } catch {}
  }

  function findActiveMemberFromModal() {
    const currentState = getState();
    if (!currentState || !Array.isArray(currentState.team)) return null;

    const modal = document.querySelector(".modal.show, .modal-back.show, .modalbox, .modal");
    const text = modal ? modal.textContent || "" : "";

    const byText = currentState.team.find((member) => clean(member.name) && text.includes(member.name));

    return byText || currentState.team[currentState.team.length - 1] || null;
  }

  function enhanceTeamModal() {
    const modal =
      document.querySelector(".modal.show .modalbox") ||
      document.querySelector(".modal-back.show .modal") ||
      document.querySelector(".modalbox") ||
      document.querySelector(".modal");

    if (!modal || modal.querySelector(".viva-docs-panel")) return;

    const title = clean(modal.textContent);

    if (
      !title.includes("Novo integrante") &&
      !title.includes("Editar integrante") &&
      !title.includes("integrante") &&
      !title.includes("Equipe")
    ) {
      return;
    }

    const panel = document.createElement("div");
    panel.className = "viva-docs-panel";

    panel.innerHTML = `
      <h3>Arquivos e documentos do integrante</h3>
      <p>Adicione currículo, certificados, diplomas, documentos, fotos e portfólio. Os nomes ficam registrados no campo Documentos e no banco local do Cérebro IA.</p>

      <div class="viva-docs-grid">
        ${["Currículo", "Certificado", "Diploma", "Documento", "Foto", "Portfólio", "Carta de anuência"].map((label) => `
          <label class="viva-docs-chip">
            + ${label}
            <input type="file" multiple hidden data-viva-doc-category="${label}" />
          </label>
        `).join("")}
      </div>

      <div class="viva-docs-list"></div>
    `;

    modal.appendChild(panel);

    const list = panel.querySelector(".viva-docs-list");

    panel.querySelectorAll("input[type='file']").forEach((input) => {
      input.addEventListener("change", function () {
        const files = Array.from(input.files || []);
        const category = input.getAttribute("data-viva-doc-category") || "Documento";
        const member = findActiveMemberFromModal();
        const key = personKey(member || { name: "sem-nome" });
        const store = getDocsStore();

        if (!store[key]) store[key] = [];

        for (const file of files) {
          const item = {
            id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
            name: file.name,
            category,
            size: file.size,
            date: new Date().toISOString()
          };

          store[key].push(item);

          const line = `${category}: ${file.name}`;

          const docsArea =
            Array.from(modal.querySelectorAll("textarea")).find((textarea) => {
              const previous = textarea.previousElementSibling;
              return clean(previous?.textContent).toLowerCase().includes("document");
            }) ||
            Array.from(modal.querySelectorAll("textarea")).at(-1);

          if (docsArea) {
            docsArea.value = clean(docsArea.value)
              ? `${docsArea.value}\n${line}`
              : line;

            docsArea.dispatchEvent(new Event("input", { bubbles: true }));
          }

          if (list) {
            const div = document.createElement("div");
            div.className = "viva-docs-item";
            div.textContent = `${category} • ${file.name}`;
            list.appendChild(div);
          }
        }

        setDocsStore(store);
        toastSafe(`${files.length} arquivo(s) registrado(s).`);
        input.value = "";
      });
    });
  }

  function installInternalLogin() {
    if (sessionStorage.getItem(AUTH_KEY) === "ok") return;

    fetch("/api/cerebro/auth", {
      credentials: "same-origin",
      cache: "no-store"
    })
      .then((response) => response.json())
      .then((config) => {
        if (config && config.enabled === false) return;

        const lock = document.createElement("div");
        lock.className = "viva-cerebro-lock";

        lock.innerHTML = `
          <form class="viva-cerebro-login">
            <span class="viva-cerebro-login-badge">Acesso restrito</span>
            <h1>Cérebro IA</h1>
            <p>Área privada de escrita, estratégia e criação de projetos culturais da Cia de Artes VIVA.</p>

            <div class="viva-cerebro-field">
              <label>E-mail autorizado</label>
              <input name="email" type="email" placeholder="seu@email.com" autocomplete="email" required />
            </div>

            <div class="viva-cerebro-field">
              <label>Senha do Cérebro</label>
              <input name="password" type="password" placeholder="Digite a senha" autocomplete="current-password" required />
            </div>

            <div class="viva-cerebro-error"></div>

            <div class="viva-cerebro-actions">
              <button type="submit" class="viva-cerebro-btn primary">Entrar</button>
              <button type="button" class="viva-cerebro-btn light" data-close>Voltar</button>
            </div>
          </form>
        `;

        document.body.appendChild(lock);

        const form = lock.querySelector("form");
        const errorBox = lock.querySelector(".viva-cerebro-error");
        const closeButton = lock.querySelector("[data-close]");

        closeButton.addEventListener("click", function () {
          window.parent?.postMessage({ type: "CEREBRO_CLOSE_REQUEST" }, "*");
        });

        form.addEventListener("submit", async function (event) {
          event.preventDefault();

          errorBox.style.display = "none";
          errorBox.textContent = "";

          const fd = new FormData(form);

          try {
            const response = await fetch("/api/cerebro/auth", {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                email: fd.get("email"),
                password: fd.get("password")
              })
            });

            const data = await response.json().catch(() => ({}));

            if (!data.ok) {
              errorBox.textContent = data.message || "Acesso negado.";
              errorBox.style.display = "block";
              return;
            }

            sessionStorage.setItem(AUTH_KEY, "ok");
            lock.remove();
            toastSafe("Acesso liberado ao Cérebro IA.");
          } catch {
            errorBox.textContent = "Não consegui validar o acesso agora.";
            errorBox.style.display = "block";
          }
        });
      })
      .catch(() => {});
  }

  function boot() {
    injectStyle();
    installInternalLogin();
    patchSaveTeam();
    patchChatIa();
    loadVivaTeam();
    setInterval(enhanceTeamModal, 900);
  }

  window.vivaSyncTeamNow = loadVivaTeam;
  window.vivaSyncMemberToViva = syncMemberToViva;

  setTimeout(boot, 600);
  setTimeout(boot, 1800);
})();
