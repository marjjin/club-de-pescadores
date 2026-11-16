-- Every tournament also appears in the events agenda. Its event is derived: a trigger
-- keeps it in sync with the tournament, and the events editor cannot change it.
begin;

-- Local club time "HH:MM". Required when saving; tournaments created before keep null.
alter table public.tournaments add column start_time text
  check (start_time is null or start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.events add column tournament_id uuid unique references public.tournaments(id);
-- Only a tournament without a start time yet shows its event without the hour.
alter table public.events add column show_time boolean not null default true;
alter table public.events add constraint events_show_time_only_tournaments
  check (show_time or tournament_id is not null);

-- Visible exactly while the tournament is: published or finished; archived hides it.
create function private.sync_tournament_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Tells the guard below that this change comes from the tournament.
  perform set_config('app.tournament_event_sync', 'on', true);
  insert into public.events(title, starts_at, place, is_published, deleted_at, tournament_id, show_time)
  values (new.name,
    (new.starts_on + coalesce(new.start_time, '00:00')::time) at time zone 'America/Argentina/Buenos_Aires',
    coalesce(new.place, 'Club de Pescadores San Nicolás'),
    new.status in ('published','finished'),
    case when new.status = 'archived' then now() end,
    new.id, new.start_time is not null)
  on conflict (tournament_id) do update set title = excluded.title, starts_at = excluded.starts_at,
    place = excluded.place, is_published = excluded.is_published, show_time = excluded.show_time,
    deleted_at = case when excluded.deleted_at is null then null
      else coalesce(public.events.deleted_at, excluded.deleted_at) end;
  perform set_config('app.tournament_event_sync', 'off', true);
  return new;
end;
$$;
create trigger tournaments_sync_event
after insert or update of name, place, starts_on, start_time, status on public.tournaments
for each row execute function private.sync_tournament_event();

create function private.guard_tournament_event() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.tournament_id is not null
    and coalesce(current_setting('app.tournament_event_sync', true), '') <> 'on' then
    raise exception 'Este evento se gestiona desde Torneos' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
create trigger events_tournament_guard before update or delete on public.events
for each row execute function private.guard_tournament_event();
revoke all on function private.sync_tournament_event(), private.guard_tournament_event()
  from public, anon, authenticated;

-- Existing tournaments get their event too; without a start time it shows only the day.
insert into public.events(title, starts_at, place, is_published, deleted_at, tournament_id, show_time)
select t.name, (t.starts_on + time '00:00') at time zone 'America/Argentina/Buenos_Aires',
  coalesce(t.place, 'Club de Pescadores San Nicolás'), t.status in ('published','finished'),
  case when t.status = 'archived' then now() end, t.id, false
from public.tournaments t;

create or replace function private.tournament_data(p_data jsonb) returns public.tournaments
language plpgsql stable security definer set search_path = '' as $$
declare result public.tournaments;
begin
  if jsonb_typeof(p_data) is distinct from 'object' then
    raise exception 'Torneo inválido' using errcode = '22023';
  end if;
  result.name := btrim(p_data->>'name');
  result.place := nullif(btrim(p_data->>'place'), '');
  result.starts_on := (p_data->>'starts_on')::date;
  result.ends_on := nullif(p_data->>'ends_on', '')::date;
  result.start_time := nullif(btrim(p_data->>'start_time'), '');
  if result.name is null or result.starts_on is null or result.start_time is null then
    raise exception 'Completá el nombre, la fecha y la hora de inicio' using errcode = '22023';
  end if;
  return result;
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
  return p_id;
end;
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
          where p.tournament_id = t.id and p.deleted_at is null) as participants
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
        where p.tournament_id = t.id and p.deleted_at is null) as participants
    from public.tournaments t where t.id = p_id) row);
end;
$$;

-- admin_list: events also report the tournament they come from.
create or replace function public.admin_list(p_kind text, p_before timestamptz default null, p_id uuid default null,
  p_state text default 'all', p_search text default '') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare table_name text; fields text; filter_sql text := 'true'; search_col text; result jsonb; role_scope text := '';
