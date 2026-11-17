-- Annual tables: a named season ("Campeonato anual 2026") that adds up the points of the
-- finished tournaments linked to it, with one table per category: what someone scores in
-- "Mayores" adds to the annual "Mayores" table. People are matched through the registry,
-- so entries without a person ("Sin ficha") do not add up until they are linked.
-- Standings are computed on read: fixing a tournament fixes the annual table too.
begin;

create table public.annual_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 3 and 120),
  year integer not null check (year between 2000 and 2100),
  -- Archived tables leave the site and cannot take new tournaments.
  archived_at timestamptz,
  created_by uuid not null references public.admin_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index annual_tables_name on public.annual_tables (year, lower(btrim(name)));

alter table public.tournaments add column annual_table_id uuid references public.annual_tables(id);
create index tournaments_annual_table on public.tournaments (annual_table_id)
  where annual_table_id is not null;
-- Which categories of a linked tournament add to the annual table; all of them by default.
alter table public.tournament_category_links add column counts_annual boolean not null default true;

alter table public.annual_tables enable row level security;
revoke all on public.annual_tables from public, anon, authenticated;
grant all on public.annual_tables to service_role;
-- Read and written only through the functions below.
create policy annual_tables_deny_read on public.annual_tables for select to anon, authenticated using (false);
create policy annual_tables_deny_insert on public.annual_tables for insert to anon, authenticated with check (false);
create policy annual_tables_deny_update on public.annual_tables for update to anon, authenticated
  using (false) with check (false);
create policy annual_tables_deny_delete on public.annual_tables for delete to anon, authenticated using (false);
create trigger annual_tables_updated before update on public.annual_tables
  for each row execute function public.set_content_updated_at();
create trigger annual_tables_audit after insert or update or delete on public.annual_tables
  for each row execute function private.audit_change();

-- Admin -------------------------------------------------------------------------------

create function public.annual_table_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  return coalesce((select jsonb_agg(to_jsonb(a) order by a.archived_at is not null, a.year desc, lower(a.name)) from (
    select a.id, a.name, a.year, a.archived_at, a.updated_at,
      (select count(*) from public.tournaments t
        where t.annual_table_id = a.id and t.status <> 'archived') as tournaments,
      (select count(*) from public.tournaments t
        where t.annual_table_id = a.id and t.status = 'finished') as finished,
      -- Entries that cannot add up because they have no person behind them.
      (select count(*) from public.tournaments t
        join public.tournament_category_links l on l.tournament_id = t.id and l.counts_annual
        join public.tournament_participants p on p.tournament_id = t.id and p.category_id = l.category_id
        where t.annual_table_id = a.id and t.status = 'finished'
          and p.deleted_at is null and p.angler_id is null) as unlinked
    from public.annual_tables a order by a.archived_at is not null, a.year desc, lower(a.name) limit 200
  ) a), '[]'::jsonb);
end;
$$;

