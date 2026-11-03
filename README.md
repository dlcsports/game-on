# Game On

DLC Gaming Club score card — **React (Vite)** app with Supabase + admin login.

## React app

```bash
nvm use
cp .env.example .env   # set VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev            # http://localhost:5173
npm run build          # output → dist/
```

| Route | Page |
|-------|------|
| `/` | Outdoor |
| `/indoor` | Indoor |
| `/points` | Points table |
| `/house-standings` | House standings |
| `/admin` | Login + edit DB |

**GitHub Pages:** `GITHUB_PAGES=true npm run build` then deploy `dist/` (base path `/game-on/`).

Legacy static HTML under `outdoor.html`, `admin/`, etc. remains for reference; the React app is the main UI.

## Setup Supabase

### 1. Environment (server / CLI only)

Copy `.env.example` → `.env` and fill in values from **Project Settings → API Keys**:

```env
SUPABASE_URL=https://ngeolywmkqvscqxfgtrd.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_JWKS_URL=https://ngeolywmkqvscqxfgtrd.supabase.co/auth/v1/.well-known/jwks.json
```

Never commit `.env` or put `SUPABASE_SECRET_KEY` in the browser — only in Node scripts / backend.

### 2. Install server package (Node 22+)

```bash
nvm use    # .nvmrc → 22
npm install
```

Uses [`@supabase/server`](https://supabase.com/docs/reference/server) for admin seeding and optional `server/dev-api.mjs`.

### 3. Create tables + data

**Recommended:** `npm run db:bootstrap`  
Tries API seed first; if tables are missing, prints the [SQL Editor link](https://supabase.com/dashboard/project/ngeolywmkqvscqxfgtrd/sql/new) and runs `db:setup` only when `.env` has a **Session pooler** URL.

**Option A — SQL Editor (once):** paste and run `supabase/setup-all.sql`, then `npm run db:seed`.

**Option B — CLI (Session pooler, IPv4):**

Dashboard → **Connect** → **Session pooler** → copy URI into `.env`:

```env
SUPABASE_DB_URL=postgresql://postgres.ngeolywmkqvscqxfgtrd:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

- Username **`postgres.ngeolywmkqvscqxfgtrd`**, not `postgres`.
- Do **not** use `db.ngeolywmkqvscqxfgtrd.supabase.co` locally (IPv6-only → `ENOTFOUND` / `EHOSTUNREACH`).
- If the DB password contains `*`, `$`, `#`, or `@`, percent-encode it in the URL (`$` → `%24`).

```bash
npm run db:setup
npm run db:seed
```

### 4. Admin auth

1. **Authentication** → enable Email provider → create a user for your admin.
2. Copy that user’s UUID from **Authentication → Users**, then run:

```sql
insert into public.admin_profiles (user_id, email)
values ('PASTE_USER_UUID', 'admin@yourcompany.com');
```

3. Copy `js/config.example.js` → `js/config.js` and set **Project URL** and **publishable** key from **Project Settings → API**.

Public site reads from `games` and `houses`. Only rows in `admin_profiles` can sign in and edit data (RLS).

## Admin panel (login + edit database)

- URL: **`/admin/`** (local: `http://localhost:8080/admin/`)
- **Sign in** with Supabase Auth email/password
- Edit **games** (points, team sizes, outdoor/indoor) and **house standings**; **Save** writes to Supabase (RLS — admin only)
- Sections: Outdoor games · Indoor games · All games · House standings

**First admin user**

1. Dashboard → **Authentication** → **Users** → create user  
2. SQL Editor → run `supabase/admin-first-user.sql` (insert their UUID into `admin_profiles`)

Requires **`js/config.js`** with the same URL + publishable key as your project.

## Public pages

| Page | File |
|------|------|
| Outdoor | `index.html` |
| Indoor | `indoor.html` |
| Points table | `points.html` |
| House standings | `house-standings.html` |

If `js/config.js` is missing or empty, pages fall back to static `tables/*.html`.

## GitHub Pages

**Settings → Pages** → branch **main**, folder **`/ (root)`**.

Because `config.js` is gitignored, add keys for production using one of:

- Commit a production `config.js` in a private repo, or
- Use GitHub Actions to inject `config.js` on deploy, or
- Store only the anon key in a committed `config.js` (safe with RLS; never commit the service role key).

Optional backend smoke test: `npm run dev:api` → `GET http://localhost:8787/games`

## Repo layout

```
css/           Theme + admin styles
js/            Supabase client, data layer, public + admin logic
tables/        Static fallback HTML tables
supabase/      schema.sql, setup-all.sql, seed.sql
scripts/       db:setup, db:seed (@supabase/server admin client)
server/        dev-api.mjs example
admin/         Admin panel UI (browser; publishable key only)
```
