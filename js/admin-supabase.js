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

  function getSupabaseClient(statusSelector = "#clients-sync-status") {
    const url = window.IBAI_SUPABASE_URL;
    const key = window.IBAI_SUPABASE_ANON_KEY;

    if (!url || !key || url.includes("PASTE_") || key.includes("PASTE_")) {
      setText(statusSelector, "Supabase is not configured yet. Open js/supabase-config.js and paste your Project URL and publishable key.");
      return null;
    }

    if (!window.supabase || !window.supabase.createClient) {
      setText(statusSelector, "Supabase library could not be loaded.");
      return null;
    }

    return window.supabase.createClient(url, key);
  }

  const STORAGE_BUCKET = "portfolio-images";

  function fileExtension(file) {
    const name = file?.name || "image.jpg";
    const ext = name.split(".").pop()?.toLowerCase() || "jpg";
    return ext.replace(/[^a-z0-9]/g, "") || "jpg";
  }

  async function uploadImage(supabase, file, folder, statusSelector) {
    if (!file) return null;
    const safeFolder = slugify(folder || "uploads") || "uploads";
    const ext = fileExtension(file);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const path = `${safeFolder}/${filename}`;

    setText(statusSelector, `Uploading ${file.name}...`);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    setText(statusSelector, `Uploaded: ${file.name}`);
    return data.publicUrl;
  }

  function setupImagePreviewInputs() {
    document.querySelectorAll('input[type="file"][data-preview]').forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        const preview = document.getElementById(input.dataset.preview);
        const status = document.getElementById(`${input.id}-status`);
        if (!file) {
          if (status) status.textContent = "No image selected yet.";
          return;
        }
        if (!file.type.startsWith("image/")) {
          if (status) status.textContent = "Please select an image file.";
          input.value = "";
          return;
        }
        const objectUrl = URL.createObjectURL(file);
        if (preview) preview.style.setProperty("--crop-img", `url('${objectUrl}')`);
        if (status) status.textContent = `Selected: ${file.name}`;
      });
    });
  }

  function openPanel(id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = el.style.display === "none" || !el.style.display ? "block" : "none";
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function galleryStatusMarkup(status) {
    const normalized = status || "created";
    const color = normalized === "ready" ? "green" : normalized === "in_progress" ? "yellow" : "red";
    const en = normalized === "ready" ? "Ready" : normalized === "in_progress" ? "In progress" : "Created";
    const es = normalized === "ready" ? "Lista" : normalized === "in_progress" ? "En proceso" : "Creada";
    return `<span class="pill"><span class="dot ${color}"></span><span data-en>${en}</span><span data-es>${es}</span></span>`;
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
        <div class="list-row" data-client-id="${client.id}" data-client-username="${client.username || ""}">
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
      btn.addEventListener("click", () => openPanel(btn.dataset.open));
    });
  }


  function renderGalleryClientPicker(clients) {
    const picker = $("#gallery-client-picker");
    if (!picker) return;

    if (!clients || !clients.length) {
      picker.innerHTML = `<div class="row-meta">No registered clients yet. Create a client first.</div>`;
      return;
    }

    picker.innerHTML = clients.map((client) => {
      const type = client.client_type || "client";
      const context = client.club || client.league || client.country || client.agency_type || client.personal_relation || client.username || "Private client";
      return `
        <label class="selector-card">
          <input type="checkbox" name="gallery-client" value="${client.id}" data-client-name="${client.name || client.username}">
          <div>
            <strong>${client.name || client.username}</strong>
            <span>${type} · ${context}</span>
          </div>
        </label>
      `;
    }).join("");
  }

  async function loadClients() {
    const client = getSupabaseClient("#clients-sync-status");
    if (!client) return [];

    setText("#clients-sync-status", "Loading clients from Supabase...");

    const { data, error } = await client
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setText("#clients-sync-status", "Could not load clients: " + error.message);
      return [];
    }

    setText("#clients-sync-status", `${data.length} client(s) loaded from Supabase.`);
    renderClients(data);
    window.IBAI_CLIENTS_CACHE = data || [];
    renderGalleryClientPicker(data || []);
    return data || [];
  }

  async function createClient() {
    const supabase = getSupabaseClient("#client-create-status");
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

    let profileImageUrl = null;
    let heroImageUrl = null;

    try {
      profileImageUrl = await uploadImage(supabase, $("#client-profile-file")?.files?.[0], `clients/${username}/profile`, "#client-profile-file-status");
      heroImageUrl = await uploadImage(supabase, $("#client-hero-file")?.files?.[0], `clients/${username}/hero`, "#client-hero-file-status");
    } catch (uploadError) {
      setText("#client-create-status", "Image upload failed: " + uploadError.message);
      return;
    }

    const payload = {
      username,
      password_hash,
      name,
      client_type: type,
      language_preference: language,
      profile_image_url: profileImageUrl,
      hero_image_url: heroImageUrl,
      hero_position_x: Number($("#client-hero-x")?.value || 50),
      hero_position_y: Number($("#client-hero-y")?.value || 50),
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
    ["#client-name", "#client-context", "#client-username", "#client-password", "#client-welcome-title-es", "#client-welcome-title-en", "#client-welcome-message-es", "#client-welcome-message-en", "#client-profile-file", "#client-hero-file"].forEach((selector) => {
      const el = $(selector);
      if (el) el.value = "";
    });
    setText("#client-profile-file-status", "No profile image selected yet.");
    setText("#client-hero-file-status", "No hero image selected yet.");

    await loadClients();
  }

  function renderGalleries(galleries) {
    const list = $("#galleries-list-render");
    if (!list) return;

    if (!galleries || !galleries.length) {
      list.innerHTML = `
        <div class="list-row">
          <div>
            <div class="row-title">No galleries yet</div>
            <div class="row-meta">Create your first gallery from the Create gallery tab.</div>
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = galleries.map((gallery) => {
      const cover = gallery.cover_image_url || "img/work_A.jpg";
      const assigned = (gallery.gallery_clients || [])
        .map((row) => row.clients?.name || row.clients?.username)
        .filter(Boolean)
        .join(", ") || "No clients assigned";
      const date = gallery.event_date || "No date";
      const place = gallery.location || gallery.city || "No location";

      return `
        <div class="list-row" data-gallery-id="${gallery.id}">
          <img class="thumb" src="${cover}" alt="">
          <div>
            <div class="row-title">${gallery.title_es || gallery.title_en || "Untitled gallery"}</div>
            <div class="row-meta">${galleryStatusMarkup(gallery.status)} · ${assigned} · ${date} · ${place}</div>
          </div>
          <div class="row-actions">
            <button class="btn" data-open="edit-gallery"><span data-en>Edit gallery</span><span data-es>Editar galería</span></button>
            <button class="btn" data-open="upload-gallery"><span data-en>Upload photos</span><span data-es>Subir fotos</span></button>
            <button class="btn"><span data-en>Preview</span><span data-es>Previsualizar</span></button>
            <button class="btn"><span data-en>Duplicate</span><span data-es>Duplicar</span></button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => openPanel(btn.dataset.open));
    });
  }

  async function loadGalleries() {
    const supabase = getSupabaseClient("#galleries-sync-status");
    if (!supabase) return [];

    setText("#galleries-sync-status", "Loading galleries from Supabase...");

    const { data, error } = await supabase
      .from("galleries")
      .select("*, gallery_clients(clients(id, username, name))")
      .order("created_at", { ascending: false });

    if (error) {
      setText("#galleries-sync-status", "Could not load galleries: " + error.message);
      return [];
    }

    setText("#galleries-sync-status", `${data.length} gallery/galleries loaded from Supabase.`);
    renderGalleries(data || []);
    return data || [];
  }

  async function createGallery() {
    const supabase = getSupabaseClient("#gallery-create-status");
    if (!supabase) return;

    const titleEs = $("#gallery-title-es")?.value.trim();
    const titleEn = $("#gallery-title-en")?.value.trim();
    const selectedClientIds = Array.from(document.querySelectorAll('input[name="gallery-client"]:checked')).map((input) => input.value);

    if (!titleEs && !titleEn) {
      setText("#gallery-create-status", "Add a gallery title first.");
      return;
    }

    if (!selectedClientIds.length) {
      setText("#gallery-create-status", "Select at least one registered client first.");
      return;
    }

    setText("#gallery-create-status", "Checking assigned clients...");

    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, username, name")
      .in("id", selectedClientIds);

    if (clientsError) {
      setText("#gallery-create-status", "Could not check clients: " + clientsError.message);
      return;
    }

    if (!clients || clients.length !== selectedClientIds.length) {
      setText("#gallery-create-status", "One or more selected clients could not be found. Reload and try again.");
      return;
    }

    const location = $("#gallery-location")?.value.trim() || null;
    const city = location && location.includes(",") ? location.split(",").slice(1).join(",").trim() : null;
    const publishButton = $("#gallery-publish");
    const publishStatus = publishButton?.classList.contains("active") ? "published" : "draft";

    let coverImageUrl = null;
    try {
      coverImageUrl = await uploadImage(supabase, $("#gallery-cover-file")?.files?.[0], `galleries/${slugify(titleEs || titleEn)}/cover`, "#gallery-cover-file-status");
    } catch (uploadError) {
      setText("#gallery-create-status", "Cover upload failed: " + uploadError.message);
      return;
    }

    const payload = {
      title_es: titleEs || titleEn,
      title_en: titleEn || titleEs,
      event_date: $("#gallery-event-date")?.value || null,
      location,
      city,
      cover_image_url: coverImageUrl || "img/work_A.jpg",
      cover_position_x: Number($("#gallery-cover-x")?.value || 50),
      cover_position_y: Number($("#gallery-cover-y")?.value || 50),
      status: $("#gallery-status")?.value || "created",
      publish_status: publishStatus,
      personal_note_es: $("#gallery-note-es")?.value.trim() || null,
      personal_note_en: $("#gallery-note-en")?.value.trim() || null,
      allow_downloads: true,
      allow_favourites: true,
      allow_retouch_requests: true
    };

    setText("#gallery-create-status", "Creating gallery in Supabase...");

    const { data: gallery, error: galleryError } = await supabase
      .from("galleries")
      .insert(payload)
      .select("id")
      .single();

    if (galleryError) {
      setText("#gallery-create-status", "Could not create gallery: " + galleryError.message);
      return;
    }

    const links = clients.map((client) => ({ gallery_id: gallery.id, client_id: client.id }));
    const { error: linkError } = await supabase.from("gallery_clients").insert(links);

    if (linkError) {
      setText("#gallery-create-status", "Gallery created, but client assignment failed: " + linkError.message);
      await loadGalleries();
      return;
    }

    setText("#gallery-create-status", `Gallery created and assigned to ${clients.length} client(s).`);
    ["#gallery-title-es", "#gallery-title-en", "#gallery-event-date", "#gallery-location", "#gallery-note-es", "#gallery-note-en", "#gallery-cover-file"].forEach((selector) => {
      const el = $(selector);
      if (el) el.value = "";
    });
    setText("#gallery-cover-file-status", "No gallery cover selected yet.");
    document.querySelectorAll('input[name="gallery-client"]:checked').forEach((input) => { input.checked = false; });

    await loadGalleries();
  }


  function currentAdminSession() {
    try { return JSON.parse(localStorage.getItem("ibaiAdminSession") || "null"); }
    catch { return null; }
  }

  function requireAdminSession() {
    const session = currentAdminSession();
    if (!session && location.pathname.endsWith("admin-panel.html")) {
      location.href = "admin-login.html";
      return null;
    }
    if (session) setText("#admin-session-status", `Admin: ${session.name || session.username}`);
    return session;
  }

  function renderAdmins(admins) {
    const list = $("#admins-list-render");
    if (!list) return;

    if (!admins || !admins.length) {
      list.innerHTML = `<div class="list-row"><div><div class="row-title">No administrators yet</div><div class="row-meta">Create the first administrator from the Create admin tab.</div></div></div>`;
      return;
    }

    list.innerHTML = admins.map((admin) => `
      <div class="list-row" data-admin-id="${admin.id}">
        <img class="avatar" src="img/IMG_IBAI.jpg" alt="">
        <div>
          <div class="row-title">${admin.name || admin.username}</div>
          <div class="row-meta">${admin.username} · ${admin.role || "editor"} · ${admin.active ? "active" : "inactive"}</div>
        </div>
        <div class="row-actions">
          <button class="btn"><span data-en>Change password</span><span data-es>Cambiar contraseña</span></button>
          <button class="btn"><span data-en>Deactivate</span><span data-es>Desactivar</span></button>
        </div>
      </div>
    `).join("");
  }

  async function loadAdmins() {
    const supabase = getSupabaseClient("#admins-sync-status");
    if (!supabase) return [];
    setText("#admins-sync-status", "Loading administrators from Supabase...");
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, username, name, role, active, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setText("#admins-sync-status", "Could not load administrators: " + error.message);
      return [];
    }
    setText("#admins-sync-status", `${data.length} administrator(s) loaded from Supabase.`);
    renderAdmins(data || []);
    return data || [];
  }

  async function createAdmin() {
    const supabase = getSupabaseClient("#admin-create-status");
    if (!supabase) return;
    const name = $("#admin-name")?.value.trim();
    const username = slugify($("#admin-username")?.value.trim() || name);
    const password = $("#admin-password")?.value;
    const role = $("#admin-role")?.value || "editor";
    if (!name || !username || !password) {
      setText("#admin-create-status", "Add admin name, username and password first.");
      return;
    }
    const password_hash = await sha256(password);
    setText("#admin-create-status", "Creating administrator in Supabase...");
    const { error } = await supabase.from("admin_users").insert({ username, password_hash, name, role, active: true });
    if (error) {
      setText("#admin-create-status", "Could not create administrator: " + error.message);
      return;
    }
    setText("#admin-create-status", `Administrator created: ${name} (${username})`);
    ["#admin-name", "#admin-username", "#admin-password"].forEach((selector) => { const el = $(selector); if (el) el.value = ""; });
    await loadAdmins();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const session = requireAdminSession();
    if (!session && location.pathname.endsWith("admin-panel.html")) return;

    const logoutBtn = $("#admin-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", () => { localStorage.removeItem("ibaiAdminSession"); location.href = "admin-login.html"; });

    const createClientBtn = $("#create-client-submit");
    if (createClientBtn) createClientBtn.addEventListener("click", createClient);

    const createGalleryBtn = $("#create-gallery-submit");
    if (createGalleryBtn) createGalleryBtn.addEventListener("click", createGallery);

    const createAdminBtn = $("#create-admin-submit");
    if (createAdminBtn) createAdminBtn.addEventListener("click", createAdmin);

    setupImagePreviewInputs();

    loadClients();
    loadGalleries();
    loadAdmins();
  });
})();
