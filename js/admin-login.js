(function () {
  async function sha256(message) {
    if (!message) return null;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function setStatus(message, ok = false) {
    const el = document.getElementById("status-message");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    el.style.color = ok ? "rgba(110,226,143,.95)" : "rgba(255,255,255,.62)";
  }

  function getSupabaseClient() {
    const url = window.IBAI_SUPABASE_URL;
    const key = window.IBAI_SUPABASE_ANON_KEY;

    if (!url || !key || url.includes("PASTE_") || key.includes("PASTE_")) {
      setStatus("Supabase is not configured yet. Open js/supabase-config.js and paste your Project URL and publishable key.");
      return null;
    }

    if (!window.supabase || !window.supabase.createClient) {
      setStatus("Supabase library could not be loaded.");
      return null;
    }

    return window.supabase.createClient(url, key);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("ibaiAdminSession")) {
      // Already logged in; keep login page available if user manually opens it, but show status.
      setStatus("Admin session already active. Opening admin panel...", true);
      setTimeout(() => { location.href = "admin-panel.html"; }, 600);
      return;
    }

    const form = document.getElementById("admin-login-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const username = (document.getElementById("email")?.value || "").trim().toLowerCase();
      const password = document.getElementById("password")?.value || "";

      if (!username || !password) {
        setStatus("Introduce usuario y contraseña.");
        return;
      }

      setStatus("Checking administrator access...");
      const password_hash = await sha256(password);

      const { data, error } = await supabase
        .from("admin_users")
        .select("id, username, name, role, active, profile_image_url")
        .eq("username", username)
        .eq("password_hash", password_hash)
        .eq("active", true)
        .maybeSingle();

      if (error) {
        setStatus("Login error: " + error.message);
        return;
      }

      if (!data) {
        setStatus("Usuario o contraseña incorrectos.");
        return;
      }

      localStorage.setItem("ibaiAdminSession", JSON.stringify({
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role,
        profile_image_url: data.profile_image_url,
        loggedAt: new Date().toISOString()
      }));

      setStatus("Access granted. Opening admin panel...", true);
      setTimeout(() => { location.href = "admin-panel.html"; }, 500);
    });
  });
})();
