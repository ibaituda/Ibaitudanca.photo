(function () {
  function $(selector) { return document.querySelector(selector); }
  function all(selector) { return Array.from(document.querySelectorAll(selector)); }
  function setText(selector, message) {
    const el = $(selector);
    if (el) el.textContent = message || "";
  }
  async function sha256(message) {
    if (!message) return null;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem("ibaiAdminSession") || "null"); }
    catch (_) { return null; }
  }
  function isOwner() {
    const session = getSession();
    return (session?.role || "").toLowerCase() === "owner";
  }
  function supabaseClient() {
    if (!window.supabase || !window.supabase.createClient) return null;
    const url = window.IBAI_SUPABASE_URL;
    const key = window.IBAI_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes("PASTE_") || key.includes("PASTE_")) return null;
    return window.supabase.createClient(url, key);
  }
  function showSecurityNotice() {
    const session = getSession();
    const role = (session?.role || "editor").toLowerCase();
    const heroName = $("#admin-hero-name");
    if (heroName && session) {
      heroName.textContent = `${session.name || session.username || "Admin"} · ${role.toUpperCase()}`;
    }
    const adminsSection = $('#admins');
    if (adminsSection && !$('#admin-security-note')) {
      const note = document.createElement('div');
      note.id = 'admin-security-note';
      note.className = 'card pad';
      note.style.marginBottom = '14px';
      note.innerHTML = `
        <h3><span data-en>Security roles</span><span data-es>Roles de seguridad</span></h3>
        <p class="row-meta"><span data-en>Owner can manage administrators and passwords. Editors/photographers can work on deliveries but cannot change administrator access.</span><span data-es>Owner puede gestionar administradores y contraseñas. Editores/fotógrafos pueden trabajar en entregas pero no cambiar accesos de administrador.</span></p>
      `;
      const hero = adminsSection.querySelector('.hero');
      if (hero && hero.nextSibling) hero.parentNode.insertBefore(note, hero.nextSibling);
    }
  }
  function applyRoleUi() {
    const owner = isOwner();
    document.body.dataset.adminRole = getSession()?.role || "editor";

    if (!owner) {
      // Administrators and Settings are owner-only in this beta.
      all('[data-section="admins"], [data-section="settings"]').forEach((el) => { el.style.display = "none"; });
      const active = document.querySelector('.side-btn.active');
      if (active && (active.dataset.section === 'admins' || active.dataset.section === 'settings')) {
        const overview = document.querySelector('[data-section="overview"]');
        if (overview) overview.click();
      }
      all('#admins input, #admins select, #admins button, #settings input, #settings textarea, #settings select, #settings button').forEach((el) => {
        el.disabled = true;
        el.title = 'Owner only';
      });
      // Non-owner admins should not reset client passwords either.
      all('.list-row[data-client-id] .row-actions button').forEach((btn) => {
        const text = (btn.textContent || '').toLowerCase();
        if (text.includes('change password') || text.includes('cambiar contraseña')) btn.style.display = 'none';
      });
      const editClientPassword = $('#edit-client-password');
      if (editClientPassword) {
        const field = editClientPassword.closest('.field');
        if (field) field.style.display = 'none';
      }
    }

    showSecurityNotice();
  }

  async function resetClientPassword(clientId) {
    if (!isOwner()) {
      alert('Solo el Owner puede cambiar contraseñas de clientes.');
      return;
    }
    const supabase = supabaseClient();
    if (!supabase) {
      alert('Supabase no está configurado.');
      return;
    }
    const newPassword = prompt('Nueva contraseña para este cliente:');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert('Usa al menos 6 caracteres.');
      return;
    }
    const password_hash = await sha256(newPassword);
    const { error } = await supabase.from('clients').update({ password_hash, updated_at: new Date().toISOString() }).eq('id', clientId);
    if (error) {
      alert('No se pudo cambiar la contraseña: ' + error.message);
      return;
    }
    alert('Contraseña del cliente actualizada correctamente.');
  }

  function guardAdminButtons(event) {
    const target = event.target.closest('button');
    if (!target) return;
    const owner = isOwner();

    if ((target.id === 'create-admin-submit' || target.id === 'save-edit-admin') && !owner) {
      event.preventDefault();
      event.stopImmediatePropagation();
      alert('Solo el Owner puede crear o editar administradores.');
      return;
    }

    if (target.id === 'save-edit-admin' && owner) {
      const session = getSession();
      const editingId = $('#edit-admin-id')?.value;
      const role = $('#edit-admin-role')?.value;
      const active = $('#edit-admin-active')?.value;
      // Prevent the current owner from accidentally demoting or disabling themselves.
      if (session?.id && editingId === session.id && (role !== 'owner' || active !== 'true')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        alert('Tu cuenta Owner no puede desactivarse ni dejar de ser Owner desde aquí.');
        return;
      }
    }

    // Make existing "Change password" buttons functional without changing the visual design.
    const text = (target.textContent || '').toLowerCase();
    const clientRow = target.closest('.list-row[data-client-id]');
    if (clientRow && (text.includes('change password') || text.includes('cambiar contraseña'))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      resetClientPassword(clientRow.dataset.clientId);
    }
  }

  function observeDynamicLists() {
    const observer = new MutationObserver(() => applyRoleUi());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', guardAdminButtons, true);
    applyRoleUi();
    observeDynamicLists();
  });
})();
