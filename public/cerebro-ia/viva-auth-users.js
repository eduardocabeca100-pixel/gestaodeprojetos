(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get("viva") !== "1") return;

  const panelId = "viva-cerebro-real-users-panel";

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

  function isUsersPage() {
    const text = document.body.textContent || "";
    return text.includes("Usuários") && text.includes("Administração de acessos");
  }

  async function fetchUsers() {
    const response = await fetch("/api/cerebro/users", {
      credentials: "same-origin",
      cache: "no-store",
    });

    return response.json();
  }

  async function saveUser(form) {
    const fd = new FormData(form);

    const response = await fetch("/api/cerebro/users", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        role: fd.get("role"),
      }),
    });

    return response.json();
  }

  async function patchUser(id, patch) {
    const response = await fetch("/api/cerebro/users", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, ...patch }),
    });

    return response.json();
  }

  function userRoleLabel(role) {
    if (role === "admin") return "Administrador";
    if (role === "viewer") return "Visualizador";
    return "Editor";
  }

  async function renderList(panel) {
    const list = panel.querySelector("[data-users-list]");
    list.innerHTML = "<div class='viva-real-user-empty'>Carregando usuários autorizados...</div>";

    const data = await fetchUsers();

    if (!data.ok) {
      list.innerHTML = `<div class='viva-real-user-error'>${data.message || "Não consegui listar usuários."}</div>`;
      return;
    }

    if (!data.users || data.users.length === 0) {
      list.innerHTML = "<div class='viva-real-user-empty'>Nenhum usuário cadastrado ainda. O administrador inicial vem das variáveis da Vercel.</div>";
      return;
    }

    list.innerHTML = data.users
      .map(
        (user) => `
          <div class="viva-real-user-row">
            <div>
              <strong>${user.name || user.email}</strong>
              <span>${user.email} • ${userRoleLabel(user.role)}</span>
            </div>

            <div class="viva-real-user-actions">
              <span class="${user.is_active ? "viva-status-ok" : "viva-status-off"}">
                ${user.is_active ? "ativo" : "bloqueado"}
              </span>

              <button type="button" data-user-toggle="${user.id}" data-active="${user.is_active ? "0" : "1"}">
                ${user.is_active ? "Bloquear" : "Liberar"}
              </button>

              <button type="button" data-user-reset="${user.id}">
                Nova senha
              </button>
            </div>
          </div>
        `,
      )
      .join("");
  }

  function injectStyles() {
    if (document.getElementById("viva-real-users-style")) return;

    const style = document.createElement("style");
    style.id = "viva-real-users-style";
    style.innerHTML = `
      .viva-real-users {
        margin-bottom: 18px;
        border-radius: 24px;
        border: 1px solid #e2e8f0;
        background: linear-gradient(135deg, #ffffff, #f8f5ff);
        box-shadow: 0 18px 50px rgba(15,23,42,.08);
        padding: 18px;
      }

      .viva-real-users-head {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        align-items: flex-start;
        margin-bottom: 14px;
      }

      .viva-real-users h2 {
        margin: 0;
        font-size: 21px;
        color: #111827;
      }

      .viva-real-users p {
        margin: 4px 0 0;
        color: #667085;
      }

      .viva-real-users-form {
        display: grid;
        grid-template-columns: 1fr 1fr 160px 1fr auto;
        gap: 10px;
        margin: 14px 0;
      }

      .viva-real-users-form input,
      .viva-real-users-form select {
        height: 44px;
        border-radius: 14px;
        border: 1px solid #d7deea;
        background: white;
        padding: 0 12px;
        color: #111827;
        outline: none;
      }

      .viva-real-users-form button,
      .viva-real-user-actions button {
        border: 0;
        border-radius: 999px;
        height: 38px;
        padding: 0 14px;
        font-weight: 900;
        cursor: pointer;
      }

      .viva-real-users-form button {
        color: white;
        background: linear-gradient(90deg,#7c3aed,#db2777);
      }

      .viva-real-user-list {
        display: grid;
        gap: 8px;
      }

      .viva-real-user-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        background: white;
        padding: 12px;
      }

      .viva-real-user-row strong {
        display: block;
        color: #111827;
      }

      .viva-real-user-row span {
        display: block;
        margin-top: 2px;
        color: #667085;
        font-size: 12px;
      }

      .viva-real-user-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .viva-status-ok,
      .viva-status-off {
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 11px !important;
        font-weight: 900;
      }

      .viva-status-ok {
        color: #166534 !important;
        background: #dcfce7;
      }

      .viva-status-off {
        color: #991b1b !important;
        background: #fee2e2;
      }

      .viva-real-user-empty,
      .viva-real-user-error {
        border-radius: 16px;
        padding: 12px;
        font-weight: 800;
      }

      .viva-real-user-empty {
        background: #f8fafc;
        color: #64748b;
      }

      .viva-real-user-error {
        background: #fff1f2;
        color: #991b1b;
      }

      @media (max-width: 980px) {
        .viva-real-users-form {
          grid-template-columns: 1fr;
        }

        .viva-real-user-row {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function installUsersPanel() {
    if (!isUsersPage()) return;
    if (document.getElementById(panelId)) return;

    injectStyles();

    const app =
      document.getElementById("app") ||
      document.querySelector(".content") ||
      document.querySelector("main") ||
      document.body;

    const panel = document.createElement("section");
    panel.id = panelId;
    panel.className = "viva-real-users";

    panel.innerHTML = `
      <div class="viva-real-users-head">
        <div>
          <h2>Usuários autorizados do Cérebro IA</h2>
          <p>Esta é a lista real que libera acesso ao Cérebro. Não usa a senha do VIVA.</p>
        </div>
      </div>

      <form class="viva-real-users-form">
        <input name="name" placeholder="Nome" />
        <input name="email" type="email" placeholder="E-mail autorizado" required />
        <select name="role">
          <option value="editor">Editor</option>
          <option value="admin">Administrador</option>
          <option value="viewer">Visualizador</option>
        </select>
        <input name="password" type="password" placeholder="Senha do Cérebro" required />
        <button type="submit">Cadastrar</button>
      </form>

      <div class="viva-real-user-list" data-users-list></div>
    `;

    app.prepend(panel);

    const form = panel.querySelector("form");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const data = await saveUser(form);

      toastSafe(data.message || (data.ok ? "Usuário salvo." : "Não consegui salvar usuário."));

      if (data.ok) {
        form.reset();
        await renderList(panel);
      }
    });

    panel.addEventListener("click", async function (event) {
      const target = event.target;

      if (!(target instanceof HTMLElement)) return;

      const toggleId = target.getAttribute("data-user-toggle");
      const resetId = target.getAttribute("data-user-reset");

      if (toggleId) {
        const active = target.getAttribute("data-active") === "1";
        const data = await patchUser(toggleId, { is_active: active });
        toastSafe(data.message || "Usuário atualizado.");
        await renderList(panel);
      }

      if (resetId) {
        const password = window.prompt("Digite a nova senha do Cérebro para este usuário:");

        if (!password) return;

        const data = await patchUser(resetId, { password });
        toastSafe(data.message || "Senha atualizada.");
        await renderList(panel);
      }
    });

    renderList(panel);
  }

  setInterval(installUsersPanel, 900);
})();
