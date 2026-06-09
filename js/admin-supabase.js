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
    return "webp";
  }

  async function compressImageForWeb(file, maxBytes = 2 * 1024 * 1024) {
    if (!file || !file.type?.startsWith("image/")) return file;
    const img = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = reject;
      image.src = url;
    });
    const shortEdgeTarget = 3000;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const shortEdge = Math.min(w, h);
    const scale = shortEdge > shortEdgeTarget ? shortEdgeTarget / shortEdge : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    async function toBlob(q) {
      return await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", q));
    }
    let quality = 0.86;
    let blob = await toBlob(quality);
    while (blob && blob.size > maxBytes && quality > 0.46) {
      quality -= 0.08;
      blob = await toBlob(quality);
    }
    if (!blob) return file;
    const base = (file.name || "photo").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.webp`, { type: "image/webp", lastModified: Date.now() });
  }

  async function uploadImage(supabase, file, folder, statusSelector) {
    if (!file) return null;
    const safeFolder = slugify(folder || "uploads") || "uploads";
    setText(statusSelector, `Optimising ${file.name}...`);
    const uploadFile = await compressImageForWeb(file);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.webp`;
    const path = `${safeFolder}/${filename}`;

    setText(statusSelector, `Uploading optimised file...`);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, uploadFile, { cacheControl: "3600", upsert: true, contentType: uploadFile.type || "image/webp" });

    if (error) throw error;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    setText(statusSelector, `Uploaded optimised WebP · ${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`);
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
            <button class="btn" data-edit-client="${client.id}"><span data-en>Edit client</span><span data-es>Editar cliente</span></button>
            <button class="btn"><span data-en>Change password</span><span data-es>Cambiar contraseña</span></button>
            <button class="btn"><span data-en>Duplicate</span><span data-es>Duplicar</span></button>
            <button class="btn danger" data-trash-client="${client.id}"><span data-en>Delete</span><span data-es>Borrar</span></button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-edit-client]").forEach((btn) => {
      btn.addEventListener("click", () => populateEditClient(btn.dataset.editClient));
    });
  }


  function setValue(selector, value) {
    const el = $(selector);
    if (el) el.value = value ?? "";
  }

  function setPreviewImage(selector, url) {
    const el = $(selector);
    if (el && url) el.style.setProperty("--crop-img", `url('${url}')`);
  }

  function setCrop(selectorX, selectorY, x, y) {
    setValue(selectorX, x ?? 50);
    setValue(selectorY, y ?? 50);
    const xEl = $(selectorX);
    if (xEl) xEl.dispatchEvent(new Event("input", { bubbles: true }));
    const yEl = $(selectorY);
    if (yEl) yEl.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function clientContext(client) {
    if (!client) return "";
    if (client.client_type === "player") return client.club || "";
    if (client.client_type === "club") return client.league || client.country || "";
    if (client.client_type === "agency") return client.agency_type || "";
    if (client.client_type === "personal") return client.personal_relation || "";
    return client.club || client.league || client.agency_type || client.personal_relation || "";
  }

  function populateEditClient(clientId) {
    const client = (window.IBAI_CLIENTS_CACHE || []).find((item) => item.id === clientId);
    if (!client) {
      setText("#edit-client-status", "Client data not found. Reload the page and try again.");
      return;
    }

    openPanel("edit-client");
    setValue("#edit-client-id", client.id);
    setValue("#edit-client-current-profile-url", client.profile_image_url || "");
    setValue("#edit-client-current-hero-url", client.hero_image_url || "");
    setValue("#edit-client-name", client.name || "");
    setValue("#edit-client-type", client.client_type || "player");
    setValue("#edit-client-context", clientContext(client));
    setValue("#edit-client-username", client.username || "");
    setValue("#edit-client-password", "");
    setValue("#edit-client-language", client.language_preference || "es");
    setValue("#edit-client-publish-status", client.publish_status || "draft");
    setValue("#edit-client-welcome-title-en", client.welcome_title_en || "");
    setValue("#edit-client-welcome-title-es", client.welcome_title_es || "");
    setValue("#edit-client-welcome-message-en", client.welcome_message_en || "");
    setValue("#edit-client-welcome-message-es", client.welcome_message_es || "");
    setValue("#edit-client-license-en", client.license_en || "");
    setValue("#edit-client-license-es", client.license_es || "");
    setValue("#edit-client-internal-notes", client.internal_notes || "");
    setValue("#edit-client-profile-file", "");
    setValue("#edit-client-hero-file", "");
    setText("#edit-client-profile-file-status", client.profile_image_url ? "Current profile image loaded. Choose a new image only if you want to replace it." : "No profile image saved yet.");
    setText("#edit-client-hero-file-status", client.hero_image_url ? "Current hero image loaded. Choose a new image only if you want to replace it." : "No hero image saved yet.");
    setPreviewImage("#edit-client-profile-preview", client.profile_image_url || "img/IMG_IBAI.jpg");
    setPreviewImage("#edit-client-hero-preview", client.hero_image_url || "img/work_A.jpg");
    setCrop("#edit-client-hero-x", "#edit-client-hero-y", client.hero_position_x ?? 50, client.hero_position_y ?? 50);
    setCrop("#edit-client-profile-x", "#edit-client-profile-y", 50, 45);
    setText("#edit-client-status", `Editing ${client.name || client.username}.`);
  }

  function previewClientPage(username) {
    const user = username || $("#edit-client-username")?.value.trim() || $("#client-username")?.value.trim() || slugify($("#client-name")?.value.trim());
    const url = user ? `client-dashboard.html?client=${encodeURIComponent(user)}&adminPreview=1` : "client-dashboard.html";
    window.open(url, "_blank");
  }

  async function saveEditClient() {
    const supabase = getSupabaseClient("#edit-client-status");
    if (!supabase) return;

    const id = $("#edit-client-id")?.value;
    if (!id) {
      setText("#edit-client-status", "Choose a client from the list first.");
      return;
    }

    const name = $("#edit-client-name")?.value.trim();
    const type = $("#edit-client-type")?.value || "player";
    const username = $("#edit-client-username")?.value.trim();
    const context = $("#edit-client-context")?.value.trim();
    const password = $("#edit-client-password")?.value;

    if (!name || !username) {
      setText("#edit-client-status", "Client name and username are required.");
      return;
    }

    let profileImageUrl = $("#edit-client-current-profile-url")?.value || null;
    let heroImageUrl = $("#edit-client-current-hero-url")?.value || null;

    try {
      const newProfile = await uploadImage(supabase, $("#edit-client-profile-file")?.files?.[0], `clients/${username}/profile`, "#edit-client-profile-file-status");
      const newHero = await uploadImage(supabase, $("#edit-client-hero-file")?.files?.[0], `clients/${username}/hero`, "#edit-client-hero-file-status");
      if (newProfile) profileImageUrl = newProfile;
      if (newHero) heroImageUrl = newHero;
    } catch (uploadError) {
      setText("#edit-client-status", "Image upload failed: " + uploadError.message);
      return;
    }

    const payload = {
      name,
      username,
      client_type: type,
      language_preference: $("#edit-client-language")?.value || "es",
      publish_status: $("#edit-client-publish-status")?.value || "draft",
      profile_image_url: profileImageUrl,
      hero_image_url: heroImageUrl,
      hero_position_x: Number($("#edit-client-hero-x")?.value || 50),
      hero_position_y: Number($("#edit-client-hero-y")?.value || 50),
      welcome_title_en: $("#edit-client-welcome-title-en")?.value.trim() || null,
      welcome_title_es: $("#edit-client-welcome-title-es")?.value.trim() || null,
      welcome_message_en: $("#edit-client-welcome-message-en")?.value.trim() || null,
      welcome_message_es: $("#edit-client-welcome-message-es")?.value.trim() || null,
      license_en: $("#edit-client-license-en")?.value.trim() || null,
      license_es: $("#edit-client-license-es")?.value.trim() || null,
      internal_notes: $("#edit-client-internal-notes")?.value.trim() || null,
      updated_at: new Date().toISOString()
    };

    payload.club = null;
    payload.league = null;
    payload.agency_type = null;
    payload.personal_relation = null;
    if (type === "player") payload.club = context || null;
    if (type === "club") payload.league = context || null;
    if (type === "agency") payload.agency_type = context || null;
    if (type === "personal") payload.personal_relation = context || null;
    if (password) payload.password_hash = await sha256(password);

    setText("#edit-client-status", "Saving client changes...");
    const { error } = await supabase.from("clients").update(payload).eq("id", id);

    if (error) {
      setText("#edit-client-status", "Could not save client: " + error.message);
      return;
    }

    setText("#edit-client-status", `Client updated: ${name}.`);
    await loadClients();
  }

  function renderGalleryClientPicker(clients, targetSelector = "#gallery-client-picker", inputName = "gallery-client", selectedIds = []) {
    const picker = $(targetSelector);
    if (!picker) return;

    if (!clients || !clients.length) {
      picker.innerHTML = `<div class="row-meta">No registered clients yet. Create a client first.</div>`;
      return;
    }

    picker.innerHTML = clients.map((client) => {
      const type = client.client_type || "client";
      const context = client.club || client.league || client.country || client.agency_type || client.personal_relation || client.username || "Private client";
      const checked = selectedIds.includes(client.id) ? "checked" : "";
      return `
        <label class="selector-card">
          <input type="checkbox" name="${inputName}" value="${client.id}" data-client-name="${client.name || client.username}" ${checked}>
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
      .is("deleted_at", null)
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
            <button class="btn" data-edit-gallery="${gallery.id}"><span data-en>Edit gallery</span><span data-es>Editar galería</span></button>
            <button class="btn" data-upload-gallery="${gallery.id}"><span data-en>Upload photos</span><span data-es>Subir fotos</span></button>
            <button class="btn" data-preview-gallery="${gallery.id}"><span data-en>Preview</span><span data-es>Previsualizar</span></button>
            <button class="btn"><span data-en>Duplicate</span><span data-es>Duplicar</span></button>
            <button class="btn danger" data-trash-gallery="${gallery.id}"><span data-en>Delete</span><span data-es>Borrar</span></button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-edit-gallery]").forEach((btn) => {
      btn.addEventListener("click", () => populateEditGallery(btn.dataset.editGallery));
    });
    list.querySelectorAll("[data-upload-gallery]").forEach((btn) => {
      btn.addEventListener("click", () => openUploadGallery(btn.dataset.uploadGallery));
    });
    list.querySelectorAll("[data-preview-gallery]").forEach((btn) => {
      btn.addEventListener("click", () => previewGallery(btn.dataset.previewGallery));
    });
  }

  async function loadGalleries() {
    const supabase = getSupabaseClient("#galleries-sync-status");
    if (!supabase) return [];

    setText("#galleries-sync-status", "Loading galleries from Supabase...");

    const { data, error } = await supabase
      .from("galleries")
      .select("*, gallery_clients(clients(id, username, name))")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      setText("#galleries-sync-status", "Could not load galleries: " + error.message);
      return [];
    }

    setText("#galleries-sync-status", `${data.length} gallery/galleries loaded from Supabase.`);
    window.IBAI_GALLERIES_CACHE = data || [];
    renderGalleries(data || []);
    renderUploadGalleryOptions(data || []);
    return data || [];
  }


  function renderUploadGalleryOptions(galleries) {
    const select = $("#upload-gallery-id");
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">Select a gallery / Selecciona una galería</option>` + (galleries || []).map((gallery) => {
      const title = gallery.title_es || gallery.title_en || "Untitled gallery";
      return `<option value="${gallery.id}">${title}</option>`;
    }).join("");
    if (current) select.value = current;
  }

  function galleryAssignedClientIds(gallery) {
    return (gallery?.gallery_clients || []).map((row) => row.client_id || row.clients?.id).filter(Boolean);
  }

  async function loadGalleryPhotos(galleryId, targetSelector = "#edit-gallery-photo-order") {
    const supabase = getSupabaseClient("#edit-gallery-status-msg");
    if (!supabase || !galleryId) return [];
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("sort_order", { ascending: true });
    const target = $(targetSelector);
    if (error) {
      if (target) target.innerHTML = `<p class="row-meta">Could not load photos: ${error.message}</p>`;
      return [];
    }
    if (target) {
      if (!data || !data.length) {
        target.innerHTML = `<p class="row-meta">No photos uploaded yet.</p>`;
      } else {
        target.innerHTML = data.map((photo, index) => `
          <div class="order-photo" title="${photo.filename}">
            <img src="${photo.preview_url || photo.large_url || photo.original_url}" alt="">
            <span>${String(index + 1).padStart(2, "0")}</span>
          </div>
        `).join("");
      }
    }
    return data || [];
  }

  function populateEditGallery(galleryId) {
    const gallery = (window.IBAI_GALLERIES_CACHE || []).find((item) => item.id === galleryId);
    if (!gallery) {
      setText("#edit-gallery-status-msg", "Gallery data not found. Reload and try again.");
      return;
    }
    openPanel("edit-gallery");
    setValue("#edit-gallery-id", gallery.id);
    setValue("#edit-gallery-current-cover-url", gallery.cover_image_url || "");
    setValue("#edit-gallery-title-es", gallery.title_es || "");
    setValue("#edit-gallery-title-en", gallery.title_en || "");
    setValue("#edit-gallery-date", gallery.event_date || "");
    setValue("#edit-gallery-location", gallery.location || "");
    setValue("#edit-gallery-status", gallery.status || "created");
    setValue("#edit-gallery-publish-status", gallery.publish_status || "draft");
    setValue("#edit-gallery-note-es", gallery.personal_note_es || "");
    setValue("#edit-gallery-note-en", gallery.personal_note_en || "");
    setValue("#edit-gallery-internal-notes", gallery.internal_notes || "");
    setValue("#edit-gallery-cover-file", "");
    setPreviewImage("#edit-gallery-cover-preview", gallery.cover_image_url || "img/work_A.jpg");
    setCrop("#edit-gallery-cover-x", "#edit-gallery-cover-y", gallery.cover_position_x ?? 50, gallery.cover_position_y ?? 50);
    setText("#edit-gallery-cover-file-status", gallery.cover_image_url ? "Current cover image loaded. Choose a new image only if you want to replace it." : "No cover image saved yet.");
    renderGalleryClientPicker(window.IBAI_CLIENTS_CACHE || [], "#edit-gallery-client-picker", "edit-gallery-client", galleryAssignedClientIds(gallery));
    setText("#edit-gallery-status-msg", `Editing ${gallery.title_es || gallery.title_en || "gallery"}.`);
    loadGalleryPhotos(gallery.id);
  }

  async function saveEditGallery() {
    const supabase = getSupabaseClient("#edit-gallery-status-msg");
    if (!supabase) return;
    const id = $("#edit-gallery-id")?.value;
    if (!id) {
      setText("#edit-gallery-status-msg", "Choose a gallery from the list first.");
      return;
    }
    const titleEs = $("#edit-gallery-title-es")?.value.trim();
    const titleEn = $("#edit-gallery-title-en")?.value.trim();
    if (!titleEs && !titleEn) {
      setText("#edit-gallery-status-msg", "Add a gallery title first.");
      return;
    }
    const selectedClientIds = Array.from(document.querySelectorAll('input[name="edit-gallery-client"]:checked')).map((input) => input.value);
    if (!selectedClientIds.length) {
      setText("#edit-gallery-status-msg", "Assign at least one client.");
      return;
    }
    let coverImageUrl = $("#edit-gallery-current-cover-url")?.value || null;
    try {
      const newCover = await uploadImage(supabase, $("#edit-gallery-cover-file")?.files?.[0], `galleries/${slugify(titleEs || titleEn)}/cover`, "#edit-gallery-cover-file-status");
      if (newCover) coverImageUrl = newCover;
    } catch (uploadError) {
      setText("#edit-gallery-status-msg", "Cover upload failed: " + uploadError.message);
      return;
    }
    const location = $("#edit-gallery-location")?.value.trim() || null;
    const payload = {
      title_es: titleEs || titleEn,
      title_en: titleEn || titleEs,
      event_date: $("#edit-gallery-date")?.value || null,
      location,
      cover_image_url: coverImageUrl || "img/work_A.jpg",
      cover_position_x: Number($("#edit-gallery-cover-x")?.value || 50),
      cover_position_y: Number($("#edit-gallery-cover-y")?.value || 50),
      status: $("#edit-gallery-status")?.value || "created",
      publish_status: $("#edit-gallery-publish-status")?.value || "draft",
      personal_note_es: $("#edit-gallery-note-es")?.value.trim() || null,
      personal_note_en: $("#edit-gallery-note-en")?.value.trim() || null,
      internal_notes: $("#edit-gallery-internal-notes")?.value.trim() || null,
      updated_at: new Date().toISOString()
    };
    setText("#edit-gallery-status-msg", "Saving gallery changes...");
    const { error } = await supabase.from("galleries").update(payload).eq("id", id);
    if (error) {
      setText("#edit-gallery-status-msg", "Could not save gallery: " + error.message);
      return;
    }
    await supabase.from("gallery_clients").delete().eq("gallery_id", id);
    const links = selectedClientIds.map((clientId) => ({ gallery_id: id, client_id: clientId }));
    const { error: linkError } = await supabase.from("gallery_clients").insert(links);
    if (linkError) {
      setText("#edit-gallery-status-msg", "Gallery saved, but client assignment failed: " + linkError.message);
      await loadGalleries();
      return;
    }
    setText("#edit-gallery-status-msg", "Gallery saved correctly.");
    await loadGalleries();
  }

  function openUploadGallery(galleryId) {
    openPanel("upload-gallery");
    const select = $("#upload-gallery-id");
    if (select && galleryId) select.value = galleryId;
    const gallery = (window.IBAI_GALLERIES_CACHE || []).find((item) => item.id === galleryId);
    if (gallery) {
      setValue("#upload-photo-location", gallery.location || "");
      setValue("#upload-photo-date", gallery.event_date || "");
    }
    setText("#upload-gallery-status", gallery ? `Ready to upload photos to ${gallery.title_es || gallery.title_en}.` : "Choose a gallery and select files.");
  }

  function detectImageOrientation(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const orientation = img.naturalHeight > img.naturalWidth ? "vertical" : "horizontal";
        URL.revokeObjectURL(url);
        resolve(orientation);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("horizontal");
      };
      img.src = url;
    });
  }

  async function uploadGalleryPhotos() {
    const supabase = getSupabaseClient("#upload-gallery-status");
    if (!supabase) return;
    const galleryId = $("#upload-gallery-id")?.value;
    const files = Array.from($("#gallery-photo-files")?.files || []);
    if (!galleryId) {
      setText("#upload-gallery-status", "Choose a gallery first.");
      return;
    }
    if (!files.length) {
      setText("#upload-gallery-status", "Select one or more image files first.");
      return;
    }
    const gallery = (window.IBAI_GALLERIES_CACHE || []).find((item) => item.id === galleryId);
    const gallerySlug = slugify(gallery?.title_es || gallery?.title_en || galleryId);
    const location = $("#upload-photo-location")?.value.trim() || gallery?.location || null;
    const eventDate = $("#upload-photo-date")?.value || gallery?.event_date || null;
    const preview = $("#upload-gallery-preview");
    if (preview) preview.innerHTML = "";
    setText("#upload-gallery-status", `Uploading 0/${files.length} photos...`);
    let uploaded = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const orientation = await detectImageOrientation(file);
      const publicUrl = await uploadImage(supabase, file, `galleries/${gallerySlug}/photos/original`, "#upload-gallery-status");
      const { error } = await supabase.from("photos").insert({
        gallery_id: galleryId,
        filename: file.name,
        original_url: publicUrl,
        large_url: publicUrl,
        preview_url: publicUrl,
        orientation,
        sort_order: uploaded + 1,
        event_date: eventDate,
        location,
        hidden: false,
        is_hidden: false
      });
      if (error) {
        setText("#upload-gallery-status", "Photo uploaded, but database insert failed: " + error.message);
        return;
      }
      uploaded += 1;
      if (preview) {
        preview.insertAdjacentHTML("beforeend", `<div class="order-photo"><img src="${publicUrl}" alt=""><span>${String(uploaded).padStart(2, "0")}</span></div>`);
      }
      setText("#upload-gallery-status", `Uploading ${uploaded}/${files.length} photos...`);
    }
    setText("#upload-gallery-status", `${uploaded} photo(s) uploaded and linked to the gallery.`);
    const galleryStatus = uploaded > 0 ? "in_progress" : "created";
    await supabase.from("galleries").update({ status: galleryStatus, updated_at: new Date().toISOString() }).eq("id", galleryId).neq("status", "ready");
    await loadGalleries();
  }

  function previewGallery(galleryId) {
    const url = galleryId ? `gallery-view.html?gallery=${encodeURIComponent(galleryId)}&adminPreview=1` : "gallery-view.html";
    window.open(url, "_blank");
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
    if (session) {
      setText("#admin-session-status", `Admin: ${session.name || session.username}`);
      updateAdminHero(session);
    }
    return session;
  }


  function updateAdminHero(session) {
    if (!session) return;
    const nameEl = $("#admin-hero-name");
    const avatarEl = $("#admin-hero-avatar");
    if (nameEl) nameEl.textContent = session.name || session.username || "Admin";
    if (avatarEl && session.profile_image_url) avatarEl.src = session.profile_image_url;
  }

  function renderAdmins(admins) {
    const list = $("#admins-list-render");
    if (!list) return;

    window.IBAI_ADMINS_CACHE = admins || [];

    if (!admins || !admins.length) {
      list.innerHTML = `<div class="list-row"><div><div class="row-title">No administrators yet</div><div class="row-meta">Create the first administrator from the Create admin tab.</div></div></div>`;
      return;
    }

    list.innerHTML = admins.map((admin) => {
      const img = admin.profile_image_url || "img/IMG_IBAI.jpg";
      return `
        <div class="list-row" data-admin-id="${admin.id}">
          <img class="avatar" src="${img}" alt="">
          <div>
            <div class="row-title">${admin.name || admin.username}</div>
            <div class="row-meta">${admin.username} · ${admin.role || "editor"} · ${admin.active ? "active" : "inactive"}</div>
          </div>
          <div class="row-actions admin-card-actions">
            <button class="btn" data-edit-admin="${admin.id}"><span data-en>Edit admin</span><span data-es>Editar admin</span></button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-edit-admin]").forEach((btn) => {
      btn.addEventListener("click", () => populateEditAdmin(btn.dataset.editAdmin));
    });
  }

  async function loadAdmins() {
    const supabase = getSupabaseClient("#admins-sync-status");
    if (!supabase) return [];
    setText("#admins-sync-status", "Loading administrators from Supabase...");
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, username, name, role, active, profile_image_url, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setText("#admins-sync-status", "Could not load administrators: " + error.message);
      return [];
    }
    setText("#admins-sync-status", `${data.length} administrator(s) loaded from Supabase.`);
    renderAdmins(data || []);

    const session = currentAdminSession();
    if (session?.id) {
      const fresh = (data || []).find((admin) => admin.id === session.id);
      if (fresh) {
        localStorage.setItem("ibaiAdminSession", JSON.stringify({ ...session, ...fresh }));
        updateAdminHero(fresh);
      }
    }
    return data || [];
  }

  function populateEditAdmin(adminId) {
    const admin = (window.IBAI_ADMINS_CACHE || []).find((item) => item.id === adminId);
    if (!admin) {
      setText("#edit-admin-status", "Administrator data not found. Reload the page and try again.");
      return;
    }
    openPanel("edit-admin");
    setValue("#edit-admin-id", admin.id);
    setValue("#edit-admin-current-profile-url", admin.profile_image_url || "");
    setValue("#edit-admin-name", admin.name || "");
    setValue("#edit-admin-username", admin.username || "");
    setValue("#edit-admin-password", "");
    setValue("#edit-admin-role", admin.role || "editor");
    setValue("#edit-admin-active", admin.active ? "true" : "false");
    setPreviewImage("#edit-admin-profile-preview", admin.profile_image_url || "img/IMG_IBAI.jpg");
    setValue("#edit-admin-profile-file", "");
    setText("#edit-admin-profile-file-status", admin.profile_image_url ? "Current admin profile image loaded. Choose a new image only if you want to replace it." : "No profile image saved yet.");
    setText("#edit-admin-status", `Editing ${admin.name || admin.username}.`);
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

    let profileImageUrl = null;
    try {
      profileImageUrl = await uploadImage(supabase, $("#admin-profile-file")?.files?.[0], `admins/${username}/profile`, "#admin-profile-file-status");
    } catch (uploadError) {
      setText("#admin-create-status", "Admin profile image upload failed: " + uploadError.message);
      return;
    }

    const password_hash = await sha256(password);
    setText("#admin-create-status", "Creating administrator in Supabase...");
    const { error } = await supabase.from("admin_users").insert({ username, password_hash, name, role, active: true, profile_image_url: profileImageUrl });
    if (error) {
      setText("#admin-create-status", "Could not create administrator: " + error.message);
      return;
    }
    setText("#admin-create-status", `Administrator created: ${name} (${username})`);
    ["#admin-name", "#admin-username", "#admin-password", "#admin-profile-file"].forEach((selector) => { const el = $(selector); if (el) el.value = ""; });
    setText("#admin-profile-file-status", "No image selected yet.");
    setPreviewImage("#admin-profile-preview", "img/IMG_IBAI.jpg");
    await loadAdmins();
  }

  async function saveEditAdmin() {
    const supabase = getSupabaseClient("#edit-admin-status");
    if (!supabase) return;

    const id = $("#edit-admin-id")?.value;
    const name = $("#edit-admin-name")?.value.trim();
    const username = slugify($("#edit-admin-username")?.value.trim());
    const password = $("#edit-admin-password")?.value;
    const role = $("#edit-admin-role")?.value || "editor";
    const active = $("#edit-admin-active")?.value === "true";

    if (!id || !name || !username) {
      setText("#edit-admin-status", "Choose an administrator and add name and username.");
      return;
    }

    let profileImageUrl = $("#edit-admin-current-profile-url")?.value || null;
    try {
      const newProfile = await uploadImage(supabase, $("#edit-admin-profile-file")?.files?.[0], `admins/${username}/profile`, "#edit-admin-profile-file-status");
      if (newProfile) profileImageUrl = newProfile;
    } catch (uploadError) {
      setText("#edit-admin-status", "Admin profile image upload failed: " + uploadError.message);
      return;
    }

    const payload = { name, username, role, active, profile_image_url: profileImageUrl, updated_at: new Date().toISOString() };
    if (password) payload.password_hash = await sha256(password);

    setText("#edit-admin-status", "Saving administrator changes...");
    const { error } = await supabase.from("admin_users").update(payload).eq("id", id);
    if (error) {
      setText("#edit-admin-status", "Could not update administrator: " + error.message);
      return;
    }

    const session = currentAdminSession();
    if (session?.id === id) {
      const updatedSession = { ...session, ...payload, id };
      localStorage.setItem("ibaiAdminSession", JSON.stringify(updatedSession));
      updateAdminHero(updatedSession);
    }

    setText("#edit-admin-status", "Administrator updated successfully.");
    await loadAdmins();
  }
  document.addEventListener("DOMContentLoaded", () => {
    const session = requireAdminSession();
    if (!session && location.pathname.endsWith("admin-panel.html")) return;

    const logoutBtn = $("#admin-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", () => { localStorage.removeItem("ibaiAdminSession"); location.href = "admin-login.html"; });

    const createClientBtn = $("#create-client-submit");
    if (createClientBtn) createClientBtn.addEventListener("click", createClient);

    const saveEditClientBtn = $("#save-edit-client");
    if (saveEditClientBtn) saveEditClientBtn.addEventListener("click", saveEditClient);

    const previewCreateClientBtn = $("#preview-create-client");
    if (previewCreateClientBtn) previewCreateClientBtn.addEventListener("click", () => previewClientPage());

    const previewEditClientBtn = $("#preview-edit-client");
    if (previewEditClientBtn) previewEditClientBtn.addEventListener("click", () => previewClientPage());

    const createGalleryBtn = $("#create-gallery-submit");
    if (createGalleryBtn) createGalleryBtn.addEventListener("click", createGallery);

    const saveEditGalleryBtn = $("#save-edit-gallery");
    if (saveEditGalleryBtn) saveEditGalleryBtn.addEventListener("click", saveEditGallery);

    const previewEditGalleryBtn = $("#preview-edit-gallery");
    if (previewEditGalleryBtn) previewEditGalleryBtn.addEventListener("click", () => previewGallery($("#edit-gallery-id")?.value));

    const uploadGalleryPhotosBtn = $("#upload-gallery-photos-submit");
    if (uploadGalleryPhotosBtn) uploadGalleryPhotosBtn.addEventListener("click", uploadGalleryPhotos);

    const createAdminBtn = $("#create-admin-submit");
    if (createAdminBtn) createAdminBtn.addEventListener("click", createAdmin);

    const saveEditAdminBtn = $("#save-edit-admin");
    if (saveEditAdminBtn) saveEditAdminBtn.addEventListener("click", saveEditAdmin);

    setupImagePreviewInputs();

    loadClients();
    loadGalleries();
    loadAdmins();
  });
})();
