#!/usr/bin/env node
/**
 * 1. Try admin seed (needs tables + .env API keys)
 * 2. If tables missing: print SQL Editor steps; run db:setup only if SUPABASE_DB_URL is a pooler host
 */
import "./load-env.mjs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSeed } from "./seed-via-admin.mjs";
import {
  parsePostgresUrl,
  isDirectSupabaseDbHost,
  isSessionPoolerHost,
  printDirectDbBlockedHelp,
  printMissingTablesHelp,
  SQL_EDITOR_URL,
} from "./pg-connection-string.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function runNodeScript(scriptName) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, scriptName)], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

console.log("Step 1: seed via Supabase API (secret key)…");
const seed = await runSeed();

if (seed.ok) {
  console.log("Bootstrap complete — data is in Supabase.");
  process.exit(0);
}

if (seed.reason === "missing_tables") {
  console.error("\nTables not found.\n");
  printMissingTablesHelp();

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const { host } = parsePostgresUrl(dbUrl);
      if (isDirectSupabaseDbHost(host)) {
        console.error("\nYour SUPABASE_DB_URL uses direct db.* host — CLI cannot connect from this network.\n");
        printDirectDbBlockedHelp();
        process.exit(1);
      }
      if (isSessionPoolerHost(host)) {
        console.log("\nStep 2: applying schema via Session pooler…");
        const setupCode = await runNodeScript("run-setup.mjs");
        if (setupCode !== 0) process.exit(setupCode);
        console.log("\nStep 3: seed again…");
        const seed2 = await runSeed();
        if (seed2.ok) {
          console.log("Bootstrap complete.");
          process.exit(0);
        }
        console.error("Seed after setup failed:", seed2.message);
        process.exit(1);
      }
    } catch (e) {
      console.error("Could not parse SUPABASE_DB_URL:", e.message);
    }
  }

  console.error(`
No usable SUPABASE_DB_URL for automatic setup.

Quick path: SQL Editor
  ${SQL_EDITOR_URL}
  Paste supabase/setup-all.sql → Run → npm run db:seed
`);
  process.exit(1);
}

console.error("Bootstrap failed:", seed.message);
process.exit(1);
