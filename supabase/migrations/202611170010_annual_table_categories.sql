-- An annual table can preset the categories that add to it ("Tabla anual Mayores" takes
-- Mayores). The panel then links a tournament's categories to their tables on its own,
-- and new links must match those categories. A table without categories takes any.
-- Links saved before a table's categories changed are kept as they are.
begin;

create table public.annual_table_categories (
  -- Only so the audit log can name each preset.
  id uuid not null unique default gen_random_uuid(),
  annual_table_id uuid not null references public.annual_tables(id),
  category_id uuid not null references public.tournament_categories(id),
  primary key (annual_table_id, category_id)
);
create index annual_table_categories_category on public.annual_table_categories (category_id);

alter table public.annual_table_categories enable row level security;
revoke all on public.annual_table_categories from public, anon, authenticated;
grant all on public.annual_table_categories to service_role;
-- Read and written only through the functions below.
create policy annual_table_categories_deny_read on public.annual_table_categories
  for select to anon, authenticated using (false);
create policy annual_table_categories_deny_insert on public.annual_table_categories
  for insert to anon, authenticated with check (false);
create policy annual_table_categories_deny_update on public.annual_table_categories
  for update to anon, authenticated using (false) with check (false);
create policy annual_table_categories_deny_delete on public.annual_table_categories
  for delete to anon, authenticated using (false);
create trigger annual_table_categories_audit after insert or update or delete on public.annual_table_categories
  for each row execute function private.audit_change();

-- Admin -------------------------------------------------------------------------------

create or replace function public.annual_table_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  return coalesce((select jsonb_agg(to_jsonb(a) order by a.archived_at is not null, a.year desc, lower(a.name)) from (
    select a.id, a.name, a.year, a.archived_at, a.updated_at,
      coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by lower(c.name))
        from public.annual_table_categories ac join public.tournament_categories c on c.id = ac.category_id
        where ac.annual_table_id = a.id), '[]'::jsonb) as categories,
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

-- p_categories replaces the preset categories; null keeps them, so older panels
-- (which call with four arguments) change nothing.
drop function public.annual_table_save(text, integer, uuid, timestamptz);
create function public.annual_table_save(p_name text, p_year integer, p_id uuid default null,
  p_version timestamptz default null, p_categories jsonb default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare previous public.annual_tables; table_id uuid; wanted uuid[];
begin
  perform private.require_permission('torneos.gestionar');
  if p_categories is not null then
    if jsonb_typeof(p_categories) is distinct from 'array' or jsonb_array_length(p_categories) > 20 then
      raise exception 'Elegí hasta 20 categorías para la tabla anual' using errcode = '22023';
    end if;
    select coalesce(array_agg(distinct value::uuid), '{}') into wanted
      from jsonb_array_elements_text(p_categories);
    if exists (select 1 from unnest(wanted) w(id)
        where not exists (select 1 from public.tournament_categories c where c.id = w.id)) then
      raise exception 'Alguna categoría de la tabla anual no existe' using errcode = '22023';
    end if;
  end if;
  if p_id is null then
    insert into public.annual_tables(name, year, created_by)
      values (btrim(p_name), p_year, (select auth.uid())) returning id into table_id;
  else
    select * into previous from public.annual_tables where id = p_id for update;
    if not found then raise exception 'No existe la tabla anual' using errcode = 'P0002'; end if;
    if p_version is null or previous.updated_at <> p_version then
      raise exception 'La tabla anual cambió. Actualizá antes de guardar.' using errcode = '40001';
    end if;
    table_id := p_id;
    -- Touch the row even if only the categories change, so the version moves on.
    update public.annual_tables set name = btrim(p_name), year = p_year, updated_at = now() where id = p_id;
  end if;
  if wanted is not null then
    delete from public.annual_table_categories where annual_table_id = table_id
      and not (category_id = any(wanted));
    insert into public.annual_table_categories(annual_table_id, category_id)
      select table_id, unnest(wanted) on conflict do nothing;
  end if;
  return table_id;
end;
$$;

-- Same as before, plus: a new link must match the table's preset categories, if any.
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
    -- New links need an active table that takes this category; saved links are kept.
    if exists (select 1 from unnest(wanted) w(id) where not exists (
        select 1 from public.tournament_category_annual x where x.tournament_id = p_tournament
          and x.category_id = entry.category_id and x.annual_table_id = w.id)
      and not exists (select 1 from public.annual_tables a where a.id = w.id and a.archived_at is null
        and (not exists (select 1 from public.annual_table_categories ac where ac.annual_table_id = a.id)
          or exists (select 1 from public.annual_table_categories ac where ac.annual_table_id = a.id
            and ac.category_id = entry.category_id)))) then
      raise exception 'La tabla anual no existe, está archivada o no suma esa categoría' using errcode = '22023';
    end if;
    delete from public.tournament_category_annual where tournament_id = p_tournament
      and category_id = entry.category_id and not (annual_table_id = any(wanted));
    insert into public.tournament_category_annual(tournament_id, category_id, annual_table_id)
      select p_tournament, entry.category_id, unnest(wanted) on conflict do nothing;
  end loop;
end;
$$;

revoke all on function public.annual_table_save(text, integer, uuid, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.annual_table_save(text, integer, uuid, timestamptz, jsonb) to authenticated;

commit;
