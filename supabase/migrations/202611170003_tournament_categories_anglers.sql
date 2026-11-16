-- Tournament categories (Senior, Cadetes...) with one leaderboard each, and a registry
-- of people reused across tournaments. A person may compete in several categories of
-- the same tournament, each entry with its own points.
-- Ley 25.326: the DNI only identifies people for staff. It is never published, it is
-- masked in listings and in the audit log, and only participant staff can read it.
begin;

create table public.tournament_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  -- Archived categories cannot be added to tournaments; existing ones keep them.
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index tournament_categories_name on public.tournament_categories (lower(btrim(name)));

create table public.tournament_category_links (
  -- Only so the audit log can name each assignment.
  id uuid not null unique default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id),
  category_id uuid not null references public.tournament_categories(id),
  primary key (tournament_id, category_id)
);
create index tournament_category_links_category on public.tournament_category_links (category_id);

create table public.anglers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 60),
  last_name text not null check (char_length(btrim(last_name)) between 1 and 60),
  dni text not null unique check (dni ~ '^[0-9]{7,8}$'),
  created_by uuid not null references public.admin_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index anglers_last_name on public.anglers (lower(last_name), lower(first_name), id);
create index anglers_first_name on public.anglers (lower(first_name), lower(last_name), id);

-- Every existing tournament and participant starts in "General".
insert into public.tournament_categories(name) values ('General');
insert into public.tournament_category_links(tournament_id, category_id)
  select t.id, c.id from public.tournaments t cross join public.tournament_categories c;

alter table public.tournament_participants add column angler_id uuid references public.anglers(id);
alter table public.tournament_participants add column category_id uuid;
update public.tournament_participants set category_id = (select id from public.tournament_categories);
alter table public.tournament_participants alter column category_id set not null;
-- An entry can only be in a category of its own tournament.
alter table public.tournament_participants add constraint tournament_participants_category
  foreign key (tournament_id, category_id) references public.tournament_category_links(tournament_id, category_id);
drop index public.tournament_participants_name;
drop index public.tournament_participants_ranking;
create unique index tournament_participants_angler on public.tournament_participants
  (tournament_id, category_id, angler_id) where deleted_at is null and angler_id is not null;
-- Entries loaded before the registry existed have only a name.
create unique index tournament_participants_legacy_name on public.tournament_participants
  (tournament_id, category_id, lower(display_name)) where deleted_at is null and angler_id is null;
create index tournament_participants_ranking on public.tournament_participants
  (tournament_id, category_id, points desc, lower(display_name), id) where deleted_at is null;
create index tournament_participants_by_angler on public.tournament_participants (angler_id)
  where angler_id is not null;
grant select (category_id) on public.tournament_participants to anon, authenticated;

alter table public.tournament_categories enable row level security;
alter table public.tournament_category_links enable row level security;
alter table public.anglers enable row level security;
revoke all on public.tournament_categories, public.tournament_category_links, public.anglers
  from public, anon, authenticated;
grant all on public.tournament_categories, public.tournament_category_links, public.anglers to service_role;
-- Category names are public; which ones a tournament uses is public once it is.
grant select (id, name) on public.tournament_categories to anon, authenticated;
grant select on public.tournament_category_links to anon, authenticated;
create policy tournament_categories_public_read on public.tournament_categories
  for select to anon, authenticated using (true);
create policy tournament_category_links_public_read on public.tournament_category_links
  for select to anon, authenticated using (exists (select 1 from public.tournaments t
    where t.id = tournament_id and t.status in ('published','finished')));
-- People are read only through permission-checked RPCs that mask the DNI.
create policy anglers_deny_read on public.anglers for select to anon, authenticated using (false);
do $$
declare t text;
begin
  foreach t in array array['tournament_categories','tournament_category_links','anglers'] loop
    execute format('create policy %I on public.%I for insert to anon, authenticated with check (false)', t || '_deny_insert', t);
    execute format('create policy %I on public.%I for update to anon, authenticated using (false) with check (false)', t || '_deny_update', t);
    execute format('create policy %I on public.%I for delete to anon, authenticated using (false)', t || '_deny_delete', t);
  end loop;
