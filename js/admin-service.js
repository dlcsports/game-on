(function () {
  function client() {
    return window.GameOnSupabase.getClient();
  }

  function requireClient() {
    const sb = client();
    if (!sb) throw new Error("Supabase is not configured. Add js/config.js.");
    return sb;
  }

  function friendlyDbError(error) {
    if (!error) return "Unknown error";
    const msg = error.message || String(error);
    if (/row-level security|RLS|permission denied/i.test(msg)) {
      return "Permission denied. Sign in with an account in admin_profiles.";
    }
    return msg;
  }

  async function getSessionUser() {
    const sb = requireClient();
    const { data, error } = await sb.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  }

  function onAuthStateChange(callback) {
    const sb = client();
    if (!sb) return () => {};
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }

  async function signIn(email, password) {
    const sb = requireClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }

  async function signOut() {
    const sb = client();
    if (sb) await sb.auth.signOut();
  }

  async function isAdminUser(user) {
    if (!user) return false;
    const sb = requireClient();
    const { data, error } = await sb
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error(friendlyDbError(error));
    return Boolean(data);
  }

  async function listGames(category) {
    const sb = requireClient();
    let q = sb.from("games").select("*").order("sort_order", { ascending: true });
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) throw new Error(friendlyDbError(error));
    return data || [];
  }

  async function saveGame(payload) {
    const sb = requireClient();
    const row = {
      name: payload.name.trim(),
      team_size: payload.team_size.trim(),
      teams_label: payload.teams_label.trim(),
      winner_points: Number(payload.winner_points),
      runner_up_points: Number(payload.runner_up_points),
      category: payload.category,
      sort_order: Number(payload.sort_order) || 0,
    };
    if (payload.id) {
      const { error } = await sb.from("games").update(row).eq("id", payload.id);
      if (error) throw new Error(friendlyDbError(error));
      return payload.id;
    }
    const { data, error } = await sb.from("games").insert(row).select("id").single();
    if (error) throw new Error(friendlyDbError(error));
    return data.id;
  }

  async function deleteGame(id) {
    const sb = requireClient();
    const { error } = await sb.from("games").delete().eq("id", id);
    if (error) throw new Error(friendlyDbError(error));
  }

  async function listHouses() {
    const sb = requireClient();
    const { data, error } = await sb
      .from("houses")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(friendlyDbError(error));
    return data || [];
  }

  async function saveHouse(payload) {
    const sb = requireClient();
    const row = {
      name: payload.name.trim(),
      outdoor_points: Number(payload.outdoor_points) || 0,
      indoor_points: Number(payload.indoor_points) || 0,
      sort_order: Number(payload.sort_order) || 0,
    };
    if (payload.id) {
      const { error } = await sb.from("houses").update(row).eq("id", payload.id);
      if (error) throw new Error(friendlyDbError(error));
      return payload.id;
    }
    const { data, error } = await sb.from("houses").insert(row).select("id").single();
    if (error) throw new Error(friendlyDbError(error));
    return data.id;
  }

  async function deleteHouse(id) {
    const sb = requireClient();
    const { error } = await sb.from("houses").delete().eq("id", id);
    if (error) throw new Error(friendlyDbError(error));
  }

  window.GameOnAdmin = {
    getSessionUser,
    onAuthStateChange,
    signIn,
    signOut,
    isAdminUser,
    listGames,
    saveGame,
    deleteGame,
    listHouses,
    saveHouse,
    deleteHouse,
  };
})();
