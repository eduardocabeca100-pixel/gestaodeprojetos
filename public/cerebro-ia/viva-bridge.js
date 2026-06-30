(function () {
  const params = new URLSearchParams(window.location.search);
  const vivaMode = params.get("viva") === "1";
  const projectId = params.get("project") || params.get("projectId") || "";

  if (!vivaMode) return;

  const style = document.createElement("style");
  style.innerHTML = `
    .account,
    .account-card,
    .userbox,
    .logout,
    button.logout,
    [data-action="logout"],
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
  `;
  document.head.appendChild(style);

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

  function clean(value) {
    return String(value || "").trim();
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
    for (const member of currentState.team) map.set(keyOf(member), member);

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
      toastSafe(added > 0 ? `Equipe do VIVA sincronizada: ${added} integrante(s) adicionados.` : "Equipe do VIVA sincronizada.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, member })
      });
      const data = await response.json().catch(() => ({}));
      toastSafe(data.message || (data.ok ? "Integrante sincronizado com o VIVA." : "Integrante salvo no Cérebro; sincronização com VIVA pendente."));
    } catch (error) {
      console.error(error);
      toastSafe("Integrante salvo no Cérebro; sincronização com VIVA pendente.");
    }
  }

  function patchTeamSave() {
    try {
      if (typeof saveTeam !== "function" || saveTeam.__vivaPatched) return;
      const original = saveTeam;
      const patched = function (id) {
        const result = original.apply(this, arguments);
        setTimeout(function () {
          const currentState = getState();
          if (!currentState || !Array.isArray(currentState.team)) return;
          const member = currentState.team.find((item) => item.id === id) || currentState.team[currentState.team.length - 1];
          if (member) syncMemberToViva(member);
        }, 250);
        return result;
      };
      patched.__vivaPatched = true;
      saveTeam = patched;
    } catch {}
  }

  function patchChatIa() {
    try {
      if (typeof sendChat !== "function" || sendChat.__vivaPatched) return;
      const patched = async function () {
        const input = document.getElementById("chatInput");
        const chatBox = document.getElementById("chatBox");
        const message = input ? clean(input.value) : "";
        if (!message) return;
        if (chatBox) chatBox.innerHTML += `<br><br><b>Você:</b> ${message}<br><b>IA:</b> Gerando resposta...`;
        if (input) input.value = "";
        try {
          const currentState = getState();
          const response = await fetch("/api/ia", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
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
            chatBox.innerHTML = chatBox.innerHTML.replace("Gerando resposta...", "Não consegui conectar com a IA. Confira GROQ_API_KEY e GROQ_MODEL na Vercel.");
          }
        }
      };
      patched.__vivaPatched = true;
      sendChat = patched;
    } catch {}
  }

  function boot() {
    patchTeamSave();
    patchChatIa();
    loadVivaTeam();
  }

  window.vivaSyncTeamNow = loadVivaTeam;
  window.vivaSyncMemberToViva = syncMemberToViva;
  setTimeout(boot, 700);
  setTimeout(boot, 1800);
})();

