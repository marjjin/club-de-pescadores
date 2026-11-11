-- Daily pier report: staff publish the river height, the conditions and several
-- photos or videos in one step. media_items is shared with news galleries.
begin;

insert into public.permissions(id, label, reserved) values
  ('muelle.publicar', 'Publicar partes del muelle', false);
-- Ready-made role for staff; a general administrator assigns it to invited accounts.
with staff as (insert into public.roles(name) values ('Empleado del muelle') returning id)
insert into public.role_permissions(role_id, permission_id) select id, 'muelle.publicar' from staff;

-- Lets the panel route staff to their reduced workspace.
create or replace function public.admin_context() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'active', exists(select 1 from public.admin_accounts where id = (select auth.uid()) and active),
    'general', exists(select 1 from public.admin_accounts a join public.user_roles ur on ur.user_id = a.id
      join public.roles r on r.id = ur.role_id where a.id = (select auth.uid()) and a.active and r.is_system),
    'pier', public.has_permission('muelle.publicar'),
    'aal2', coalesce((select auth.jwt()->>'aal') = 'aal2', false)
  );
$$;

create function public.can_manage_media() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_permission('muelle.publicar') or public.has_permission('noticias.editar')
$$;

-- 30 MB covers about a minute of phone video; the client also limits duration.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('club-media', 'club-media', true, 31457280,
  array['image/webp','image/jpeg','video/mp4','video/webm','video/quicktime']);
create policy club_media_insert on storage.objects for insert to authenticated
with check (bucket_id = 'club-media' and (select public.can_manage_media())
  and split_part(name, '/', 1) = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|mp4|webm|mov)$');
create policy club_media_read on storage.objects for select to authenticated
using (bucket_id = 'club-media' and (select public.can_manage_media()));

