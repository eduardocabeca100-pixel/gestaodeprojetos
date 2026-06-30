(function () {
  const params = new URLSearchParams(window.location.search);
  const vivaMode = params.get("viva") === "1";
  const projectId = params.get("project") || params.get("projectId") || "";

  if (!vivaMode) return;

  function clean(value) {
    return String(value || "").trim();
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
    if (document.getElementById("viva-cerebro-force-login-style")) return;

    const style = document.createElement("style");
    style.id = "viva-cerebro-force-login-style";

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

      .viva-cerebro-lock {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top left, rgba(124,58,237,.24), transparent 35%),
          radial-gradient(circle at top right, rgba(219,39,119,.20), transparent 34%),
          rgba(15,23,42,.72);
        backdrop-filter: blur(18px);
      }

      .viva-cerebro-login {
        width: min(520px, 100%);
        border-radius: 32px;
        border: 1px solid rgba(255,255,255,.72);
        background: rgba(255,255,255,.97);
        box-shadow: 0 30px 100px rgba(15,23,42,.35);
        padding: 28px;
      }

      .viva-cerebro-login-badge {
        display: inline-flex;
        align-items: center;
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

      .viva-cerebro-session-bar {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 99999;
        display: flex;
        gap: 8px;
        align-items: center;
        border-radius: 999px;
        background: rgba(15,23,42,.92);
        color: white;
        padding: 8px 10px 8px 14px;
        font-size: 12px;
        font-weight: 900;
        box-shadow: 0 18px 40px rgba(15,23,42,.22);
      }

      .viva-cerebro-session-bar button {
        border: 0;
        border-radius: 999px;
        background: white;
        color: #111827;
        font-weight: 900;
        padding: 6px 10px;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);
  }

  async function logoutCerebro() {
    await fetch("/api/cerebro/auth", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => {});

    window.location.reload();
  }

  function showSessionBar(user) {
    if (document.querySelector(".viva-cerebro-session-bar")) return;

    const bar = document.createElement("div");
    bar.className = "viva-cerebro-session-bar";

    bar.innerHTML = `
      <span>Cérebro: ${user?.email || "acesso liberado"}</span>
      <button type="button">Sair</button>
    `;

    bar.querySelector("button").addEventListener("click", logoutCerebro);

    document.body.appendChild(bar);
  }

  function showLogin() {
    if (document.querySelector(".viva-cerebro-lock")) return;

    const lock = document.createElement("div");
    lock.className = "viva-cerebro-lock";

    lock.innerHTML = `
      <form class="viva-cerebro-login">
        <span class="viva-cerebro-login-badge">Autorização obrigatória</span>
        <h1>Cérebro IA</h1>
        <p>Esta área é privada. O login do VIVA não libera o Cérebro. Entre com um e-mail e senha cadastrados no Cérebro IA.</p>

        <div class="viva-cerebro-field">
          <label>E-mail cadastrado no Cérebro</label>
          <input name="email" type="email" placeholder="email@exemplo.com" autocomplete="email" required />
        </div>

        <div class="viva-cerebro-field">
          <label>Senha do Cérebro</label>
          <input name="password" type="password" placeholder="Digite a senha do Cérebro" autocomplete="current-password" required />
        </div>

        <div class="viva-cerebro-error"></div>

        <div class="viva-cerebro-actions">
          <button type="submit" class="viva-cerebro-btn primary">Entrar no Cérebro</button>
          <button type="button" class="viva-cerebro-btn light" data-reload>Atualizar</button>
        </div>
      </form>
    `;

    document.body.appendChild(lock);

    const form = lock.querySelector("form");
    const errorBox = lock.querySelector(".viva-cerebro-error");
    const reloadButton = lock.querySelector("[data-reload]");

    reloadButton.addEventListener("click", function () {
      window.location.reload();
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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: fd.get("email"),
            password: fd.get("password"),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!data.ok) {
          errorBox.textContent = data.message || "Acesso negado.";
          errorBox.style.display = "block";
          return;
        }

        lock.remove();
        showSessionBar(data.user || { email: fd.get("email") });
        toastSafe(data.message || "Acesso liberado ao Cérebro IA.");
      } catch {
        errorBox.textContent = "Não consegui validar o acesso agora.";
        errorBox.style.display = "block";
      }
    });
  }

  async function requireLogin() {
    try {
      const response = await fetch("/api/cerebro/auth", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (data.enabled === false) return;

      if (data.authenticated) {
        showSessionBar(data.user);
        return;
      }

      showLogin();
    } catch {
      showLogin();
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
      city: clean(member.city || member.cityState) || "Jaraguá do Sul/SC",
      address: clean(member.address),
      phone: clean(member.phone),
      email: clean(member.email),
      fee: Number(member.fee || member.expectedAmount || 0),
      resumeShort: clean(member.resumeShort || member.resume || member.notes),
      resume: clean(member.resume || member.resumeShort || member.notes),
      portfolioText: clean(member.portfolioText || member.portfolio),
      docsText: clean(member.docsText || member.docs),
      linksText: clean(member.linksText || member.links),
      editalFunction: clean(member.editalFunction || member.role || member.area),
      observations: clean(member.observations || member.notes),
      source: "viva",
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
          source: existing.source || "viva",
        });
      }
    }

    currentState.team = Array.from(map.values());
    saveSafe();

    return added;
  }

  async function loadVivaTeam() {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/cerebro/equipe?projectId=${encodeURIComponent(projectId)}`, {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) return;

      mergeTeam(data.team || []);
      renderSafe();
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
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              task: "chat do Cérebro IA",
              message,
              project: currentState?.projects?.[0] || null,
              team: currentState?.team || [],
            }),
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
              "Não consegui conectar com a IA.",
            );
          }
        }
      };

      patchedSendChat.__vivaPatched = true;
      sendChat = patchedSendChat;
    } catch {}
  }

  function boot() {
    injectStyle();
    requireLogin();
    loadVivaTeam();
    patchChatIa();
  }

  setTimeout(boot, 400);
  setTimeout(boot, 1500);
})();
