import { supabase } from "./supabase.js";

export async function fetchGames(category) {
  if (!supabase) throw new Error("Supabase is not configured");
  let q = supabase.from("games").select("*").order("sort_order", { ascending: true });
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchHouses() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("houses")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function fmtPoints(n) {
  if (n === 0 || n == null) return "—";
  return String(n);
}

export function sortHouses(houses) {
  return [...houses].sort((a, b) => {
    const totalA = a.outdoor_points + a.indoor_points;
    const totalB = b.outdoor_points + b.indoor_points;
    if (totalB !== totalA) return totalB - totalA;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });
}

function friendlyError(error) {
  const msg = error?.message ?? "Unknown error";
  if (/row-level security|RLS|permission denied/i.test(msg)) {
    return "Permission denied. Your account must be in admin_profiles.";
  }
  return msg;
}

export async function saveGame(payload) {
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
    const { error } = await supabase.from("games").update(row).eq("id", payload.id);
    if (error) throw new Error(friendlyError(error));
    return payload.id;
  }
  const { data, error } = await supabase.from("games").insert(row).select("id").single();
  if (error) throw new Error(friendlyError(error));
  return data.id;
}

export async function deleteGame(id) {
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) throw new Error(friendlyError(error));
}

export async function saveHouse(payload) {
  const row = {
    name: payload.name.trim(),
    outdoor_points: Number(payload.outdoor_points) || 0,
    indoor_points: Number(payload.indoor_points) || 0,
    sort_order: Number(payload.sort_order) || 0,
  };
  if (payload.id) {
    const { error } = await supabase.from("houses").update(row).eq("id", payload.id);
    if (error) throw new Error(friendlyError(error));
    return payload.id;
  }
  const { data, error } = await supabase.from("houses").insert(row).select("id").single();
  if (error) throw new Error(friendlyError(error));
  return data.id;
}

export async function deleteHouse(id) {
  const { error } = await supabase.from("houses").delete().eq("id", id);
  if (error) throw new Error(friendlyError(error));
}

export async function isAdminUser(user) {
  if (!user || !supabase) return false;
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(friendlyError(error));
  return Boolean(data);
}
