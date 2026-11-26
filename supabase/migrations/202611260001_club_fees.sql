-- Club fees ("Cuotas y servicios"): the membership fees and service prices the club
-- posts at the office. One schedule row holds when the values apply from; each fee
-- belongs to one of two lists and keeps its own order. Pool rates stay separate.
begin;

insert into public.permissions(id, label, reserved) values
  ('cuotas.ver', 'Ver cuotas y servicios', false),
  ('cuotas.editar', 'Editar y publicar cuotas y servicios', false);
-- Ready-made role; a general administrator assigns it to invited accounts.
with treasurer as (insert into public.roles(name) values ('Tarifas del club') returning id)
insert into public.role_permissions(role_id, permission_id)
  select id, unnest(array['cuotas.ver','cuotas.editar']) from treasurer;

create table public.fee_schedules (
  id integer primary key default 1 check (id = 1),
  -- Shown as month and year ("desde octubre de 2026"), so it is always the 1st.
  valid_from date not null check (extract(day from valid_from) = 1),
  note text check (note is null or char_length(btrim(note)) between 1 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.fees (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('membership','service')),
  position integer not null check (position between 0 and 19),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  detail text check (detail is null or char_length(btrim(detail)) between 1 and 120),
  icon text not null check (icon in ('person','family','senior','sailboat','boat','garage',
    'rack','kayak','anchor','tent','caravan','motorhome','ticket')),
  price_cents integer not null check (price_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fees_position unique (kind, position)
);

alter table public.fee_schedules enable row level security;
alter table public.fees enable row level security;
revoke all on public.fee_schedules, public.fees from public, anon, authenticated;
grant all on public.fee_schedules, public.fees to service_role;
-- Public prices; staff identity is never stored on these rows.
grant select on public.fee_schedules, public.fees to anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['fee_schedules','fees'] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_public_read', t);
    execute format('create policy %I on public.%I for insert to anon, authenticated with check (false)', t || '_deny_insert', t);
    execute format('create policy %I on public.%I for update to anon, authenticated using (false) with check (false)', t || '_deny_update', t);
    execute format('create policy %I on public.%I for delete to anon, authenticated using (false)', t || '_deny_delete', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_content_updated_at()', t || '_updated', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.audit_change()', t || '_audit', t);
  end loop;
end;
$$;

-- Values from the notice "Nuevos valores, octubre 2026" posted at the club.
insert into public.fee_schedules(id, valid_from) values (1, date '2026-10-01');
insert into public.fees(kind, position, name, icon, price_cents) values
  ('membership', 0, 'Social', 'person', 3000000),
  ('membership', 1, 'Familiar', 'family', 3000000),
  ('membership', 2, 'Jubilado', 'senior', 2400000),
  ('membership', 3, 'Náutica', 'sailboat', 7500000),
  ('membership', 4, 'G/Cerrada', 'garage', 17600000),
  ('membership', 5, 'G/Abierta', 'rack', 12800000),
  ('membership', 6, 'G/Kayaks', 'kayak', 5000000),
  ('membership', 7, 'V/Náutica', 'boat', 4500000),
  ('membership', 8, 'Cadete', 'anchor', 1400000),
  ('service', 0, 'Visita no socio', 'ticket', 1200000),
  ('service', 1, 'Bajada no socio', 'boat', 8500000),
  ('service', 2, 'Carpa', 'tent', 1200000),
  ('service', 3, 'Casilla rodante', 'caravan', 2400000),
  ('service', 4, 'Motorhome', 'motorhome', 3600000),
  ('service', 5, 'Amarre empresas', 'boat', 20000000);

create function public.admin_get_fees() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('cuotas.ver');
  return (select jsonb_build_object(
    'valid_from', s.valid_from, 'note', s.note, 'updated_at', s.updated_at,
    'fees', coalesce((select jsonb_agg(jsonb_build_object(
      'id', f.id, 'kind', f.kind, 'name', f.name, 'detail', f.detail, 'icon', f.icon,
      'price_cents', f.price_cents) order by f.kind, f.position)
      from public.fees f), '[]'::jsonb))
    from public.fee_schedules s where s.id = 1);
end;
$$;

-- Saves the schedule and both ordered lists at once, under one version, so the site
-- never shows half of a price update.
create function public.admin_save_fees(p_data jsonb, p_version timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare previous public.fee_schedules; item jsonb; known uuid[]; item_id uuid; item_kind text;
  positions jsonb := '{"membership":0,"service":0}'::jsonb; idx integer;
begin
  perform pg_advisory_xact_lock(81061126);
  perform private.require_permission('cuotas.editar');
  if jsonb_typeof(p_data) is distinct from 'object' or jsonb_typeof(p_data->'fees') is distinct from 'array'
    or jsonb_array_length(p_data->'fees') not between 1 and 40 then
    raise exception 'Cargá entre 1 y 40 valores' using errcode = '22023';
  end if;
  select * into previous from public.fee_schedules where id = 1 for update;
  if not found then raise exception 'La sección no existe' using errcode = 'P0002'; end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'Los valores cambiaron. Actualizá antes de guardar.' using errcode = '40001';
  end if;
  update public.fee_schedules set valid_from = (p_data->>'valid_from')::date,
    note = nullif(btrim(coalesce(p_data->>'note', '')), '') where id = 1;
  select coalesce(array_agg(id), '{}') into known from public.fees;
  delete from public.fees;
  for item in select value from jsonb_array_elements(p_data->'fees') loop
    if jsonb_typeof(item) <> 'object' then raise exception 'Valor inválido' using errcode = '22023'; end if;
    item_kind := item->>'kind';
    if item_kind is null or not positions ? item_kind then
      raise exception 'Valor inválido' using errcode = '22023';
    end if;
    idx := (positions->>item_kind)::integer;
    -- Existing rows keep their id so the audit history follows each price.
    item_id := case when (item->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (item->>'id')::uuid = any(known) then (item->>'id')::uuid else gen_random_uuid() end;
    insert into public.fees(id, kind, position, name, detail, icon, price_cents)
    values (item_id, item_kind, idx, btrim(item->>'name'), nullif(btrim(coalesce(item->>'detail', '')), ''),
      item->>'icon', (item->>'price_cents')::integer);
    positions := jsonb_set(positions, array[item_kind], to_jsonb(idx + 1));
  end loop;
  return public.admin_get_fees();
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
    if split_part(perm,'.',1) in ('noticias','eventos','tarifas','usuarios','torneos','instalaciones','cuotas') and not (split_part(perm,'.',1)||'.ver' = any(p_permissions)) then
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

revoke all on function public.admin_get_fees(), public.admin_save_fees(jsonb, timestamptz),
  public.admin_save_role(text, text[], uuid, timestamptz) from public, anon;
grant execute on function public.admin_get_fees(), public.admin_save_fees(jsonb, timestamptz),
  public.admin_save_role(text, text[], uuid, timestamptz) to authenticated;

commit;
