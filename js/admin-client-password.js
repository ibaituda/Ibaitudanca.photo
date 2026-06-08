(function () {
  function getSupabaseClient() {
    if (!window.supabase || !window.supabase.createClient) return null;
    if (!window.IBAI_SUPABASE_URL || !window.IBAI_SUPABASE_ANON_KEY) return null;
    if (String(window.IBAI_SUPABASE_URL).includes('PASTE_') || String(window.IBAI_SUPABASE_ANON_KEY).includes('PASTE_')) return null;
    return window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);
  }

  async function sha256(message) {
    const data = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function isChangePasswordButton(button) {
    const text = (button.textContent || '').toLowerCase().trim();
    return text.includes('change password') || text.includes('cambiar contraseña');
  }

  async function changeClientPassword(clientId) {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      alert('Supabase no está configurado correctamente.');
      return;
    }

    const password = prompt('Nueva contraseña para este cliente:');
    if (!password) return;
    if (password.length < 6) {
      alert('Usa una contraseña de al menos 6 caracteres.');
      return;
    }

    const password_hash = await sha256(password);
    const { error } = await supabaseClient
      .from('clients')
      .update({ password_hash: password_hash, updated_at: new Date().toISOString() })
      .eq('id', clientId);

    if (error) {
      alert('No se pudo cambiar la contraseña: ' + error.message);
      return;
    }

    alert('Contraseña del cliente actualizada correctamente.');
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('button');
    if (!button || !isChangePasswordButton(button)) return;

    const row = button.closest('.list-row[data-client-id]');
    if (!row || !row.dataset.clientId) return;

    event.preventDefault();
    event.stopPropagation();
    changeClientPassword(row.dataset.clientId);
  }, true);
})();