begin
  if char_length(p_search) > 100 or p_state not in ('all','draft','published','archived') then
    raise exception 'Filtro inválido' using errcode = '22023';
  end if;
  case p_kind
    when 'news' then
      perform private.require_permission('noticias.ver'); table_name := 'news'; search_col := 'title';
      fields := 'id,title,excerpt,published_at,image_url,image_alt,image_focus_x,image_focus_y,is_published,deleted_at,created_at,updated_at';
    when 'events' then
      perform private.require_permission('eventos.ver'); table_name := 'events'; search_col := 'title';
      fields := 'id,title,starts_at,place,description,is_published,deleted_at,created_at,updated_at,tournament_id';
    when 'pool_rates' then
      perform private.require_permission('tarifas.ver'); table_name := 'pool_rates'; search_col := 'season';
      fields := 'id,season,period,family_price_cents,individual_price_cents,family_description,discount_note,valid_from,valid_until,is_published,deleted_at,created_at,updated_at';
    when 'roles' then
      -- Filter before ordering/limiting so hidden roles never consume a page slot.
      role_scope := ' and private.is_panel_role(t.id)';
      if not public.has_permission('roles.gestionar') then
        perform private.require_permission('usuarios.ver');
        role_scope := role_scope || ' and private.can_assign_role(t.id)';
      end if;
      table_name := 'roles'; search_col := 'name';
      fields := 'id,name,is_system,created_at,updated_at,(select coalesce(jsonb_agg(permission_id order by permission_id), ''[]''::jsonb) from public.role_permissions where role_id = t.id and private.is_panel_permission(permission_id)) as permissions';
    when 'users' then
      perform private.require_permission('usuarios.ver'); table_name := 'admin_accounts'; search_col := 'email';
      -- Deleted accounts only remain for authorship and audit; they are not team members.
      role_scope := ' and t.deleted_at is null';
      -- Preserve all assignment IDs: saving a visible edit must not revoke hidden roles.
      fields := 'id,email,active,created_at,updated_at,(select coalesce(jsonb_agg(role_id order by role_id), ''[]''::jsonb) from public.user_roles where user_id = t.id) as roles';
    when 'audit' then
      perform private.require_permission('auditoria.ver'); table_name := 'audit_logs'; search_col := 'action';
      fields := 'id,actor_id,(select email from public.admin_accounts where id = t.actor_id) as actor_email,action,resource_id,before_data,after_data,created_at';
    else raise exception 'Listado inválido' using errcode = '22023';
  end case;
  if p_kind in ('news','events','pool_rates') then
    filter_sql := case p_state
      when 'draft' then 'deleted_at is null and not is_published'
      when 'published' then 'deleted_at is null and is_published'
      when 'archived' then 'deleted_at is not null'
      else 'deleted_at is null' end;
    filter_sql := filter_sql || format(' and ($3 = '''' or to_tsvector(''spanish'', %I) @@ websearch_to_tsquery(''spanish'', $3))', search_col);
  else
    filter_sql := format('($3 = '''' or starts_with(lower(%I), lower($3)))', search_col) || role_scope;
  end if;
  execute format('select coalesce(jsonb_agg(to_jsonb(page)), ''[]''::jsonb) from
    (select %s from public.%I t where ($1 is null or (created_at,id) < ($1,$2)) and (%s)
    order by created_at desc,id desc limit 21) page', fields, table_name, filter_sql)
    into result using p_before, p_id, p_search;
  return result;
end;
$$;

revoke all on function public.tournament_save(jsonb, uuid, timestamptz),
  public.tournament_admin_list(timestamptz, uuid), public.tournament_admin_get(uuid),
  public.admin_list(text, timestamptz, uuid, text, text) from public, anon;
grant execute on function public.tournament_save(jsonb, uuid, timestamptz),
  public.tournament_admin_list(timestamptz, uuid), public.tournament_admin_get(uuid),
  public.admin_list(text, timestamptz, uuid, text, text) to authenticated;
revoke all on function private.tournament_data(jsonb) from public, anon, authenticated;

commit;
