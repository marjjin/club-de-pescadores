-- Optional tournament description (prizes, entry fee, rules...), shown on the public
-- tournament page. Its agenda event carries the start of it, within the event limit.
begin;

alter table public.tournaments add column description text
  check (description is null or char_length(btrim(description)) between 1 and 2000);
grant select (description) on public.tournaments to anon, authenticated;

-- Events allow 600 characters: longer descriptions end with "…" in the agenda.
create function private.tournament_event_description(p_description text) returns text
language sql immutable set search_path = '' as $$
  select case
    when p_description is null then null
    when char_length(p_description) <= 600 then p_description
    else btrim(left(p_description, 599)) || '…'
  end
$$;

create or replace function private.sync_tournament_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Tells the guard that this change comes from the tournament.
  perform set_config('app.tournament_event_sync', 'on', true);
  insert into public.events(title, starts_at, place, description, is_published, deleted_at, tournament_id, show_time)
  values (new.name,
    (new.starts_on + coalesce(new.start_time, '00:00')::time) at time zone 'America/Argentina/Buenos_Aires',
    coalesce(new.place, 'Club de Pescadores San Nicolás'),
    private.tournament_event_description(new.description),
    new.status in ('published','finished'),
    case when new.status = 'archived' then now() end,
    new.id, new.start_time is not null)
  on conflict (tournament_id) do update set title = excluded.title, starts_at = excluded.starts_at,
    place = excluded.place, description = excluded.description, is_published = excluded.is_published,
    show_time = excluded.show_time,
    deleted_at = case when excluded.deleted_at is null then null
      else coalesce(public.events.deleted_at, excluded.deleted_at) end;
  perform set_config('app.tournament_event_sync', 'off', true);
  return new;
end;
$$;
drop trigger tournaments_sync_event on public.tournaments;
create trigger tournaments_sync_event
after insert or update of name, place, starts_on, start_time, status, description on public.tournaments
for each row execute function private.sync_tournament_event();

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
  result.description := nullif(btrim(p_data->>'description'), '');
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
    insert into public.tournaments(name, place, starts_on, ends_on, start_time, description, created_by)
      values (input.name, input.place, input.starts_on, input.ends_on, input.start_time, input.description,
        (select auth.uid()))
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
  -- Older panels send no description: keep the saved one instead of erasing it.
  update public.tournaments set name = input.name, place = input.place,
    starts_on = input.starts_on, ends_on = input.ends_on, start_time = input.start_time,
    description = case when p_data ? 'description' then input.description else previous.description end
    where id = p_id;
  if p_data ? 'categories' then perform private.set_tournament_categories(p_id, p_data->'categories'); end if;
  return p_id;
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

revoke all on function private.tournament_event_description(text) from public, anon, authenticated;
revoke all on function public.tournament_save(jsonb, uuid, timestamptz), public.tournament_admin_get(uuid)
  from public, anon;
grant execute on function public.tournament_save(jsonb, uuid, timestamptz), public.tournament_admin_get(uuid)
  to authenticated;

commit;
