-- Editable "Instalaciones" section of the home page: a heading plus up to eight
-- cards. The four original photos ship with the site (default_image) until staff
-- upload a replacement to the club-media bucket (image_path).
begin;

insert into public.permissions(id, label, reserved) values
  ('instalaciones.ver', 'Ver instalaciones', false),
  ('instalaciones.editar', 'Editar instalaciones y sus fotos', false);

create table public.facility_sections (
  id integer primary key default 1 check (id = 1),
  title text not null check (char_length(btrim(title)) between 2 and 80),
  description text not null check (char_length(btrim(description)) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  position integer not null check (position between 0 and 7),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  description text not null check (char_length(btrim(description)) between 1 and 160),
  image_path text check (image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'),
  default_image text check (default_image in ('pier','hall','grill','river')),
  image_alt text not null check (char_length(btrim(image_alt)) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(image_path, default_image) = 1),
  constraint facilities_position unique (position)
);
create index facilities_image_path on public.facilities (image_path) where image_path is not null;

alter table public.facility_sections enable row level security;
alter table public.facilities enable row level security;
revoke all on public.facility_sections, public.facilities from public, anon, authenticated;
grant all on public.facility_sections, public.facilities to service_role;
-- Everything here is public content; staff identity is never stored on these rows.
grant select on public.facility_sections, public.facilities to anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['facility_sections','facilities'] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_public_read', t);
    execute format('create policy %I on public.%I for insert to anon, authenticated with check (false)', t || '_deny_insert', t);
    execute format('create policy %I on public.%I for update to anon, authenticated using (false) with check (false)', t || '_deny_update', t);
    execute format('create policy %I on public.%I for delete to anon, authenticated using (false)', t || '_deny_delete', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_content_updated_at()', t || '_updated', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.audit_change()', t || '_audit', t);
  end loop;
end;
$$;

-- Same texts and photos the site showed before this section became editable.
insert into public.facility_sections(id, title, description) values
  (1, 'Un espacio pensado para los socios', 'Todo lo que necesitás para disfrutar del río, en familia o con amigos.');
insert into public.facilities(position, name, description, default_image, image_alt) values
  (0, 'Muelle', 'Acceso al río y espacio para disfrutar la pesca.', 'pier', 'Sede amarilla del club y muelle con baranda sobre el río'),
  (1, 'Quincho', 'Ideal para reuniones y encuentros.', 'hall', 'Quincho con mesas de material y paredes amarillas'),
  (2, 'Parrillas', 'Espacio equipado para disfrutar en familia.', 'grill', 'Parrilla grande y mesas largas bajo techo'),
  (3, 'Entorno natural', 'Ubicación privilegiada sobre el río.', 'river', 'Río, costa arbolada y bajada de lanchas');

-- Facility editors upload to the shared club-media bucket like news and pier staff.
create or replace function public.can_manage_media() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_permission('muelle.publicar') or public.has_permission('noticias.editar')
    or public.has_permission('instalaciones.editar')
$$;

-- A photo shown in the facilities section is in use: never deletable, never pruned.
create or replace function public.club_media_in_use(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not public.can_manage_media()
    or exists (select 1 from public.media_items m where m.path = p_name or m.poster_path = p_name)
    or exists (select 1 from public.facilities f where f.image_path = p_name)
$$;

create or replace function public.admin_prune_club_media() returns text[]
language plpgsql security definer set search_path = '' as $$
declare expired text[]; unused text[];
begin
  if not public.can_manage_media() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  with old as (
    delete from public.media_items m where m.id in (
      select m2.id from public.media_items m2 join public.pier_reports p on p.id = m2.pier_report_id
      where p.created_at < now() - interval '30 days' limit 50)
    returning m.path, m.poster_path
  )
  select coalesce(array_agg(path) || array_agg(poster_path) filter (where poster_path is not null), '{}')
    into expired from old;
  select coalesce(array_agg(name), '{}') into unused from (
    select o.name from storage.objects o
    where o.bucket_id = 'club-media' and o.created_at < now() - interval '24 hours'
      and not exists (select 1 from public.media_items m where m.path = o.name or m.poster_path = o.name)
      and not exists (select 1 from public.facilities f where f.image_path = o.name)
    order by o.created_at limit 50
  ) t;
  return expired || unused;
end;
$$;

create function public.admin_get_facilities() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('instalaciones.ver');
  return (select jsonb_build_object(
    'title', s.title, 'description', s.description, 'updated_at', s.updated_at,
    'cards', coalesce((select jsonb_agg(jsonb_build_object(
      'id', f.id, 'name', f.name, 'description', f.description, 'image_path', f.image_path,
      'default_image', f.default_image, 'image_alt', f.image_alt) order by f.position)
      from public.facilities f), '[]'::jsonb))
    from public.facility_sections s where s.id = 1);
end;
$$;

-- Saves the heading and the whole ordered card list at once, under one version.
create function public.admin_save_facilities(p_data jsonb, p_version timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare previous public.facility_sections; card jsonb; idx integer := 0; kept text[]; known uuid[];
  card_id uuid; photo text;
begin
  perform pg_advisory_xact_lock(81061117);
  perform private.require_permission('instalaciones.editar');
  if jsonb_typeof(p_data) is distinct from 'object' or jsonb_typeof(p_data->'cards') is distinct from 'array'
    or jsonb_array_length(p_data->'cards') not between 1 and 8 then
    raise exception 'La sección admite entre 1 y 8 tarjetas' using errcode = '22023';
  end if;
  select * into previous from public.facility_sections where id = 1 for update;
  if not found then raise exception 'La sección no existe' using errcode = 'P0002'; end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'La sección cambió. Actualizá antes de guardar.' using errcode = '40001';
  end if;
  update public.facility_sections set title = btrim(p_data->>'title'), description = btrim(p_data->>'description')
    where id = 1;
  select coalesce(array_agg(image_path) filter (where image_path is not null), '{}'), coalesce(array_agg(id), '{}')
    into kept, known from public.facilities;
  delete from public.facilities;
  for card in select value from jsonb_array_elements(p_data->'cards') loop
    if jsonb_typeof(card) <> 'object' then raise exception 'Tarjeta inválida' using errcode = '22023'; end if;
    photo := nullif(card->>'image_path', '');
    -- A photo can be used only if it is already shown here or the caller just uploaded it.
    if photo is not null and not (photo = any(kept) or exists (select 1 from storage.objects o
        where o.bucket_id = 'club-media' and o.name = photo and o.owner_id = (select auth.uid())::text)) then
      raise exception 'Foto no disponible' using errcode = '42501';
    end if;
    -- Existing cards keep their id so the audit history follows each card.
    card_id := case when (card->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (card->>'id')::uuid = any(known) then (card->>'id')::uuid else gen_random_uuid() end;
    insert into public.facilities(id, position, name, description, image_path, default_image, image_alt)
    values (card_id, idx, btrim(card->>'name'), btrim(card->>'description'), photo,
      case when photo is null then nullif(card->>'default_image', '') end, btrim(card->>'image_alt'));
    idx := idx + 1;
  end loop;
  return public.admin_get_facilities();
end;
$$;

-- admin_save_role: the new module also requires its "ver" permission.
create or replace function public.admin_save_role(p_name text, p_permissions text[], p_id uuid default null, p_version timestamptz default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare role_id uuid := coalesce(p_id, gen_random_uuid()); previous public.roles; perm text; retained_count integer;
begin
  perform pg_advisory_xact_lock(81061108);
  perform private.require_permission('roles.gestionar');
  if p_permissions is null or cardinality(p_permissions) > 30 then raise exception 'Permisos inválidos' using errcode = '22023'; end if;
  foreach perm in array p_permissions loop
    if not private.is_panel_permission(perm)
      or not exists(select 1 from public.permissions where id = perm and not reserved) then
      raise exception 'Permiso reservado, retirado o desconocido' using errcode = '42501';
    end if;
    if split_part(perm,'.',1) in ('noticias','eventos','tarifas','usuarios','torneos','instalaciones') and not (split_part(perm,'.',1)||'.ver' = any(p_permissions)) then
      raise exception 'Se requiere permiso de lectura del módulo' using errcode = '22023';
    end if;
  end loop;
  if p_id is not null then
    select * into previous from public.roles where id=p_id for update;
    if not found or previous.is_system then raise exception 'Rol protegido o inexistente' using errcode = '42501'; end if;
    if p_version is null or previous.updated_at <> p_version then raise exception 'El rol cambió. Actualizá antes de guardar.' using errcode = '40001'; end if;
    select count(*) into retained_count from public.role_permissions rp
      where rp.role_id = p_id and not private.is_panel_permission(rp.permission_id);
    if retained_count + (select count(distinct requested.id) from unnest(p_permissions) requested(id)) > 30 then
      raise exception 'El rol admite hasta 30 permisos en total' using errcode = '22023';
    end if;
    update public.roles set name=btrim(p_name) where id=p_id;
    -- Permissions outside this panel are neither shown nor silently discarded.
    delete from public.role_permissions where role_permissions.role_id = p_id
      and private.is_panel_permission(permission_id);
  else insert into public.roles(id,name) values(role_id,btrim(p_name)); end if;
  insert into public.role_permissions(role_id,permission_id) select role_id, unnest(p_permissions) on conflict do nothing;
  return role_id;
end;
$$;

revoke all on function public.can_manage_media(), public.club_media_in_use(text),
  public.admin_prune_club_media(), public.admin_get_facilities(),
  public.admin_save_facilities(jsonb, timestamptz), public.admin_save_role(text, text[], uuid, timestamptz)
  from public, anon;
grant execute on function public.can_manage_media(), public.club_media_in_use(text),
  public.admin_prune_club_media(), public.admin_get_facilities(),
  public.admin_save_facilities(jsonb, timestamptz), public.admin_save_role(text, text[], uuid, timestamptz)
  to authenticated;

commit;
