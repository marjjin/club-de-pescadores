begin;

-- One current measurement; previous values remain in the protected audit log.
create table public.river_levels (
  id integer primary key default 1 check (id = 1),
  height_cm integer not null check (height_cm between -10000 and 10000),
  measured_at timestamptz not null check (measured_at <= now()),
  station text not null check (char_length(btrim(station)) between 1 and 120),
  source text not null check (char_length(btrim(source)) between 1 and 160),
  note text check (note is null or char_length(btrim(note)) between 1 and 300),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.river_levels enable row level security;
revoke all on public.river_levels from public, anon, authenticated;
grant select on public.river_levels to anon, authenticated;
grant all on public.river_levels to service_role;
create policy river_levels_public_read on public.river_levels for select to anon, authenticated
  using (is_published and measured_at <= now());
create policy river_levels_deny_insert on public.river_levels for insert to anon, authenticated with check (false);
create policy river_levels_deny_update on public.river_levels for update to anon, authenticated using (false) with check (false);
create policy river_levels_deny_delete on public.river_levels for delete to anon, authenticated using (false);
create trigger river_levels_updated before update on public.river_levels
  for each row execute function public.set_content_updated_at();
create trigger river_levels_audit after insert or update or delete on public.river_levels
  for each row execute function private.audit_change();

-- This module is reserved to the existing general administrator, with MFA.
insert into public.permissions(id, label, reserved) values ('rio.gestionar', 'Actualizar altura del río', true);

create function public.admin_get_river_level() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('rio.gestionar');
  return (select to_jsonb(r) from public.river_levels r where id = 1);
end;
$$;

create function public.admin_save_river_level(p_data jsonb, p_version timestamptz default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare previous public.river_levels; reading public.river_levels; result jsonb;
begin
  perform pg_advisory_xact_lock(81061108);
  perform private.require_permission('rio.gestionar');
  if jsonb_typeof(p_data) is distinct from 'object' then
    raise exception 'Medición inválida' using errcode = '22023';
  end if;
  select * into previous from public.river_levels where id = 1 for update;
  if found then
    if p_version is null or previous.updated_at <> p_version then
      raise exception 'La medición cambió. Actualizá antes de guardar.' using errcode = '40001';
    end if;
  elsif p_version is not null then
    raise exception 'La medición ya no existe' using errcode = '40001';
  end if;
  reading := jsonb_populate_record(null::public.river_levels, p_data);
  if reading.measured_at > now() then
    raise exception 'La fecha de medición no puede ser futura' using errcode = '22023';
  end if;
  insert into public.river_levels(id,height_cm,measured_at,station,source,note,is_published)
    values(1,reading.height_cm,reading.measured_at,btrim(reading.station),btrim(reading.source),nullif(btrim(reading.note),''),reading.is_published)
    on conflict(id) do update set height_cm=excluded.height_cm,measured_at=excluded.measured_at,
      station=excluded.station,source=excluded.source,note=excluded.note,is_published=excluded.is_published
    returning to_jsonb(river_levels) into result;
  return result;
end;
$$;
revoke all on function public.admin_get_river_level() from public, anon;
revoke all on function public.admin_save_river_level(jsonb,timestamptz) from public, anon;
grant execute on function public.admin_get_river_level() to authenticated;
grant execute on function public.admin_save_river_level(jsonb,timestamptz) to authenticated;

comment on table public.river_levels is 'Current manually verified river level, in integer centimetres. No navigation or flood safety classification.';
commit;
