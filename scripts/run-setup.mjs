#!/usr/bin/env node
/**
 * Apply supabase/setup-all.sql via Postgres (Session pooler URL in .env).
 */
import "./load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  prepareConnection,
  printDirectDbBlockedHelp,
} from "./pg-connection-string.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "..", "supabase", "setup-all.sql");
const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "Missing SUPABASE_DB_URL in .env\n\nCopy Session pooler URI from Dashboard → Connect → Session pooler."
  );
  process.exit(1);
}

const prep = await prepareConnection(connectionString);
if (!prep.ok) {
  if (prep.error === "direct_db_host") {
    printDirectDbBlockedHelp();
  } else if (prep.error === "pooler_wrong_user") {
    console.error(prep.hint);
  } else {
    console.error("Invalid SUPABASE_DB_URL:", prep.error);
  }
  process.exit(1);
}

const { parts } = prep;
const sql = fs.readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  host: parts.host,
  port: parts.port,
  user: parts.user,
  password: parts.password,
  database: parts.database,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected via", parts.host, "as", parts.user);
  console.log("Running setup-all.sql…");
  await client.query(sql);
  const games = await client.query("select count(*)::int as n from public.games");
  const houses = await client.query("select count(*)::int as n from public.houses");
  console.log("Done. games:", games.rows[0].n, "houses:", houses.rows[0].n);
} catch (err) {
  console.error("Setup failed:", err.message);
  if (/ENOTFOUND|EHOSTUNREACH|getaddrinfo/i.test(String(err.message))) {
    printDirectDbBlockedHelp();
  }
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
