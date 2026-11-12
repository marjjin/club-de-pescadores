-- Fishing tournaments: staff create a tournament, register participants and add points;
-- visitors see a public leaderboard. Points are an append-only ledger so two people
-- scoring at once never overwrite each other, and every correction stays visible.
begin;

insert into public.permissions(id, label, reserved) values
  ('torneos.ver', 'Ver torneos', false),
  ('torneos.gestionar', 'Crear, publicar y finalizar torneos', false),
  ('torneos.participantes', 'Registrar participantes', false),
  ('torneos.puntos', 'Sumar puntos', false);
-- Ready-made role; a general administrator assigns it to invited accounts.
with organizer as (insert into public.roles(name) values ('Torneo') returning id)
insert into public.role_permissions(role_id, permission_id)
  select id, unnest(array['torneos.ver','torneos.gestionar','torneos.participantes','torneos.puntos']) from organizer;

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 3 and 120),
  place text check (place is null or char_length(btrim(place)) between 1 and 200),
  starts_on date not null,
  ends_on date check (ends_on is null or ends_on >= starts_on),
  -- archived is the soft delete: hidden from the site, kept with its scores.
  status text not null default 'draft' check (status in ('draft','published','finished','archived')),
  created_by uuid not null references public.admin_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.tournament_participants (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 80),
  -- Ley 25.326: a name is published only after the person agreed to it.
  consent_at timestamptz not null,
  -- Running total kept by tournament_add_points in the same transaction as the ledger.
  points integer not null default 0 check (points between -100000 and 100000),
  deleted_at timestamptz,
  created_by uuid not null references public.admin_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.tournament_scores (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id),
  participant_id uuid not null references public.tournament_participants(id),
  points integer not null check (points <> 0 and points between -1000 and 1000),
  reason text check (reason is null or char_length(btrim(reason)) between 1 and 200),
  created_by uuid not null references public.admin_accounts(id),
  created_at timestamptz not null default now()
);

create index tournaments_public_list on public.tournaments (starts_on desc, id desc)
  where status in ('published','finished');
create index tournaments_admin_cursor on public.tournaments (created_at desc, id desc);
create unique index tournament_participants_name on public.tournament_participants
  (tournament_id, lower(display_name)) where deleted_at is null;
create index tournament_participants_ranking on public.tournament_participants
  (tournament_id, points desc, lower(display_name), id) where deleted_at is null;
create index tournament_scores_participant on public.tournament_scores (participant_id, created_at desc);
create index tournament_scores_tournament on public.tournament_scores (tournament_id);

alter table public.tournaments enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.tournament_scores enable row level security;
revoke all on public.tournaments, public.tournament_participants, public.tournament_scores
  from public, anon, authenticated;
grant all on public.tournaments, public.tournament_participants, public.tournament_scores to service_role;
-- Column grants: visitors never see who loaded data or when consent was recorded.
grant select (id, name, place, starts_on, ends_on, status) on public.tournaments to anon, authenticated;
grant select (id, tournament_id, display_name, points, deleted_at)
  on public.tournament_participants to anon, authenticated;

create policy tournaments_public_read on public.tournaments for select to anon, authenticated
  using (status in ('published','finished'));
create policy tournament_participants_public_read on public.tournament_participants
  for select to anon, authenticated
  using (deleted_at is null and exists (select 1 from public.tournaments t
    where t.id = tournament_id and t.status in ('published','finished')));
-- The ledger is read only through permission-checked RPCs.
create policy tournament_scores_deny_read on public.tournament_scores for select to anon, authenticated using (false);
do $$
declare t text;
begin
  foreach t in array array['tournaments','tournament_participants','tournament_scores'] loop
    execute format('create policy %I on public.%I for insert to anon, authenticated with check (false)', t || '_deny_insert', t);
    execute format('create policy %I on public.%I for update to anon, authenticated using (false) with check (false)', t || '_deny_update', t);
    execute format('create policy %I on public.%I for delete to anon, authenticated using (false)', t || '_deny_delete', t);
  end loop;
end;
$$;

create trigger tournaments_updated before update on public.tournaments
  for each row execute function public.set_content_updated_at();
create trigger tournament_participants_updated before update on public.tournament_participants
  for each row execute function public.set_content_updated_at();
create trigger tournaments_audit after insert or update or delete on public.tournaments
  for each row execute function private.audit_change();
-- Point totals are audited through the ledger row; auditing them here too would double every entry.
create trigger tournament_participants_audit
  after insert or delete or update of display_name, deleted_at on public.tournament_participants
  for each row execute function private.audit_change();
create trigger tournament_scores_audit after insert or update or delete on public.tournament_scores
  for each row execute function private.audit_change();

