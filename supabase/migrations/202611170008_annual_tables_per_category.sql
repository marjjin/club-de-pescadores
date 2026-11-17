-- Each category of a tournament chooses its own annual table: "Mayores" can add to
-- "Tabla anual Mayores 2026" and "Seniors" to "Tabla anual Seniors 2026". The link moves
-- from the tournament (plus a per-category flag) to the tournament-category link itself.
-- Existing links are kept: every category that counted keeps adding to the same table.
begin;

alter table public.tournament_category_links
  add column annual_table_id uuid references public.annual_tables(id);
create index tournament_category_links_annual on public.tournament_category_links (annual_table_id)
  where annual_table_id is not null;
update public.tournament_category_links l set annual_table_id = t.annual_table_id
  from public.tournaments t
  where t.id = l.tournament_id and t.annual_table_id is not null and l.counts_annual;

-- Admin -------------------------------------------------------------------------------

create or replace function public.annual_table_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  return coalesce((select jsonb_agg(to_jsonb(a) order by a.archived_at is not null, a.year desc, lower(a.name)) from (
    select a.id, a.name, a.year, a.archived_at, a.updated_at,
      (select count(distinct t.id) from public.tournament_category_links l
        join public.tournaments t on t.id = l.tournament_id
        where l.annual_table_id = a.id and t.status <> 'archived') as tournaments,
      (select count(distinct t.id) from public.tournament_category_links l
        join public.tournaments t on t.id = l.tournament_id
        where l.annual_table_id = a.id and t.status = 'finished') as finished,
      -- Entries that cannot add up because they have no person behind them.
      (select count(*) from public.tournament_category_links l
        join public.tournaments t on t.id = l.tournament_id
        join public.tournament_participants p on p.tournament_id = l.tournament_id and p.category_id = l.category_id
        where l.annual_table_id = a.id and t.status = 'finished'
          and p.deleted_at is null and p.angler_id is null) as unlinked
    from public.annual_tables a order by a.archived_at is not null, a.year desc, lower(a.name) limit 200
  ) a), '[]'::jsonb);
end;
$$;

-- p_data.annual_tables maps category ids to a table id (or null to stop adding up).
-- Categories left out keep what was saved, and so does a panel that sends no map.
create or replace function private.set_tournament_annual(p_tournament uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare entry record; wanted uuid;
begin
  if not p_data ? 'annual_tables' then return; end if;
  if jsonb_typeof(p_data->'annual_tables') is distinct from 'object' then
    raise exception 'Elegí la tabla anual de cada categoría' using errcode = '22023';
  end if;
  for entry in select key::uuid as category_id, value from jsonb_each(p_data->'annual_tables') loop
    wanted := case when jsonb_typeof(entry.value) = 'string'
      then nullif(btrim(entry.value #>> '{}'), '')::uuid end;
    if wanted is not null and not exists (select 1 from public.annual_tables a where a.id = wanted
        and (a.archived_at is null or exists (select 1 from public.tournament_category_links l
          where l.tournament_id = p_tournament and l.category_id = entry.category_id
            and l.annual_table_id = a.id))) then
      raise exception 'La tabla anual no existe o está archivada' using errcode = '22023';
    end if;
    update public.tournament_category_links set annual_table_id = wanted
      where tournament_id = p_tournament and category_id = entry.category_id
        and annual_table_id is distinct from wanted;
  end loop;
end;
$$;

-- Each category carries the annual table it adds to; harmless on the site.
create or replace function private.tournament_categories_json(p_tournament uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name,
    'annual_table_id', l.annual_table_id, 'annual_table_name', a.name,
    'participants', (select count(*) from public.tournament_participants p where p.tournament_id = p_tournament
      and p.category_id = c.id and p.deleted_at is null)) order by lower(c.name)), '[]'::jsonb)
  from public.tournament_category_links l join public.tournament_categories c on c.id = l.category_id
  left join public.annual_tables a on a.id = l.annual_table_id
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
        (select count(*) from public.tournament_participants p
          where p.tournament_id = t.id and p.deleted_at is null) as participants,
        private.tournament_categories_json(t.id) as categories
      from public.tournaments t
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
      t.created_at, t.updated_at,
      (select count(*) from public.tournament_participants p
        where p.tournament_id = t.id and p.deleted_at is null) as participants,
      private.tournament_categories_json(t.id) as categories
    from public.tournaments t where t.id = p_id) row);
end;
$$;

-- Site ----------------------------------------------------------------------------------

create or replace function public.annual_tables_public() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(a) order by a.year desc, lower(a.name)), '[]'::jsonb) from (
    select a.id, a.name, a.year,
      (select count(distinct t.id) from public.tournament_category_links l
        join public.tournaments t on t.id = l.tournament_id
        where l.annual_table_id = a.id and t.status = 'finished') as finished
    from public.annual_tables a where a.archived_at is null
    order by a.year desc, lower(a.name) limit 50
  ) a
$$;

create or replace function public.annual_table_get(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', a.id, 'name', a.name, 'year', a.year,
    'categories', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by lower(c.name))
      from public.tournament_categories c where exists (select 1 from public.tournament_category_links l
        join public.tournaments t on t.id = l.tournament_id
        where l.category_id = c.id and l.annual_table_id = a.id
          and t.status in ('published','finished'))), '[]'::jsonb),
    'tournaments', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name,
        'starts_on', t.starts_on, 'finished', t.status = 'finished') order by t.starts_on, t.id)
      from public.tournaments t where t.status in ('published','finished') and exists (
        select 1 from public.tournament_category_links l
        where l.tournament_id = t.id and l.annual_table_id = a.id)), '[]'::jsonb))
  from public.annual_tables a where a.id = p_id and a.archived_at is null
$$;

create or replace function public.annual_standings(p_table uuid, p_category uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('display_name', r.display_name, 'points', r.points,
    'tournaments', r.tournaments, 'ranking', r.ranking) order by r.points desc, lower(r.display_name)), '[]'::jsonb)
  from (
    select private.angler_display(n.first_name, n.last_name) as display_name,
      sum(p.points)::integer as points, count(distinct p.tournament_id)::integer as tournaments,
      rank() over (order by sum(p.points) desc)::integer as ranking
    from public.annual_tables a
    join public.tournament_category_links l on l.annual_table_id = a.id and l.category_id = p_category
    join public.tournaments t on t.id = l.tournament_id and t.status = 'finished'
    join public.tournament_participants p on p.tournament_id = l.tournament_id and p.category_id = p_category
      and p.deleted_at is null and p.angler_id is not null
    join public.anglers n on n.id = p.angler_id
    where a.id = p_table and a.archived_at is null
    group by n.id, n.first_name, n.last_name
    order by points desc, lower(private.angler_display(n.first_name, n.last_name)), n.id
    limit 500
  ) r
$$;

-- Nothing reads the tournament-wide link any more.
drop index public.tournaments_annual_table;
alter table public.tournaments drop column annual_table_id;
alter table public.tournament_category_links drop column counts_annual;

commit;
