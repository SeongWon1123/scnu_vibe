-- Sunmoa Task 5: notices and Web Push subscription storage.
-- Apply once through Supabase migrations or the SQL editor on the intended project.
-- This migration is intentionally fail-closed: do not edit a previously applied migration.

begin;

create table public.notices (
  id bigint generated always as identity primary key,
  board text not null check (
    board in ('general', 'academic', 'scholarship', 'event', 'recruit', 'dorm')
  ),
  ntt_sn bigint not null check (ntt_sn > 0),
  title text not null check (btrim(title) <> ''),
  author text not null default '',
  posted_at date not null,
  url text not null check (url like 'https://%'),
  is_pinned boolean not null default false,
  deadline date,
  created_at timestamptz not null default now(),
  constraint notices_board_ntt_sn_key unique (board, ntt_sn)
);

create index notices_posted_at_idx
  on public.notices (posted_at desc, id desc);

create index notices_board_posted_at_idx
  on public.notices (board, posted_at desc, id desc);

create table public.push_subscriptions (
  id bigint generated always as identity primary key,
  endpoint text not null check (btrim(endpoint) <> ''),
  p256dh text not null check (btrim(p256dh) <> ''),
  auth text not null check (btrim(auth) <> ''),
  keywords text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

alter table public.notices enable row level security;
alter table public.push_subscriptions enable row level security;

-- Start from explicit role privileges rather than Supabase defaults.
revoke all on table public.notices from public, anon, authenticated;
revoke all on table public.push_subscriptions from public, anon, authenticated;

grant select on table public.notices to anon, authenticated;
grant all on table public.notices to service_role;
grant all on table public.push_subscriptions to service_role;

-- Public feed reads are allowed. There are deliberately no anon/authenticated
-- insert, update, or delete policies for notices.
create policy notices_public_read
  on public.notices
  for select
  to anon, authenticated
  using (true);

-- push_subscriptions intentionally has no policies. Only service_role may access it.

comment on table public.notices is
  'Crawled SCNU announcements. Public read; server-side writes only.';
comment on table public.push_subscriptions is
  'Web Push endpoint and keyword data. Service-role access only.';

commit;
