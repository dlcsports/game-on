-- Grant admin panel access to a Supabase Auth user (run in SQL Editor after creating the user).

-- 1. Supabase Dashboard → Authentication → Users → Add user (email + password)
-- 2. Copy that user's UUID, then run:

-- insert into public.admin_profiles (user_id, email)
-- values ('00000000-0000-0000-0000-000000000000', 'you@company.com');

-- List current admins:
select user_id, email, created_at from public.admin_profiles order by created_at;
