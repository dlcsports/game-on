/** @typedef {{ user: string, password: string, host: string, port: number, database: string }} PgConnParts */

const PROJECT_REF = "ngeolywmkqvscqxfgtrd";
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`;

export function isDirectSupabaseDbHost(host) {
  return host.startsWith("db.") && host.endsWith(".supabase.co");
}

export function isSessionPoolerHost(host) {
  return host.includes(".pooler.supabase.com");
}

/**
 * Parse postgres URL without breaking on *, $, # in password (use last @ split).
 * @param {string} raw
 * @returns {PgConnParts}
 */
export function parsePostgresUrl(raw) {
  const trimmed = raw.trim();
  const m = trimmed.match(/^postgres(?:ql)?:\/\//i);
  if (!m) throw new Error("Connection string must start with postgresql://");

  const rest = trimmed.slice(m[0].length);
  const at = rest.lastIndexOf("@");
  if (at === -1) throw new Error("Invalid connection string: missing @");

  const userinfo = rest.slice(0, at);
  const hostPart = rest.slice(at + 1);

  const colon = userinfo.indexOf(":");
  const userRaw = colon === -1 ? userinfo : userinfo.slice(0, colon);
  const passRaw = colon === -1 ? "" : userinfo.slice(colon + 1);

  const user = decodeUserinfo(userRaw);
  const password = decodeUserinfo(passRaw);

  const q = hostPart.indexOf("?");
  const pathHost = q === -1 ? hostPart : hostPart.slice(0, q);
  const slash = pathHost.indexOf("/");
  const hostPort = slash === -1 ? pathHost : pathHost.slice(0, slash);
  const database =
    slash === -1 ? "postgres" : decodeURIComponent(pathHost.slice(slash + 1));

  const portMatch = hostPort.match(/:(\d+)$/);
  const port = portMatch ? Number(portMatch[1]) : 5432;
  let host = portMatch ? hostPort.slice(0, -portMatch[0].length) : hostPort;
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);

  return { user, password, host, port, database };
}

function decodeUserinfo(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Encode password for use in a URI (Dashboard copies may already be encoded). */
export function encodePasswordForUrl(password) {
  return encodeURIComponent(password);
}

export function formatPoolerExample() {
  return `postgresql://postgres.${PROJECT_REF}:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres`;
}

export function printDirectDbBlockedHelp() {
  console.error(`
Direct host db.${PROJECT_REF}.supabase.co is IPv6-only. Your network cannot reach it (ENOTFOUND / EHOSTUNREACH).

Use one of these:

1) SQL Editor (no pooler needed)
   ${SQL_EDITOR_URL}
   Paste the full contents of supabase/setup-all.sql → Run
   Then: npm run db:seed

2) Session pooler in .env (IPv4)
   Dashboard → Connect → Session pooler → copy URI exactly.
   • Username: postgres.${PROJECT_REF}  (not postgres)
   • Host: aws-0-….pooler.supabase.com  (copy from dashboard, do not guess)

   If your password contains *, $, #, or @, percent-encode it in the URL:
   Example: p$word → p%24word

   SUPABASE_DB_URL=${formatPoolerExample()}

   Then: npm run db:setup && npm run db:seed
`);
}

export function printMissingTablesHelp() {
  console.error(`
Tables public.games / public.houses do not exist yet.

→ ${SQL_EDITOR_URL}
  Open supabase/setup-all.sql in this repo, paste all, Run.

Then: npm run db:seed
`);
}

/**
 * Validate and normalize for pg.Client. Blocks direct db.* host (use pooler or SQL Editor).
 * @param {string} raw
 */
export async function prepareConnection(raw) {
  const parts = parsePostgresUrl(raw);

  if (isDirectSupabaseDbHost(parts.host)) {
    return {
      ok: false,
      parts: null,
      error: "direct_db_host",
    };
  }

  if (isSessionPoolerHost(parts.host) && parts.user === "postgres") {
    return {
      ok: false,
      parts: null,
      error: "pooler_wrong_user",
      hint: `Session pooler username must be postgres.${PROJECT_REF}, not postgres.`,
    };
  }

  return { ok: true, parts, error: null, hint: null };
}

export { SQL_EDITOR_URL, PROJECT_REF };
