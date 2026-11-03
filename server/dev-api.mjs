/**
 * Local API example using @supabase/server (optional).
 * Start: node server/dev-api.mjs
 * Uses .env — never expose SUPABASE_SECRET_KEY to the browser.
 */
import "../scripts/load-env.mjs";
import http from "node:http";
import { createAdminClient, verifyAuth, createContextClient } from "@supabase/server/core";

const PORT = Number(process.env.PORT) || 8787;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, apikey");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.url === "/games" && req.method === "GET") {
    try {
      const supabase = createContextClient();
      const { data, error } = await supabase.from("games").select("*").order("sort_order");
      if (error) throw error;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (req.url === "/admin/games" && req.method === "POST") {
    try {
      const { data: auth, error: authErr } = await verifyAuth(req, { auth: "user" });
      if (authErr || !auth) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
      const ctx = createContextClient({ auth: { token: auth.token, keyName: auth.keyName } });
      const { data: profile } = await ctx
        .from("admin_profiles")
        .select("user_id")
        .maybeSingle();
      if (!profile) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not an admin" }));
        return;
      }
      const body = await readBody(req);
      const admin = createAdminClient();
      const { data, error } = await admin.from("games").insert(JSON.parse(body)).select();
      if (error) throw error;
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

server.listen(PORT, () => {
  console.log(`Game On dev API http://localhost:${PORT} (GET /games, POST /admin/games with JWT)`);
});