-- Public leaderboard. Runs as the caller, so the RLS policies above decide visibility.
-- Tied participants share a position; the keyset cursor follows the same order as the index.
create function public.tournament_leaderboard(p_tournament uuid, p_points integer default null,
  p_name text default null, p_id uuid default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', page.id, 'display_name', page.display_name,
    'points', page.points, 'ranking', page.ranking) order by page.points desc, page.sort_name, page.id), '[]'::jsonb)
  from (
    select ranked.* from (
      select p.id, p.display_name, p.points, lower(p.display_name) as sort_name,
        rank() over (order by p.points desc) as ranking
      from public.tournament_participants p
      where p.tournament_id = p_tournament and p.deleted_at is null
    ) ranked
    where p_points is null or ranked.points < p_points
      or (ranked.points = p_points and (ranked.sort_name, ranked.id) > (lower(p_name), p_id))
    order by ranked.points desc, ranked.sort_name, ranked.id
    limit 50
  ) page
$$;
revoke all on function public.tournament_leaderboard(uuid, integer, text, uuid) from public;
grant execute on function public.tournament_leaderboard(uuid, integer, text, uuid) to anon, authenticated;

create function private.tournament_data(p_data jsonb) returns public.tournaments
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
  if result.name is null or result.starts_on is null then
    raise exception 'Completá el nombre y la fecha de inicio' using errcode = '22023';
  end if;
  return result;
end;
$$;

