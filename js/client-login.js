(function () {
  const SESSION_KEY = 'ibaiClientSession';
  const $ = (s, r = document) => r.querySelector(s);

  function getSupabaseClient() {
    if (!window.supabase || !window.IBAI_SUPABASE_URL || !window.IBAI_SUPABASE_ANON_KEY) return null;
    return window.supabase.createClient(window.IBAI_SUPABASE_URL, window.IBAI_SUPABASE_ANON_KEY);
  }

  async function sha256(value) {
    const data = new TextEncoder().encode(value || '');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function setStatus(message, isError = false) {
    const el = $('#status-message');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    el.style.color = isError ? 'rgba(255,120,120,.95)' : 'rgba(255,255,255,.72)';
  }

  async function handleClientLogin(event) {
    event.preventDefault();
    const sb = getSupabaseClient();
    if (!sb) {
      setStatus('Supabase is not configured yet. Check js/supabase-config.js.', true);
      return;
    }

    const username = ($('#username')?.value || $('#email')?.value || '').trim();
    const password = ($('#password')?.value || '').trim();

    if (!username || !password) {
      setStatus('Introduce usuario y contraseña.', true);
      return;
    }

    setStatus('Comprobando acceso...');
    const { data, error } = await sb
      .from('clients')
      .select('id, username, name, password_hash, active, publish_status')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.warn(error);
      setStatus('No se ha podido comprobar el acceso. Inténtalo de nuevo.', true);
      return;
    }

    if (!data || !data.active) {
      setStatus('Usuario o contraseña incorrectos.', true);
      return;
    }

    const inputHash = await sha256(password);
    if (data.password_hash !== inputHash) {
      setStatus('Usuario o contraseña incorrectos.', true);
      return;
    }

    const session = {
      id: data.id,
      username: data.username,
      name: data.name,
      loggedAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setStatus('Acceso correcto. Abriendo tu área privada...');
    const slug = (data.username || data.name || data.id || 'client').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    window.location.href = `/client-dashboard/${encodeURIComponent(slug)}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = $('#client-login-form');
    if (form) form.addEventListener('submit', handleClientLogin);
  });
})();