create table public.pier_reports (
  id uuid primary key default gen_random_uuid(),
  height_cm integer not null check (height_cm between -10000 and 10000),
  measured_at timestamptz not null check (measured_at <= now()),
  conditions text check (conditions is null or char_length(btrim(conditions)) between 1 and 600),
  is_published boolean not null default true,
  created_by uuid not null references public.admin_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pier_reports enable row level security;
revoke all on public.pier_reports from public, anon, authenticated;
-- Column grant: visitors never see which staff account published.
grant select (id, height_cm, measured_at, conditions, is_published, created_at)
  on public.pier_reports to anon, authenticated;
grant all on public.pier_reports to service_role;
create policy pier_reports_public_read on public.pier_reports for select to anon, authenticated
  using (is_published);
create policy pier_reports_deny_insert on public.pier_reports for insert to anon, authenticated with check (false);
create policy pier_reports_deny_update on public.pier_reports for update to anon, authenticated using (false) with check (false);
create policy pier_reports_deny_delete on public.pier_reports for delete to anon, authenticated using (false);
create index pier_reports_latest on public.pier_reports (created_at desc, id desc) where is_published;
create index pier_reports_cursor on public.pier_reports (created_at desc, id desc);
create trigger pier_reports_updated before update on public.pier_reports
  for each row execute function public.set_content_updated_at();
create trigger pier_reports_audit after insert or update or delete on public.pier_reports
  for each row execute function private.audit_change();

create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  news_id uuid references public.news(id) on delete cascade,
  pier_report_id uuid references public.pier_reports(id) on delete cascade,
  position integer not null check (position between 0 and 9),
  kind text not null check (kind in ('image','video')),
  path text not null check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|mp4|webm|mov)$'),
  poster_path text check (poster_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'),
  width integer not null check (width between 1 and 10000),
  height integer not null check (height between 1 and 10000),
  alt text not null check (char_length(btrim(alt)) between 1 and 300),
  created_at timestamptz not null default now(),
  check (num_nonnulls(news_id, pier_report_id) = 1),
  -- Images are optimized WebP/JPEG; videos always carry a poster to avoid loading them early.
  check ((kind = 'image') = (path ~ '\.(webp|jpg)$')),
  check ((kind = 'video') = (poster_path is not null)),
  unique (news_id, position),
  unique (pier_report_id, position)
);
alter table public.media_items enable row level security;
revoke all on public.media_items from public, anon, authenticated;
grant select on public.media_items to anon, authenticated;
grant all on public.media_items to service_role;
-- Visible exactly when its parent is visible to the caller (the parents' RLS applies).
create policy media_items_public_read on public.media_items for select to anon, authenticated
  using (
    exists (select 1 from public.news n where n.id = news_id and n.is_published
      and n.deleted_at is null and n.published_at <= now())
    or exists (select 1 from public.pier_reports p where p.id = pier_report_id and p.is_published)
  );
create policy media_items_deny_insert on public.media_items for insert to anon, authenticated with check (false);
create policy media_items_deny_update on public.media_items for update to anon, authenticated using (false) with check (false);
create policy media_items_deny_delete on public.media_items for delete to anon, authenticated using (false);
create index media_items_path on public.media_items (path);
create index media_items_poster_path on public.media_items (poster_path) where poster_path is not null;
create trigger media_items_audit after insert or update or delete on public.media_items
  for each row execute function private.audit_change();

-- Without permission it reports "in use", which never allows a delete.
create function public.club_media_in_use(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not public.can_manage_media()
    or exists (select 1 from public.media_items m where m.path = p_name or m.poster_path = p_name)
$$;
revoke all on function public.club_media_in_use(text) from public, anon;
grant execute on function public.club_media_in_use(text) to authenticated;
create policy club_media_delete_unused on storage.objects for delete to authenticated
using (
  bucket_id = 'club-media'
  and (select public.can_manage_media())
  and (owner_id = (select auth.uid())::text or created_at < now() - interval '24 hours')
  and not public.club_media_in_use(name)
);

-- Replaces a parent's media in one statement set. A file can be attached only if it
-- exists in the bucket and the caller uploaded it, or it was already attached here.
create function private.save_media(p_items jsonb, p_news_id uuid, p_report_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare kept text[]; item jsonb; idx integer := 0; videos integer := 0; file text;
begin
  if p_items is null then return; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 10 then
    raise exception 'Se admiten hasta 10 archivos' using errcode = '22023';
  end if;
  select coalesce(array_agg(m.path) || array_agg(m.poster_path) filter (where m.poster_path is not null), '{}')
    into kept from public.media_items m
    where m.news_id is not distinct from p_news_id and m.pier_report_id is not distinct from p_report_id;
  delete from public.media_items m
    where m.news_id is not distinct from p_news_id and m.pier_report_id is not distinct from p_report_id;
  for item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(item) <> 'object' then raise exception 'Archivo inválido' using errcode = '22023'; end if;
    if item->>'kind' = 'video' then videos := videos + 1; end if;
    if videos > 3 then raise exception 'Se admiten hasta 3 videos' using errcode = '22023'; end if;
    foreach file in array array_remove(array[item->>'path', item->>'poster_path'], null) loop
      if not (file = any(kept) or exists (select 1 from storage.objects o where o.bucket_id = 'club-media'
          and o.name = file and o.owner_id = (select auth.uid())::text)) then
        raise exception 'Archivo no disponible' using errcode = '42501';
      end if;
    end loop;
    insert into public.media_items(news_id, pier_report_id, position, kind, path, poster_path, width, height, alt)
    values (p_news_id, p_report_id, idx, item->>'kind', item->>'path', item->>'poster_path',
      (item->>'width')::integer, (item->>'height')::integer, btrim(item->>'alt'));
    idx := idx + 1;
  end loop;
end;
$$;
revoke all on function private.save_media(jsonb, uuid, uuid) from public, anon, authenticated;

create function public.pier_publish_report(p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare report public.pier_reports; river public.river_levels; height integer; measured timestamptz;
begin
  perform private.require_permission('muelle.publicar');
  if jsonb_typeof(p_data) is distinct from 'object' then
    raise exception 'Parte inválido' using errcode = '22023';
  end if;
  height := (p_data->>'height_cm')::integer;
  measured := (p_data->>'measured_at')::timestamptz;
  if height is null or measured is null or measured > now() then
    raise exception 'Revisá la altura y la fecha de medición' using errcode = '22023';
  end if;
  -- Station and source are fixed by a general administrator in the river section.
  select * into river from public.river_levels where id = 1 for update;
  if not found then
    raise exception 'Falta configurar el punto de medición del río' using errcode = 'P0002';
  end if;
  insert into public.pier_reports(height_cm, measured_at, conditions, created_by)
    values (height, measured, nullif(btrim(p_data->>'conditions'), ''), (select auth.uid()))
    returning * into report;
  perform private.save_media(coalesce(p_data->'media', '[]'::jsonb), null, report.id);
  -- A late report about an older measurement must not overwrite a newer height.
  if measured >= river.measured_at then
    update public.river_levels set height_cm = height, measured_at = measured, is_published = true where id = 1;
  end if;
  return to_jsonb(report) - 'created_by';
end;
$$;

create function public.pier_set_report_published(p_id uuid, p_published boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_permission('muelle.publicar');
  update public.pier_reports set is_published = coalesce(p_published, false) where id = p_id;
  if not found then raise exception 'No existe el parte' using errcode = 'P0002'; end if;
end;
$$;

create function public.pier_recent_reports(p_before timestamptz default null, p_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('muelle.publicar');
  return coalesce((
    select jsonb_agg(to_jsonb(page) order by page.created_at desc, page.id desc) from (
      select p.id, p.height_cm, p.measured_at, p.conditions, p.is_published, p.created_at,
        (select a.email from public.admin_accounts a where a.id = p.created_by) as author_email,
        (select count(*) from public.media_items m where m.pier_report_id = p.id)::integer as media_count
      from public.pier_reports p
      where p_before is null or (p.created_at, p.id) < (p_before, p_id)
      order by p.created_at desc, p.id desc limit 20
    ) page
  ), '[]'::jsonb);
end;
$$;

-- Pier media older than 30 days is detached to protect the free storage quota; the
-- returned files (plus abandoned uploads) are then removed by the client, in batches.
create function public.admin_prune_club_media() returns text[]
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
    order by o.created_at limit 50
  ) t;
  return expired || unused;
end;
$$;

revoke all on function public.pier_publish_report(jsonb) from public, anon;
revoke all on function public.pier_set_report_published(uuid, boolean) from public, anon;
revoke all on function public.pier_recent_reports(timestamptz, uuid) from public, anon;
revoke all on function public.admin_prune_club_media() from public, anon;
revoke all on function public.can_manage_media() from public, anon;
grant execute on function public.pier_publish_report(jsonb) to authenticated;
grant execute on function public.pier_set_report_published(uuid, boolean) to authenticated;
grant execute on function public.pier_recent_reports(timestamptz, uuid) to authenticated;
grant execute on function public.admin_prune_club_media() to authenticated;
-- Storage policies call it as the requesting user; it only reveals the caller's own access.
grant execute on function public.can_manage_media() to authenticated;

commit;
