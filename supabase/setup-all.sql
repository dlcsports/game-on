-- Run this entire file once in Supabase → SQL Editor → Run
-- Project: https://supabase.com/dashboard/project/ngeolywmkqvscqxfgtrd

-- ========== SCHEMA (from schema.sql) ==========

create extension if not exists "pgcrypto";

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team_size text not null,
  teams_label text not null,
  winner_points integer not null check (winner_points >= 0),
  runner_up_points integer not null check (runner_up_points >= 0),
  category text not null check (category in ('outdoor', 'indoor')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  outdoor_points integer not null default 0 check (outdoor_points >= 0),
  indoor_points integer not null default 0 check (indoor_points >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_updated_at on public.games;
create trigger games_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

drop trigger if exists houses_updated_at on public.houses;
create trigger houses_updated_at
  before update on public.houses
  for each row execute function public.set_updated_at();

alter table public.games enable row level security;
alter table public.houses enable row level security;
alter table public.admin_profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles where user_id = auth.uid()
  );
$$;

drop policy if exists "games_public_read" on public.games;
create policy "games_public_read"
  on public.games for select to anon, authenticated using (true);

drop policy if exists "houses_public_read" on public.houses;
create policy "houses_public_read"
  on public.houses for select to anon, authenticated using (true);

drop policy if exists "games_admin_insert" on public.games;
create policy "games_admin_insert"
  on public.games for insert to authenticated with check (public.is_admin());

drop policy if exists "games_admin_update" on public.games;
create policy "games_admin_update"
  on public.games for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "games_admin_delete" on public.games;
create policy "games_admin_delete"
  on public.games for delete to authenticated using (public.is_admin());

drop policy if exists "houses_admin_insert" on public.houses;
create policy "houses_admin_insert"
  on public.houses for insert to authenticated with check (public.is_admin());

drop policy if exists "houses_admin_update" on public.houses;
create policy "houses_admin_update"
  on public.houses for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "houses_admin_delete" on public.houses;
create policy "houses_admin_delete"
  on public.houses for delete to authenticated using (public.is_admin());

drop policy if exists "admin_profiles_self_read" on public.admin_profiles;
create policy "admin_profiles_self_read"
  on public.admin_profiles for select to authenticated using (user_id = auth.uid());

-- ========== SEED DATA ==========

insert into public.games (name, team_size, teams_label, winner_points, runner_up_points, category, sort_order)
select * from (values
  ('Cricket', '6 players', '15 teams', 140, 70, 'outdoor', 1),
  ('Futsal', '6 players', '10 teams', 140, 70, 'outdoor', 2),
  ('Padel', '2 players', '20 teams', 60, 30, 'outdoor', 3),
  ('Badminton', '2 players', '20 teams', 60, 30, 'outdoor', 4),
  ('Table Tennis', '4 players', '16 teams', 80, 40, 'indoor', 1),
  ('Foosball', '2 players', '30 teams', 50, 25, 'indoor', 2),
  ('Carrom', '2 players', '12 teams', 40, 20, 'indoor', 3),
  ('Chess', '1 player', '20 players', 50, 25, 'indoor', 4)
) as v(name, team_size, teams_label, winner_points, runner_up_points, category, sort_order)
where not exists (select 1 from public.games limit 1);

insert into public.houses (name, outdoor_points, indoor_points, sort_order)
select * from (values
  ('House Phoenix', 0, 0, 1),
  ('House Falcon', 0, 0, 2),
  ('House Titan', 0, 0, 3),
  ('House Nova', 0, 0, 4)
) as v(name, outdoor_points, indoor_points, sort_order)
where not exists (select 1 from public.houses limit 1);

-- Verify (should show 8 and 4)
select 'games' as table_name, count(*) as rows from public.games
union all
select 'houses', count(*) from public.houses;
