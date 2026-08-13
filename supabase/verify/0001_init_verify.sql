-- Sunmoa Task 5 post-migration verification.
-- Run with a service-role/admin SQL session on the intended Supabase project.
-- The transaction rolls back the sample row and leaves no test data behind.

-- 1. Verify the two public tables exist and RLS is enabled.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('notices', 'push_subscriptions')
order by tablename;

-- 2. Verify the intended public-read policy exists only on notices.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual
from pg_policies
where schemaname = 'public'
  and tablename in ('notices', 'push_subscriptions')
order by tablename, policyname;

-- 3. Verify service-role insert and the (board, ntt_sn) duplicate constraint.
begin;

insert into public.notices (
  board,
  ntt_sn,
  title,
  author,
  posted_at,
  url
)
values (
  'academic',
  900000001,
  'Sunmoa migration verification',
  'system',
  current_date,
  'https://example.com/sunmoa-verification'
)
on conflict (board, ntt_sn) do nothing;

select
  board,
  ntt_sn,
  title,
  posted_at,
  url
from public.notices
where board = 'academic'
  and ntt_sn = 900000001;

-- Same source identifier must not create a second row.
insert into public.notices (
  board,
  ntt_sn,
  title,
  author,
  posted_at,
  url
)
values (
  'academic',
  900000001,
  'duplicate should not persist',
  'system',
  current_date,
  'https://example.com/sunmoa-verification'
)
on conflict (board, ntt_sn) do nothing;

select count(*) as duplicate_protection_count
from public.notices
where board = 'academic'
  and ntt_sn = 900000001;

rollback;

-- 4. Separately verify the browser boundary with the anon key:
--    a) select from notices succeeds;
--    b) insert/update/delete on notices fails with an RLS permission error;
--    c) select/insert/update/delete on push_subscriptions fails with an RLS permission error.
-- Do not use the service-role key for those browser-boundary checks.
