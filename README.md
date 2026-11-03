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

### GitHub Pages (auto deploy)

On push to **`main`**, [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds and deploys to Pages.

**One-time repo setup**

1. **Settings → Pages → Build and deployment** → Source: **GitHub Actions**
2. **Settings → Secrets and variables → Actions** → **Repository secrets** (same names as local `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`  
   (If you use **Environments**, add the same secrets on the `github-pages` environment or rely on repo-level secrets.)

3. Push to `main` (or run **Actions → Deploy GitHub Pages** manually).

Live site: **https://dlcsports.github.io/game-on/**

Local Pages build: `npm run build:pages`

## Setup Supabase

Copy `.env.example` → `.env` and fill in **Project Settings → API Keys** (URL, publishable, secret, JWKS for CLI scripts).

Never commit `.env` or expose `SUPABASE_SECRET_KEY` in the browser.

### Database

**Recommended:** `npm run db:bootstrap`

Or run `supabase/setup-all.sql` in the SQL Editor, then `npm run db:seed`.

For CLI schema apply, use a **Session pooler** URI in `SUPABASE_DB_URL` (see `.env.example`) — not direct `db.*.supabase.co` on IPv4-only networks.

### Admin auth

1. **Authentication** → create a user  
2. SQL Editor → `supabase/admin-first-user.sql` (insert UUID into `admin_profiles`)

Admin UI: **`/admin`** — sign in with that user; edits write to `games` and `houses` via RLS.

Optional: `npm run dev:api` → `GET http://localhost:8787/games`

## Repo layout

```
src/           React app (routes, admin, Supabase client)
css/           Theme styles
supabase/      SQL schema, seed, admin setup
scripts/       db:setup, db:seed, db:bootstrap
server/        Optional dev API
.github/       Pages deploy workflow
```
