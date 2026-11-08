begin;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  starts_at timestamptz not null,
  place text not null check (char_length(btrim(place)) between 1 and 200),
  is_published boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  excerpt text not null check (char_length(btrim(excerpt)) between 1 and 1200),
  published_at timestamptz not null default now(),
  image_url text not null check (char_length(image_url) <= 2048 and image_url ~ '^https://[^[:space:]]+$'),
  image_alt text not null check (char_length(btrim(image_alt)) between 1 and 300),
  is_published boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pool_rates (
  id uuid primary key default gen_random_uuid(),
  season text not null check (char_length(btrim(season)) between 1 and 120),
  period text not null check (char_length(btrim(period)) between 1 and 120),
  family_price_cents integer not null check (family_price_cents >= 0),
  individual_price_cents integer not null check (individual_price_cents >= 0),
  family_description text not null check (char_length(btrim(family_description)) between 1 and 300),
  discount_note text check (discount_note is null or char_length(btrim(discount_note)) between 1 and 500),
  valid_from date not null,
  valid_until date,
  is_published boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until >= valid_from)
);

create index events_public_schedule_idx on public.events (starts_at, id)
  where is_published and deleted_at is null;
create index news_public_feed_idx on public.news (published_at desc, id desc)
  where is_published and deleted_at is null;
create index pool_rates_public_period_idx on public.pool_rates (valid_from, id)
  where is_published and deleted_at is null;

create function public.set_content_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_content_updated_at() from public, anon, authenticated;

create trigger events_updated_at before update on public.events
  for each row execute function public.set_content_updated_at();
create trigger news_updated_at before update on public.news
  for each row execute function public.set_content_updated_at();
create trigger pool_rates_updated_at before update on public.pool_rates
  for each row execute function public.set_content_updated_at();

alter table public.events enable row level security;
alter table public.news enable row level security;
alter table public.pool_rates enable row level security;

-- Public content has no browser writes, including authenticated accounts.
-- A future admin panel needs its own approved permissions and migrations.
revoke all on public.events, public.news, public.pool_rates from public, anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.events, public.news, public.pool_rates to anon, authenticated;
grant all on public.events, public.news, public.pool_rates to service_role;

create policy events_read_published on public.events for select to anon, authenticated
  using (is_published and deleted_at is null);
create policy news_read_published on public.news for select to anon, authenticated
  using (is_published and deleted_at is null and published_at <= now());
create policy pool_rates_read_published on public.pool_rates for select to anon, authenticated
  using (is_published and deleted_at is null and
    (valid_until is null or valid_until >= (now() at time zone 'America/Argentina/Buenos_Aires')::date));

create policy events_deny_insert on public.events for insert to anon, authenticated with check (false);
create policy events_deny_update on public.events for update to anon, authenticated using (false) with check (false);
create policy events_deny_delete on public.events for delete to anon, authenticated using (false);
create policy news_deny_insert on public.news for insert to anon, authenticated with check (false);
create policy news_deny_update on public.news for update to anon, authenticated using (false) with check (false);
create policy news_deny_delete on public.news for delete to anon, authenticated using (false);
create policy pool_rates_deny_insert on public.pool_rates for insert to anon, authenticated with check (false);
create policy pool_rates_deny_update on public.pool_rates for update to anon, authenticated using (false) with check (false);
create policy pool_rates_deny_delete on public.pool_rates for delete to anon, authenticated using (false);

comment on table public.events is 'Public event schedule. Manage content with trusted server/database access.';
comment on table public.news is 'Public news feed; drafts, future releases and deleted articles are private.';
comment on table public.pool_rates is 'Published pool rates in ARS cents. Expired and deleted rates are private.';

commit;