create function public.tournament_save(p_data jsonb, p_id uuid default null, p_version timestamptz default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare input public.tournaments; previous public.tournaments; tournament_id uuid;
begin
  perform private.require_permission('torneos.gestionar');
  input := private.tournament_data(p_data);
  if p_id is null then
    insert into public.tournaments(name, place, starts_on, ends_on, created_by)
      values (input.name, input.place, input.starts_on, input.ends_on, (select auth.uid()))
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
    starts_on = input.starts_on, ends_on = input.ends_on where id = p_id;
  return p_id;
end;
$$;

create function public.tournament_set_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.gestionar');
  if p_status is null or p_status not in ('draft','published','finished','archived') then
    raise exception 'Estado inválido' using errcode = '22023';
  end if;
  update public.tournaments set status = p_status where id = p_id;
  if not found then raise exception 'No existe el torneo' using errcode = 'P0002'; end if;
end;
$$;

-- Participants and points can change only while the tournament is open.
create function private.require_open_tournament(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.tournaments where id = p_id and status in ('draft','published') for share) then
    raise exception 'El torneo está finalizado o no existe' using errcode = '22023';
  end if;
end;
$$;

create function public.tournament_add_participant(p_tournament uuid, p_name text, p_consent boolean)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare participant_id uuid;
begin
  perform private.require_permission('torneos.participantes');
  perform private.require_open_tournament(p_tournament);
  if p_consent is not true then
    raise exception 'La persona debe aceptar aparecer en la tabla' using errcode = '22023';
  end if;
  -- Keeps every leaderboard small enough to rank on the fly.
  if (select count(*) from public.tournament_participants
      where tournament_id = p_tournament and deleted_at is null) >= 500 then
    raise exception 'El torneo alcanzó el máximo de 500 participantes' using errcode = '22023';
  end if;
  insert into public.tournament_participants(tournament_id, display_name, consent_at, created_by)
    values (p_tournament, btrim(p_name), now(), (select auth.uid()))
    returning id into participant_id;
  return participant_id;
end;
$$;

create function public.tournament_rename_participant(p_id uuid, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  perform private.require_permission('torneos.participantes');
  select tournament_id into target from public.tournament_participants where id = p_id and deleted_at is null;
  if target is null then raise exception 'No existe el participante' using errcode = 'P0002'; end if;
  perform private.require_open_tournament(target);
  update public.tournament_participants set display_name = btrim(p_name) where id = p_id;
end;
$$;

create function public.tournament_remove_participant(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  perform private.require_permission('torneos.participantes');
  select tournament_id into target from public.tournament_participants where id = p_id and deleted_at is null;
  if target is null then raise exception 'No existe el participante' using errcode = 'P0002'; end if;
  perform private.require_open_tournament(target);
  -- Soft delete: the name leaves the site, the score history stays for the audit.
  update public.tournament_participants set deleted_at = now() where id = p_id;
end;
$$;

create function public.tournament_add_points(p_participant uuid, p_points integer, p_reason text default null)
returns integer
language plpgsql security definer set search_path = '' as $$
declare target uuid; total integer;
begin
  perform private.require_permission('torneos.puntos');
  if p_points is null or p_points = 0 or p_points not between -1000 and 1000 then
    raise exception 'Ingresá entre -1000 y 1000 puntos, distinto de cero' using errcode = '22023';
  end if;
  -- The row lock serializes concurrent scoring for the same person.
  select tournament_id into target from public.tournament_participants
    where id = p_participant and deleted_at is null for update;
  if target is null then raise exception 'No existe el participante' using errcode = 'P0002'; end if;
  perform private.require_open_tournament(target);
  insert into public.tournament_scores(tournament_id, participant_id, points, reason, created_by)
    values (target, p_participant, p_points, nullif(btrim(p_reason), ''), (select auth.uid()));
  update public.tournament_participants set points = points + p_points
    where id = p_participant returning points into total;
  return total;
end;
$$;

create function public.tournament_admin_list(p_before timestamptz default null, p_id uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  return coalesce((
    select jsonb_agg(to_jsonb(page) order by page.created_at desc, page.id desc) from (
      select t.id, t.name, t.place, t.starts_on, t.ends_on, t.status, t.created_at, t.updated_at,
        (select count(*) from public.tournament_participants p
          where p.tournament_id = t.id and p.deleted_at is null) as participants
      from public.tournaments t
      where p_before is null or (t.created_at, t.id) < (p_before, p_id)
      order by t.created_at desc, t.id desc limit 20
    ) page), '[]'::jsonb);
end;
$$;

create function public.tournament_admin_get(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  return (select to_jsonb(row) from (
    select t.id, t.name, t.place, t.starts_on, t.ends_on, t.status, t.created_at, t.updated_at,
      (select count(*) from public.tournament_participants p
        where p.tournament_id = t.id and p.deleted_at is null) as participants
    from public.tournaments t where t.id = p_id) row);
end;
$$;

-- Same order and positions as the public table, also for drafts, with a bounded prefix search.
create function public.tournament_admin_participants(p_tournament uuid, p_search text default '',
  p_points integer default null, p_name text default null, p_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('torneos.ver');
  if p_search is null or char_length(p_search) > 80 then
    raise exception 'Filtro inválido' using errcode = '22023';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(page) - 'sort_name' order by page.points desc, page.sort_name, page.id) from (
      select ranked.* from (
        select p.id, p.display_name, p.points, p.updated_at, lower(p.display_name) as sort_name,
          rank() over (order by p.points desc) as ranking
        from public.tournament_participants p
        where p.tournament_id = p_tournament and p.deleted_at is null
      ) ranked
      where (p_search = '' or starts_with(ranked.sort_name, lower(btrim(p_search))))
        and (p_points is null or ranked.points < p_points
          or (ranked.points = p_points and (ranked.sort_name, ranked.id) > (lower(p_name), p_id)))
      order by ranked.points desc, ranked.sort_name, ranked.id limit 50
    ) page), '[]'::jsonb);
end;
$$;

revoke all on function private.tournament_data(jsonb), private.require_open_tournament(uuid)
  from public, anon, authenticated;
revoke all on function public.tournament_save(jsonb, uuid, timestamptz), public.tournament_set_status(uuid, text),
  public.tournament_add_participant(uuid, text, boolean), public.tournament_rename_participant(uuid, text),
  public.tournament_remove_participant(uuid), public.tournament_add_points(uuid, integer, text),
  public.tournament_admin_list(timestamptz, uuid), public.tournament_admin_get(uuid),
  public.tournament_admin_participants(uuid, text, integer, text, uuid) from public, anon;
grant execute on function public.tournament_save(jsonb, uuid, timestamptz), public.tournament_set_status(uuid, text),
  public.tournament_add_participant(uuid, text, boolean), public.tournament_rename_participant(uuid, text),
  public.tournament_remove_participant(uuid), public.tournament_add_points(uuid, integer, text),
  public.tournament_admin_list(timestamptz, uuid), public.tournament_admin_get(uuid),
  public.tournament_admin_participants(uuid, text, integer, text, uuid) to authenticated;

-- Like the other modules, every tournament action requires seeing the section.
create or replace function public.admin_save_role(p_name text, p_permissions text[], p_id uuid default null, p_version timestamptz default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare role_id uuid := coalesce(p_id, gen_random_uuid()); previous public.roles; perm text;
begin
  perform pg_advisory_xact_lock(81061108);
  perform private.require_permission('roles.gestionar');
  if p_permissions is null or cardinality(p_permissions) > 30 then raise exception 'Permisos inválidos' using errcode = '22023'; end if;
  foreach perm in array p_permissions loop
    if not exists(select 1 from public.permissions where id = perm and not reserved) then raise exception 'Permiso reservado o desconocido' using errcode = '42501'; end if;
    if split_part(perm,'.',1) in ('noticias','eventos','tarifas','usuarios','torneos') and not (split_part(perm,'.',1)||'.ver' = any(p_permissions)) then
      raise exception 'Se requiere permiso de lectura del módulo' using errcode = '22023';
    end if;
  end loop;
  if p_id is not null then
    select * into previous from public.roles where id=p_id for update;
    if not found or previous.is_system then raise exception 'Rol protegido o inexistente' using errcode = '42501'; end if;
    if p_version is null or previous.updated_at <> p_version then raise exception 'El rol cambió. Actualizá antes de guardar.' using errcode = '40001'; end if;
    update public.roles set name=btrim(p_name) where id=p_id;
    delete from public.role_permissions where role_permissions.role_id = p_id;
  else insert into public.roles(id,name) values(role_id,btrim(p_name)); end if;
  insert into public.role_permissions(role_id,permission_id) select role_id, unnest(p_permissions) on conflict do nothing;
  return role_id;
end;
$$;

commit;
