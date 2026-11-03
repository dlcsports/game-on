(function () {
  function getConfig() {
    return window.GAME_ON_CONFIG || {};
  }

  function isConfigured() {
    const c = getConfig();
    return Boolean(c.supabaseUrl && c.supabaseAnonKey);
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (window.__gameOnSupabase) return window.__gameOnSupabase;
    if (!window.supabase) {
      console.warn("Supabase JS not loaded");
      return null;
    }
    window.__gameOnSupabase = window.supabase.createClient(
      getConfig().supabaseUrl,
      getConfig().supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "game-on-auth",
        },
      }
    );
    return window.__gameOnSupabase;
  }

  window.GameOnSupabase = {
    getConfig,
    isConfigured,
    getClient,
  };
})();