create function public.annual_table_save(p_name text, p_year integer, p_id uuid default null,
  p_version timestamptz default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare previous public.annual_tables; table_id uuid;
begin
  perform private.require_permission('torneos.gestionar');
  if p_id is null then
    insert into public.annual_tables(name, year, created_by)
      values (btrim(p_name), p_year, (select auth.uid())) returning id into table_id;
    return table_id;
  end if;
  select * into previous from public.annual_tables where id = p_id for update;
  if not found then raise exception 'No existe la tabla anual' using errcode = 'P0002'; end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'La tabla anual cambió. Actualizá antes de guardar.' using errcode = '40001';
  end if;
  update public.annual_tables set name = btrim(p_name), year = p_year where id = p_id;
  return p_id;
end;
$$;

create function public.annual_table_archive(p_id uuid, p_archived boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.gestionar');
  update public.annual_tables
    set archived_at = case when p_archived then coalesce(archived_at, now()) end where id = p_id;
  if not found then raise exception 'No existe la tabla anual' using errcode = 'P0002'; end if;
end;
$$;

-- Links a tournament to an annual table and chooses which of its categories count.
-- Keys left out of p_data keep what was saved, so older panels change nothing.
create function private.set_tournament_annual(p_tournament uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare wanted uuid; counting uuid[];
begin
  if p_data ? 'annual_table' then
    wanted := nullif(btrim(coalesce(p_data->>'annual_table', '')), '')::uuid;
    if wanted is not null and not exists (select 1 from public.annual_tables a where a.id = wanted
        and (a.archived_at is null or exists (select 1 from public.tournaments t
          where t.id = p_tournament and t.annual_table_id = a.id))) then
      raise exception 'La tabla anual no existe o está archivada' using errcode = '22023';
    end if;
    update public.tournaments set annual_table_id = wanted
      where id = p_tournament and annual_table_id is distinct from wanted;
  end if;
  if p_data ? 'annual_categories' then
    if jsonb_typeof(p_data->'annual_categories') is distinct from 'array'
        or jsonb_array_length(p_data->'annual_categories') > 10 then
      raise exception 'Elegí qué categorías suman a la tabla anual' using errcode = '22023';
    end if;
    select coalesce(array_agg(value::uuid), '{}') into counting
      from jsonb_array_elements_text(p_data->'annual_categories');
    update public.tournament_category_links set counts_annual = (category_id = any(counting))
      where tournament_id = p_tournament and counts_annual is distinct from (category_id = any(counting));
  end if;
end;
$$;

create or replace function public.tournament_save(p_data jsonb, p_id uuid default null, p_version timestamptz default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare input public.tournaments; previous public.tournaments; tournament_id uuid;
begin
  perform private.require_permission('torneos.gestionar');
  input := private.tournament_data(p_data);
  if p_id is null then
    insert into public.tournaments(name, place, starts_on, ends_on, start_time, description, created_by)
      values (input.name, input.place, input.starts_on, input.ends_on, input.start_time, input.description,
        (select auth.uid()))
      returning id into tournament_id;
    -- Older panels send no categories: those tournaments go to "General".
    perform private.set_tournament_categories(tournament_id, coalesce(p_data->'categories',
      (select jsonb_build_array(id) from public.tournament_categories where lower(name) = 'general')));
    perform private.set_tournament_annual(tournament_id, p_data);
    return tournament_id;
  end if;
  select * into previous from public.tournaments where id = p_id for update;
  if not found or previous.status = 'archived' then
    raise exception 'No existe el torneo' using errcode = 'P0002';
  end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'El torneo cambió. Actualizá antes de guardar.' using errcode = '40001';
  end if;
  -- Older panels send no description: keep the saved one instead of erasing it.
  update public.tournaments set name = input.name, place = input.place,
    starts_on = input.starts_on, ends_on = input.ends_on, start_time = input.start_time,
    description = case when p_data ? 'description' then input.description else previous.description end
    where id = p_id;
  if p_data ? 'categories' then perform private.set_tournament_categories(p_id, p_data->'categories'); end if;
  perform private.set_tournament_annual(p_id, p_data);
  return p_id;
end;
$$;

-- "annual" says whether the category adds to the annual table; harmless on the site.
create or replace function private.tournament_categories_json(p_tournament uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'annual', l.counts_annual,
    'participants', (select count(*) from public.tournament_participants p where p.tournament_id = p_tournament
      and p.category_id = c.id and p.deleted_at is null)) order by lower(c.name)), '[]'::jsonb)
  from public.tournament_category_links l join public.tournament_categories c on c.id = l.category_id
  where l.tournament_id = p_tournament
$$;

create or replace function public.tournament_admin_list(p_before timestamptz default null, p_id uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  return coalesce((
    select jsonb_agg(to_jsonb(page) order by page.created_at desc, page.id desc) from (
      select t.id, t.name, t.place, t.starts_on, t.ends_on, t.start_time, t.status, t.created_at, t.updated_at,
        t.annual_table_id, a.name as annual_table_name,
        (select count(*) from public.tournament_participants p
          where p.tournament_id = t.id and p.deleted_at is null) as participants,
        private.tournament_categories_json(t.id) as categories
      from public.tournaments t left join public.annual_tables a on a.id = t.annual_table_id
      where p_before is null or (t.created_at, t.id) < (p_before, p_id)
      order by t.created_at desc, t.id desc limit 20
    ) page), '[]'::jsonb);
end;
$$;

create or replace function public.tournament_admin_get(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  return (select to_jsonb(row) from (
    select t.id, t.name, t.place, t.starts_on, t.ends_on, t.start_time, t.description, t.status,
      t.created_at, t.updated_at, t.annual_table_id, a.name as annual_table_name,
      (select count(*) from public.tournament_participants p
        where p.tournament_id = t.id and p.deleted_at is null) as participants,
      private.tournament_categories_json(t.id) as categories
    from public.tournaments t left join public.annual_tables a on a.id = t.annual_table_id
    where t.id = p_id) row);
end;
$$;

-- Site ----------------------------------------------------------------------------------

create function public.annual_tables_public() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(a) order by a.year desc, lower(a.name)), '[]'::jsonb) from (
    select a.id, a.name, a.year,
      (select count(*) from public.tournaments t
        where t.annual_table_id = a.id and t.status = 'finished') as finished
    from public.annual_tables a where a.archived_at is null
    order by a.year desc, lower(a.name) limit 50
  ) a
$$;

-- A visible table with its categories and the visible tournaments linked to it.
create function public.annual_table_get(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', a.id, 'name', a.name, 'year', a.year,
    'categories', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by lower(c.name))
      from public.tournament_categories c where exists (select 1 from public.tournament_category_links l
        join public.tournaments t on t.id = l.tournament_id
        where l.category_id = c.id and l.counts_annual and t.annual_table_id = a.id
          and t.status in ('published','finished'))), '[]'::jsonb),
    'tournaments', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name,
        'starts_on', t.starts_on, 'finished', t.status = 'finished') order by t.starts_on, t.id)
      from public.tournaments t where t.annual_table_id = a.id and t.status in ('published','finished')), '[]'::jsonb))
  from public.annual_tables a where a.id = p_id and a.archived_at is null