end;
$$;
create trigger tournament_categories_updated before update on public.tournament_categories
  for each row execute function public.set_content_updated_at();
create trigger anglers_updated before update on public.anglers
  for each row execute function public.set_content_updated_at();
create trigger tournament_categories_audit after insert or update or delete on public.tournament_categories
  for each row execute function private.audit_change();
create trigger tournament_category_links_audit after insert or update or delete on public.tournament_category_links
  for each row execute function private.audit_change();

create function private.mask_dni(p_dni text) returns text
language sql immutable set search_path = '' as $$
  select case when p_dni is null then null else '••••' || right(p_dni, 4) end
$$;

-- Same audit trail as every table, without spreading full DNIs to audit readers.
create function private.audit_angler() returns trigger
language plpgsql security definer set search_path = '' as $$
declare old_data jsonb; new_data jsonb;
begin
  if tg_op <> 'INSERT' then old_data := to_jsonb(old) || jsonb_build_object('dni', private.mask_dni(old.dni)); end if;
  if tg_op <> 'DELETE' then new_data := to_jsonb(new) || jsonb_build_object('dni', private.mask_dni(new.dni)); end if;
  insert into public.audit_logs(actor_id, action, resource_id, before_data, after_data)
  values ((select auth.uid()), 'anglers.' || lower(tg_op), coalesce(new.id, old.id)::text, old_data, new_data);
  return coalesce(new, old);
end;
$$;
create trigger anglers_audit after insert or update or delete on public.anglers
  for each row execute function private.audit_angler();

-- Public name: first name and last-name initial ("Juan P."), as before.
create function private.angler_display(p_first text, p_last text) returns text
language sql immutable set search_path = '' as $$
  select btrim(p_first) || ' ' || upper(left(btrim(p_last), 1)) || '.'
$$;

-- Fixing a person's data fixes their name in every table they appear in.
create function private.sync_angler_display() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.tournament_participants set display_name = private.angler_display(new.first_name, new.last_name)
    where angler_id = new.id and deleted_at is null
      and display_name is distinct from private.angler_display(new.first_name, new.last_name);
  return new;
end;
$$;
create trigger anglers_sync_display after update of first_name, last_name on public.anglers
  for each row execute function private.sync_angler_display();

-- Categories ----------------------------------------------------------------------

create function public.tournament_category_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  -- A club has a handful of categories; the list is bounded anyway.
  return coalesce((select jsonb_agg(to_jsonb(c) order by c.archived_at is not null, lower(c.name)) from (
    select c.id, c.name, c.archived_at, c.updated_at,
      (select count(*) from public.tournament_category_links l where l.category_id = c.id) as tournaments
    from public.tournament_categories c order by c.archived_at is not null, lower(c.name) limit 100
  ) c), '[]'::jsonb);
end;
$$;

