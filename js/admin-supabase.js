
(function () {
  const $ = (selector) => document.querySelector(selector);

  function setText(selector, text) {
    const el = $(selector);
    if (el) el.textContent = text || "";
  }

  function slugify(value) {
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function sha256(message) {
    if (!message) return null;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function getSupabaseClient() {
    const url = window.IBAI_SUPABASE_URL;
    const key = window.IBAI_SUPABASE_ANON_KEY;

    if (!url || !key || url.includes("PASTE_") || key.includes("PASTE_")) {
      setText("#clients-sync-status", "Supabase is not configured yet. Open js/supabase-config.js and paste your Project URL and publishable key.");
      return null;
    }

    if (!window.supabase || !window.supabase.createClient) {
      setText("#clients-sync-status", "Supabase library could not be loaded.");
      return null;
    }

    return window.supabase.createClient(url, key);
  }

  function renderClients(clients) {
    const list = $("#clients-list-render");
    if (!list) return;

    if (!clients || !clients.length) {
      list.innerHTML = `
        <div class="list-row">
          <div>
            <div class="row-title">No clients yet</div>
            <div class="row-meta">Create your first client from the Create client tab.</div>
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = clients.map((client) => {
      const type = (client.client_type || "client").replace("_", " ");
      const context = client.club || client.league || client.country || client.agency_type || client.personal_relation || "Private client";
      const status = client.publish_status || "draft";
      const img = client.profile_image_url || "img/IMG_IBAI.jpg";

      return `
        <div class="list-row" data-client-id="${client.id}">
          <img class="avatar" src="${img}" alt="">
          <div>
            <div class="row-title">${client.name || "Unnamed client"}</div>
            <div class="row-meta">${type} · ${context} · ${client.username || ""} · ${status}</div>
          </div>
          <div class="row-actions">
            <button class="btn" data-open="edit-client"><span data-en>Edit client</span><span data-es>Editar cliente</span></button>
            <button class="btn"><span data-en>Change password</span><span data-es>Cambiar contraseña</span></button>
            <button class="btn"><span data-en>Duplicate</span><span data-es>Duplicar</span></button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el = document.getElementById(btn.dataset.open);
        if (el) {
          el.style.display = el.style.display === "none" || !el.style.display ? "block" : "none";
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  async function loadClients() {
    const client = getSupabaseClient();
    if (!client) return;

    setText("#clients-sync-status", "Loading clients from Supabase...");

    const { data, error } = await client
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setText("#clients-sync-status", "Could not load clients: " + error.message);
      return;
    }

    setText("#clients-sync-status", `${data.length} client(s) loaded from Supabase.`);
    renderClients(data);
  }

  async function createClient() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const name = $("#client-name")?.value.trim();
    const type = $("#client-type")?.value || "player";
    const context = $("#client-context")?.value.trim();
    const usernameInput = $("#client-username")?.value.trim();
    const password = $("#client-password")?.value;
    const language = $("#client-language")?.value || "es";

    if (!name) {
      setText("#client-create-status", "Add a client name first.");
      return;
    }

    const username = usernameInput || slugify(name);
    const password_hash = await sha256(password);

    const payload = {
      username,
      password_hash,
      name,
      client_type: type,
      language_preference: language,
      welcome_title_es: $("#client-welcome-title-es")?.value.trim() || null,
      welcome_title_en: $("#client-welcome-title-en")?.value.trim() || null,
      welcome_message_es: $("#client-welcome-message-es")?.value.trim() || null,
      welcome_message_en: $("#client-welcome-message-en")?.value.trim() || null,
      publish_status: "draft",
      active: true
    };

    if (type === "player") payload.club = context || null;
    if (type === "club") payload.league = context || null;
    if (type === "agency") payload.agency_type = context || null;
    if (type === "personal") payload.personal_relation = context || null;

    setText("#client-create-status", "Saving client in Supabase...");

    const { error } = await supabase.from("clients").insert(payload);

    if (error) {
      setText("#client-create-status", "Could not create client: " + error.message);
      return;
    }

    setText("#client-create-status", `Client created: ${name} (${username})`);
    ["#client-name", "#client-context", "#client-username", "#client-password", "#client-welcome-title-es", "#client-welcome-title-en", "#client-welcome-message-es", "#client-welcome-message-en"].forEach((selector) => {
      const el = $(selector);
      if (el) el.value = "";
    });

    await loadClients();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const createBtn = $("#create-client-submit");
    if (createBtn) createBtn.addEventListener("click", createClient);
    loadClients();
  });
})();
