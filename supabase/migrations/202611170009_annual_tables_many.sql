-- A category of a tournament can add to several annual tables at once: "Mayores" may
-- count for "Tabla anual Mayores 2026" and for "Copa de invierno 2026". The single link
-- on each tournament-category becomes a list; existing links are kept.
begin;

create table public.tournament_category_annual (
  -- Only so the audit log can name each link.
  id uuid not null unique default gen_random_uuid(),
  tournament_id uuid not null,
  category_id uuid not null,
  annual_table_id uuid not null references public.annual_tables(id),
  primary key (tournament_id, category_id, annual_table_id),
  -- Removing a category from a tournament (or deleting it) drops its links too.
  foreign key (tournament_id, category_id)
    references public.tournament_category_links(tournament_id, category_id) on delete cascade
);
create index tournament_category_annual_table on public.tournament_category_annual (annual_table_id);
insert into public.tournament_category_annual(tournament_id, category_id, annual_table_id)
  select tournament_id, category_id, annual_table_id from public.tournament_category_links
  where annual_table_id is not null;

alter table public.tournament_category_annual enable row level security;
revoke all on public.tournament_category_annual from public, anon, authenticated;
grant all on public.tournament_category_annual to service_role;
-- Read and written only through the functions below.
create policy tournament_category_annual_deny_read on public.tournament_category_annual
  for select to anon, authenticated using (false);
create policy tournament_category_annual_deny_insert on public.tournament_category_annual
  for insert to anon, authenticated with check (false);
create policy tournament_category_annual_deny_update on public.tournament_category_annual
  for update to anon, authenticated using (false) with check (false);
create policy tournament_category_annual_deny_delete on public.tournament_category_annual
  for delete to anon, authenticated using (false);
create trigger tournament_category_annual_audit after insert or update or delete on public.tournament_category_annual
  for each row execute function private.audit_change();

-- Admin -------------------------------------------------------------------------------

create or replace function public.annual_table_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  return coalesce((select jsonb_agg(to_jsonb(a) order by a.archived_at is not null, a.year desc, lower(a.name)) from (
    select a.id, a.name, a.year, a.archived_at, a.updated_at,
      (select count(distinct t.id) from public.tournament_category_annual x
        join public.tournaments t on t.id = x.tournament_id
        where x.annual_table_id = a.id and t.status <> 'archived') as tournaments,
      (select count(distinct t.id) from public.tournament_category_annual x
        join public.tournaments t on t.id = x.tournament_id
        where x.annual_table_id = a.id and t.status = 'finished') as finished,
      -- Entries that cannot add up because they have no person behind them.
      (select count(*) from public.tournament_category_annual x
        join public.tournaments t on t.id = x.tournament_id
        join public.tournament_participants p on p.tournament_id = x.tournament_id and p.category_id = x.category_id
        where x.annual_table_id = a.id and t.status = 'finished'
          and p.deleted_at is null and p.angler_id is null) as unlinked
    from public.annual_tables a order by a.archived_at is not null, a.year desc, lower(a.name) limit 200
  ) a), '[]'::jsonb);
end;
$$;