create function public.tournament_category_save(p_name text, p_id uuid default null, p_version timestamptz default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare previous public.tournament_categories; category_id uuid;
begin
  perform private.require_permission('torneos.gestionar');
  if p_id is null then
    insert into public.tournament_categories(name) values (btrim(p_name)) returning id into category_id;
    return category_id;
  end if;
  select * into previous from public.tournament_categories where id = p_id for update;
  if not found then raise exception 'No existe la categoría' using errcode = 'P0002'; end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'La categoría cambió. Actualizá antes de guardar.' using errcode = '40001';
  end if;
  update public.tournament_categories set name = btrim(p_name) where id = p_id;
  return p_id;
end;
$$;

create function public.tournament_category_archive(p_id uuid, p_archived boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.gestionar');
  update public.tournament_categories
    set archived_at = case when p_archived then coalesce(archived_at, now()) end where id = p_id;
  if not found then raise exception 'No existe la categoría' using errcode = 'P0002'; end if;
end;
$$;

-- Replaces a tournament's categories. Removing one that has entries is refused.
create function private.set_tournament_categories(p_tournament uuid, p_categories jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare wanted uuid[];
begin
  if jsonb_typeof(p_categories) is distinct from 'array' or jsonb_array_length(p_categories) not between 1 and 10 then
    raise exception 'Elegí entre 1 y 10 categorías' using errcode = '22023';
  end if;
  select array_agg(distinct value::uuid) into wanted from jsonb_array_elements_text(p_categories);
  if exists (select 1 from unnest(wanted) w(id) where not exists (
      select 1 from public.tournament_categories c where c.id = w.id
        and (c.archived_at is null or exists (select 1 from public.tournament_category_links l
          where l.tournament_id = p_tournament and l.category_id = c.id)))) then
    raise exception 'Alguna categoría no existe o está archivada' using errcode = '22023';
  end if;
  if exists (select 1 from public.tournament_participants p where p.tournament_id = p_tournament
      and not (p.category_id = any(wanted))) then
    raise exception 'No podés quitar una categoría que ya tiene participantes' using errcode = '23503';
  end if;
  delete from public.tournament_category_links where tournament_id = p_tournament and not (category_id = any(wanted));
  insert into public.tournament_category_links(tournament_id, category_id)
    select p_tournament, unnest(wanted) on conflict do nothing;
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
    insert into public.tournaments(name, place, starts_on, ends_on, start_time, created_by)
      values (input.name, input.place, input.starts_on, input.ends_on, input.start_time, (select auth.uid()))
      returning id into tournament_id;
    -- Older panels send no categories: those tournaments go to "General".
    perform private.set_tournament_categories(tournament_id, coalesce(p_data->'categories',
      (select jsonb_build_array(id) from public.tournament_categories where lower(name) = 'general')));
    return tournament_id;
  end if;
  select * into previous from public.tournaments where id = p_id for update;
  if not found or previous.status = 'archived' then
    raise exception 'No existe el torneo' using errcode = 'P0002';
  end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'El torneo cambió. Actualizá antes de guardar.' using errcode = '40001';
  end if;
  update public.tournaments set name = input.name, place = input.place,
    starts_on = input.starts_on, ends_on = input.ends_on, start_time = input.start_time where id = p_id;
  if p_data ? 'categories' then perform private.set_tournament_categories(p_id, p_data->'categories'); end if;
  return p_id;
end;
$$;

create function private.tournament_categories_json(p_tournament uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name,
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
    select t.id, t.name, t.place, t.starts_on, t.ends_on, t.start_time, t.status, t.created_at, t.updated_at,
      (select count(*) from public.tournament_participants p
        where p.tournament_id = t.id and p.deleted_at is null) as participants,
      private.tournament_categories_json(t.id) as categories
    from public.tournaments t where t.id = p_id) row);
end;
$$;

-- Public: the categories of a visible tournament, each with its own table.
create function public.tournament_board_categories(p_tournament uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when exists (select 1 from public.tournaments t where t.id = p_tournament
      and t.status in ('published','finished'))
    then private.tournament_categories_json(p_tournament) else '[]'::jsonb end
$$;

-- p_category is last and optional so the site keeps working before it is redeployed.
drop function public.tournament_leaderboard(uuid, integer, text, uuid);
create function public.tournament_leaderboard(p_tournament uuid, p_points integer default null,
  p_name text default null, p_id uuid default null, p_category uuid default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', page.id, 'display_name', page.display_name,
    'points', page.points, 'ranking', page.ranking) order by page.points desc, page.sort_name, page.id), '[]'::jsonb)
  from (
    select ranked.* from (
      select p.id, p.display_name, p.points, lower(p.display_name) as sort_name,
        rank() over (order by p.points desc) as ranking
      from public.tournament_participants p
      where p.tournament_id = p_tournament and p.deleted_at is null
        and (p_category is null or p.category_id = p_category)
    ) ranked
    where p_points is null or ranked.points < p_points
      or (ranked.points = p_points and (ranked.sort_name, ranked.id) > (lower(p_name), p_id))
    order by ranked.points desc, ranked.sort_name, ranked.id
    limit 50
  ) page
$$;

-- People registry -------------------------------------------------------------------

create function private.angler_json(p_angler public.anglers, p_full boolean) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('id', p_angler.id, 'first_name', p_angler.first_name,
    'last_name', p_angler.last_name, 'updated_at', p_angler.updated_at,
    'dni', case when p_full then p_angler.dni end, 'dni_masked', private.mask_dni(p_angler.dni))
$$;

-- A full DNI finds that person; otherwise a name prefix. Listings show the DNI masked.
create function public.angler_search(p_query text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare q text := lower(btrim(coalesce(p_query, '')));
begin
  perform private.require_permission('torneos.participantes');
  if char_length(q) not between 2 and 80 then
    raise exception 'Escribí al menos 2 caracteres' using errcode = '22023';
  end if;
  return coalesce((select jsonb_agg(private.angler_json(a, false) order by lower(a.last_name), lower(a.first_name), a.id)
    from (select * from public.anglers a
      where (q ~ '^[0-9]{7,8}$' and a.dni = q)
        or (q !~ '^[0-9]+$' and (starts_with(lower(a.last_name), q) or starts_with(lower(a.first_name), q)
          or starts_with(lower(a.first_name || ' ' || a.last_name), q)))
      order by lower(a.last_name), lower(a.first_name), a.id limit 20) a), '[]'::jsonb);
end;
$$;

create function public.angler_get(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare found_angler public.anglers;
begin
  perform private.require_permission('torneos.participantes');
  select * into found_angler from public.anglers where id = p_id;
  if not found then raise exception 'No existe la persona' using errcode = 'P0002'; end if;
  return private.angler_json(found_angler, true);
end;
$$;

create function public.angler_save(p_data jsonb, p_id uuid default null, p_version timestamptz default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare previous public.anglers; saved public.anglers; clean_dni text;
begin
  perform private.require_permission('torneos.participantes');
  if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'Datos inválidos' using errcode = '22023'; end if;
  -- Accept "30.123.456" as typed; store digits only.
  clean_dni := regexp_replace(coalesce(p_data->>'dni', ''), '[.\s-]', '', 'g');
  if clean_dni !~ '^[0-9]{7,8}$' then raise exception 'El DNI debe tener 7 u 8 números' using errcode = '22023'; end if;
  if exists (select 1 from public.anglers where anglers.dni = clean_dni and id is distinct from p_id) then
    raise exception 'Ya hay una persona registrada con ese DNI' using errcode = '23505';
  end if;
  if p_id is null then
    insert into public.anglers(first_name, last_name, dni, created_by)
      values (btrim(p_data->>'first_name'), btrim(p_data->>'last_name'), clean_dni, (select auth.uid()))
      returning * into saved;
  else
    select * into previous from public.anglers where id = p_id for update;
    if not found then raise exception 'No existe la persona' using errcode = 'P0002'; end if;
    if p_version is null or previous.updated_at <> p_version then
      raise exception 'Los datos cambiaron. Actualizá antes de guardar.' using errcode = '40001';
    end if;
    update public.anglers set first_name = btrim(p_data->>'first_name'), last_name = btrim(p_data->>'last_name'),
      dni = clean_dni where id = p_id returning * into saved;
  end if;
  return private.angler_json(saved, true);
end;
$$;

-- Entries ---------------------------------------------------------------------------

create function private.require_entry_slot(p_tournament uuid, p_category uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.tournament_category_links
      where tournament_id = p_tournament and category_id = p_category) then
    raise exception 'La categoría no pertenece al torneo' using errcode = '22023';
  end if;
  -- Keeps every leaderboard small enough to rank on the fly.
  if (select count(*) from public.tournament_participants
      where tournament_id = p_tournament and deleted_at is null) >= 500 then
    raise exception 'El torneo alcanzó el máximo de 500 participantes' using errcode = '22023';
  end if;
end;
$$;

drop function public.tournament_add_participant(uuid, text, boolean);
create function public.tournament_add_participant(p_tournament uuid, p_category uuid, p_angler uuid, p_consent boolean)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare person public.anglers; participant_id uuid;
begin
  perform private.require_permission('torneos.participantes');
  perform private.require_open_tournament(p_tournament);
  if p_consent is not true then
    raise exception 'La persona debe aceptar aparecer en la tabla' using errcode = '22023';
  end if;
  select * into person from public.anglers where id = p_angler;
  if not found then raise exception 'No existe la persona' using errcode = 'P0002'; end if;
  perform private.require_entry_slot(p_tournament, p_category);
  if exists (select 1 from public.tournament_participants where tournament_id = p_tournament
      and category_id = p_category and angler_id = p_angler and deleted_at is null) then
    raise exception 'La persona ya está anotada en esa categoría' using errcode = '23505';
  end if;
  insert into public.tournament_participants(tournament_id, category_id, angler_id, display_name, consent_at, created_by)
    values (p_tournament, p_category, p_angler, private.angler_display(person.first_name, person.last_name),
      now(), (select auth.uid()))
    returning id into participant_id;
  return participant_id;
end;
$$;

-- Fixes an entry loaded with the wrong person (or links an old entry to the registry).
-- The points stay with the entry: they were earned by whoever actually competed.
create function public.tournament_change_participant(p_id uuid, p_angler uuid, p_consent boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare entry public.tournament_participants; person public.anglers;
begin
  perform private.require_permission('torneos.participantes');
  select * into entry from public.tournament_participants where id = p_id and deleted_at is null for update;
  if not found then raise exception 'No existe el participante' using errcode = 'P0002'; end if;
  perform private.require_open_tournament(entry.tournament_id);
  if p_consent is not true then
    raise exception 'La persona debe aceptar aparecer en la tabla' using errcode = '22023';
  end if;
  select * into person from public.anglers where id = p_angler;
  if not found then raise exception 'No existe la persona' using errcode = 'P0002'; end if;
  if exists (select 1 from public.tournament_participants where tournament_id = entry.tournament_id
      and category_id = entry.category_id and angler_id = p_angler and deleted_at is null and id <> p_id) then
    raise exception 'La persona ya está anotada en esa categoría' using errcode = '23505';
  end if;
  update public.tournament_participants set angler_id = p_angler, consent_at = now(),
    display_name = private.angler_display(person.first_name, person.last_name) where id = p_id;
end;
$$;

create function public.tournament_move_participant(p_id uuid, p_category uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare entry public.tournament_participants;
begin
  perform private.require_permission('torneos.participantes');
  select * into entry from public.tournament_participants where id = p_id and deleted_at is null for update;
  if not found then raise exception 'No existe el participante' using errcode = 'P0002'; end if;
  perform private.require_open_tournament(entry.tournament_id);
  if not exists (select 1 from public.tournament_category_links
      where tournament_id = entry.tournament_id and category_id = p_category) then
    raise exception 'La categoría no pertenece al torneo' using errcode = '22023';
  end if;
  if exists (select 1 from public.tournament_participants where tournament_id = entry.tournament_id
      and category_id = p_category and deleted_at is null and id <> p_id
      and ((entry.angler_id is not null and angler_id = entry.angler_id)
        or (entry.angler_id is null and angler_id is null and lower(display_name) = lower(entry.display_name)))) then
    raise exception 'Ya está anotado en esa categoría' using errcode = '23505';
  end if;
  update public.tournament_participants set category_id = p_category where id = p_id;
end;
$$;

-- Only entries without a person keep a free-text name; the others follow the registry.
create or replace function public.tournament_rename_participant(p_id uuid, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare entry public.tournament_participants;
begin
  perform private.require_permission('torneos.participantes');
  select * into entry from public.tournament_participants where id = p_id and deleted_at is null;
  if not found then raise exception 'No existe el participante' using errcode = 'P0002'; end if;
  if entry.angler_id is not null then
    raise exception 'Corregí el nombre desde los datos de la persona' using errcode = '22023';
  end if;
  perform private.require_open_tournament(entry.tournament_id);
  update public.tournament_participants set display_name = btrim(p_name) where id = p_id;
end;
$$;

drop function public.tournament_admin_participants(uuid, text, integer, text, uuid);
create function public.tournament_admin_participants(p_tournament uuid, p_search text default '',
  p_points integer default null, p_name text default null, p_id uuid default null, p_category uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  if p_search is null or char_length(p_search) > 80 then
    raise exception 'Filtro inválido' using errcode = '22023';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(page) - 'sort_name' order by page.points desc, page.sort_name, page.id) from (
      select ranked.* from (
        select p.id, p.display_name, p.points, p.updated_at, p.category_id, p.angler_id,
          private.mask_dni(a.dni) as dni_masked, lower(p.display_name) as sort_name,
          rank() over (order by p.points desc) as ranking
        from public.tournament_participants p left join public.anglers a on a.id = p.angler_id
        where p.tournament_id = p_tournament and p.deleted_at is null
          and (p_category is null or p.category_id = p_category)
      ) ranked
      where (p_search = '' or starts_with(ranked.sort_name, lower(btrim(p_search))))
        and (p_points is null or ranked.points < p_points
          or (ranked.points = p_points and (ranked.sort_name, ranked.id) > (lower(p_name), p_id)))
      order by ranked.points desc, ranked.sort_name, ranked.id limit 50
    ) page), '[]'::jsonb);
end;
$$;

revoke all on function private.mask_dni(text), private.audit_angler(), private.angler_display(text, text),
  private.sync_angler_display(), private.set_tournament_categories(uuid, jsonb),
  private.tournament_categories_json(uuid), private.angler_json(public.anglers, boolean),
  private.require_entry_slot(uuid, uuid) from public, anon, authenticated;
revoke all on function public.tournament_category_list(), public.tournament_category_save(text, uuid, timestamptz),
  public.tournament_category_archive(uuid, boolean), public.tournament_save(jsonb, uuid, timestamptz),
  public.tournament_admin_list(timestamptz, uuid), public.tournament_admin_get(uuid),
  public.angler_search(text), public.angler_get(uuid), public.angler_save(jsonb, uuid, timestamptz),
  public.tournament_add_participant(uuid, uuid, uuid, boolean),
  public.tournament_change_participant(uuid, uuid, boolean), public.tournament_move_participant(uuid, uuid),
  public.tournament_rename_participant(uuid, text),
  public.tournament_admin_participants(uuid, text, integer, text, uuid, uuid) from public, anon;
grant execute on function public.tournament_category_list(), public.tournament_category_save(text, uuid, timestamptz),
  public.tournament_category_archive(uuid, boolean), public.tournament_save(jsonb, uuid, timestamptz),
  public.tournament_admin_list(timestamptz, uuid), public.tournament_admin_get(uuid),
  public.angler_search(text), public.angler_get(uuid), public.angler_save(jsonb, uuid, timestamptz),
  public.tournament_add_participant(uuid, uuid, uuid, boolean),
  public.tournament_change_participant(uuid, uuid, boolean), public.tournament_move_participant(uuid, uuid),
  public.tournament_rename_participant(uuid, text),
  public.tournament_admin_participants(uuid, text, integer, text, uuid, uuid) to authenticated;
revoke all on function public.tournament_board_categories(uuid),
  public.tournament_leaderboard(uuid, integer, text, uuid, uuid) from public;
grant execute on function public.tournament_board_categories(uuid),
  public.tournament_leaderboard(uuid, integer, text, uuid, uuid) to anon, authenticated;

commit;
