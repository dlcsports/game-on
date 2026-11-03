#!/usr/bin/env node
/** Seed games + houses using SUPABASE_SECRET_KEY (@supabase/server). Tables must exist first. */
import "./load-env.mjs";
import { createAdminClient } from "@supabase/server/core";
import { printMissingTablesHelp } from "./pg-connection-string.mjs";

const GAMES = [
  ["Cricket", "6 players", "15 teams", 140, 70, "outdoor", 1],
  ["Futsal", "6 players", "10 teams", 140, 70, "outdoor", 2],
  ["Padel", "2 players", "20 teams", 60, 30, "outdoor", 3],
  ["Badminton", "2 players", "20 teams", 60, 30, "outdoor", 4],
  ["Table Tennis", "4 players", "16 teams", 80, 40, "indoor", 1],
  ["Foosball", "2 players", "30 teams", 50, 25, "indoor", 2],
  ["Carrom", "2 players", "12 teams", 40, 20, "indoor", 3],
  ["Chess", "1 player", "20 players", 50, 25, "indoor", 4],
];

const HOUSES = [
  ["House Phoenix", 0, 0, 1],
  ["House Falcon", 0, 0, 2],
  ["House Titan", 0, 0, 3],
  ["House Nova", 0, 0, 4],
];

export async function runSeed() {
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { ok: false, reason: "env", message: e.message };
  }

  const { count: gameCount, error: gameCountErr } = await admin
    .from("games")
    .select("*", { count: "exact", head: true });

  if (gameCountErr) {
    if (/schema cache|Could not find the table/i.test(gameCountErr.message)) {
      return { ok: false, reason: "missing_tables", message: gameCountErr.message };
    }
    return { ok: false, reason: "error", message: gameCountErr.message };
  }

  if (!gameCount) {
    const rows = GAMES.map(
      ([name, team_size, teams_label, winner_points, runner_up_points, category, sort_order]) => ({
        name,
        team_size,
        teams_label,
        winner_points,
        runner_up_points,
        category,
        sort_order,
      })
    );
    const { error } = await admin.from("games").insert(rows);
    if (error) return { ok: false, reason: "error", message: error.message };
    console.log("Inserted", rows.length, "games.");
  } else {
    console.log("Games already present:", gameCount);
  }

  const { count: houseCount, error: houseCountErr } = await admin
    .from("houses")
    .select("*", { count: "exact", head: true });

  if (houseCountErr) {
    return { ok: false, reason: "error", message: houseCountErr.message };
  }

  if (!houseCount) {
    const rows = HOUSES.map(([name, outdoor_points, indoor_points, sort_order]) => ({
      name,
      outdoor_points,
      indoor_points,
      sort_order,
    }));
    const { error } = await admin.from("houses").insert(rows);
    if (error) return { ok: false, reason: "error", message: error.message };
    console.log("Inserted", rows.length, "houses.");
  } else {
    console.log("Houses already present:", houseCount);
  }

  return { ok: true };
}

const isMain = process.argv[1]?.endsWith("seed-via-admin.mjs");
if (isMain) {
  const result = await runSeed();
  if (result.ok) {
    console.log("Seed complete.");
    process.exit(0);
  }
  if (result.reason === "env") {
    console.error("Missing env. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env");
    console.error(result.message);
  } else if (result.reason === "missing_tables") {
    console.error("Cannot read games:", result.message);
    printMissingTablesHelp();
  } else {
    console.error(result.message);
  }
  process.exit(1);
}