$$;

-- Each person's points added up over the finished tournaments, in one category.
-- A club season has a few hundred people at most; the list is bounded anyway.
create function public.annual_standings(p_table uuid, p_category uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('display_name', r.display_name, 'points', r.points,
    'tournaments', r.tournaments, 'ranking', r.ranking) order by r.points desc, lower(r.display_name)), '[]'::jsonb)
  from (
    select private.angler_display(n.first_name, n.last_name) as display_name,
      sum(p.points)::integer as points, count(distinct p.tournament_id)::integer as tournaments,
      rank() over (order by sum(p.points) desc)::integer as ranking
    from public.annual_tables a
    join public.tournaments t on t.annual_table_id = a.id and t.status = 'finished'
    join public.tournament_category_links l on l.tournament_id = t.id and l.category_id = p_category
      and l.counts_annual
    join public.tournament_participants p on p.tournament_id = t.id and p.category_id = p_category
      and p.deleted_at is null and p.angler_id is not null
    join public.anglers n on n.id = p.angler_id
    where a.id = p_table and a.archived_at is null
    group by n.id, n.first_name, n.last_name
    order by points desc, lower(private.angler_display(n.first_name, n.last_name)), n.id
    limit 500
  ) r
$$;

revoke all on function public.annual_table_list(), public.annual_table_save(text, integer, uuid, timestamptz),
  public.annual_table_archive(uuid, boolean), public.annual_tables_public(), public.annual_table_get(uuid),
  public.annual_standings(uuid, uuid), private.set_tournament_annual(uuid, jsonb),
  public.tournament_save(jsonb, uuid, timestamptz), public.tournament_admin_list(timestamptz, uuid),
  public.tournament_admin_get(uuid)
  from public, anon, authenticated;
grant execute on function public.annual_table_list(), public.annual_table_save(text, integer, uuid, timestamptz),
  public.annual_table_archive(uuid, boolean), public.tournament_save(jsonb, uuid, timestamptz),
  public.tournament_admin_list(timestamptz, uuid), public.tournament_admin_get(uuid)
  to authenticated;
grant execute on function public.annual_tables_public(), public.annual_table_get(uuid),
  public.annual_standings(uuid, uuid) to anon, authenticated;

commit;