-- p_data.annual_tables maps category ids to a list of table ids ([] adds to none).
-- A single id or null is accepted too, as the previous panel sent. Categories left out
-- keep what was saved, and so does a panel that sends no map.
create or replace function private.set_tournament_annual(p_tournament uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare entry record; wanted uuid[];
begin
  if not p_data ? 'annual_tables' then return; end if;
  if jsonb_typeof(p_data->'annual_tables') is distinct from 'object' then
    raise exception 'Elegí las tablas anuales de cada categoría' using errcode = '22023';
  end if;
  for entry in select key::uuid as category_id, value from jsonb_each(p_data->'annual_tables') loop
    wanted := case jsonb_typeof(entry.value)
      when 'array' then (select coalesce(array_agg(distinct nullif(btrim(v), '')::uuid)
          filter (where nullif(btrim(v), '') is not null), '{}')
        from jsonb_array_elements_text(entry.value) v)
      when 'string' then case when nullif(btrim(entry.value #>> '{}'), '') is null then '{}'::uuid[]
        else array[btrim(entry.value #>> '{}')::uuid] end
      else '{}'::uuid[] end;
    if cardinality(wanted) > 10 then
      raise exception 'Elegí hasta 10 tablas anuales por categoría' using errcode = '22023';
    end if;
    if not exists (select 1 from public.tournament_category_links l
        where l.tournament_id = p_tournament and l.category_id = entry.category_id) then
      continue;
    end if;
    -- New links need an active table; links already saved may keep an archived one.
    if exists (select 1 from unnest(wanted) w(id) where not exists (
        select 1 from public.annual_tables a where a.id = w.id and (a.archived_at is null
          or exists (select 1 from public.tournament_category_annual x where x.tournament_id = p_tournament
            and x.category_id = entry.category_id and x.annual_table_id = a.id)))) then
      raise exception 'La tabla anual no existe o está archivada' using errcode = '22023';
    end if;
    delete from public.tournament_category_annual where tournament_id = p_tournament
      and category_id = entry.category_id and not (annual_table_id = any(wanted));
    insert into public.tournament_category_annual(tournament_id, category_id, annual_table_id)
      select p_tournament, entry.category_id, unnest(wanted) on conflict do nothing;
  end loop;
end;
$$;

-- Each category carries the annual tables it adds to; harmless on the site.
create or replace function private.tournament_categories_json(p_tournament uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name,
    'annual_tables', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name)
        order by a.year desc, lower(a.name))
      from public.tournament_category_annual x join public.annual_tables a on a.id = x.annual_table_id
      where x.tournament_id = p_tournament and x.category_id = c.id), '[]'::jsonb),
    'participants', (select count(*) from public.tournament_participants p where p.tournament_id = p_tournament
      and p.category_id = c.id and p.deleted_at is null)) order by lower(c.name)), '[]'::jsonb)
  from public.tournament_category_links l join public.tournament_categories c on c.id = l.category_id
  where l.tournament_id = p_tournament
$$;

-- Site ----------------------------------------------------------------------------------

create or replace function public.annual_tables_public() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(a) order by a.year desc, lower(a.name)), '[]'::jsonb) from (
    select a.id, a.name, a.year,
      (select count(distinct t.id) from public.tournament_category_annual x
        join public.tournaments t on t.id = x.tournament_id
        where x.annual_table_id = a.id and t.status = 'finished') as finished
    from public.annual_tables a where a.archived_at is null
    order by a.year desc, lower(a.name) limit 50
  ) a
$$;

create or replace function public.annual_table_get(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', a.id, 'name', a.name, 'year', a.year,
    'categories', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by lower(c.name))
      from public.tournament_categories c where exists (select 1 from public.tournament_category_annual x
        join public.tournaments t on t.id = x.tournament_id
        where x.category_id = c.id and x.annual_table_id = a.id
          and t.status in ('published','finished'))), '[]'::jsonb),
    'tournaments', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name,
        'starts_on', t.starts_on, 'finished', t.status = 'finished') order by t.starts_on, t.id)
      from public.tournaments t where t.status in ('published','finished') and exists (
        select 1 from public.tournament_category_annual x
        where x.tournament_id = t.id and x.annual_table_id = a.id)), '[]'::jsonb))
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
    join public.tournament_category_annual x on x.annual_table_id = a.id and x.category_id = p_category
    join public.tournaments t on t.id = x.tournament_id and t.status = 'finished'
    join public.tournament_participants p on p.tournament_id = x.tournament_id and p.category_id = p_category
      and p.deleted_at is null and p.angler_id is not null
    join public.anglers n on n.id = p.angler_id
    where a.id = p_table and a.archived_at is null
    group by n.id, n.first_name, n.last_name
    order by points desc, lower(private.angler_display(n.first_name, n.last_name)), n.id
    limit 500
  ) r
$$;

-- Nothing reads the single link any more.
drop index public.tournament_category_links_annual;
alter table public.tournament_category_links drop column annual_table_id;

commit;
