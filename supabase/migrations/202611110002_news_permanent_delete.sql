-- Permanent deletion of archived news and removal of cover images nobody uses.
-- Archiving stays reversible; only an explicit, separately permitted action deletes.
begin;

insert into public.permissions(id, label, reserved) values
  ('noticias.eliminar', 'Eliminar noticias definitivamente', false);

-- Path inside the news-images bucket that a cover URL points to; null for external links.
create function private.news_image_path(p_url text) returns text
language sql immutable set search_path = '' as $$
  select nullif(split_part(p_url, '/storage/v1/object/public/news-images/', 2), '')
$$;
create index news_image_path_idx on public.news (private.news_image_path(image_url));

-- SECURITY DEFINER so the check sees drafts and archived news hidden from the caller by RLS.
-- Without permission it reports "in use", which never allows a delete.
create function public.news_image_in_use(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not public.has_permission('noticias.editar')
    or exists (select 1 from public.news n where private.news_image_path(n.image_url) = p_name)
$$;
revoke all on function public.news_image_in_use(text) from public, anon;
grant execute on function public.news_image_in_use(text) to authenticated;

-- Fresh uploads may belong to an editor still working on a draft; others wait 24 h.
drop policy news_images_deny_delete on storage.objects;
create policy news_images_delete_unused on storage.objects for delete to authenticated
using (
  bucket_id = 'news-images'
  and (select public.has_permission('noticias.editar'))
  and (owner_id = (select auth.uid())::text or created_at < now() - interval '24 hours')
  and not public.news_image_in_use(name)
);

create function public.admin_delete_news(p_id uuid, p_version timestamptz) returns text
language plpgsql security definer set search_path = '' as $$
declare previous public.news; path text;
begin
  perform private.require_permission('noticias.ver');
  perform private.require_permission('noticias.eliminar');
  select * into previous from public.news where id = p_id for update;
  if not found then raise exception 'No existe el contenido' using errcode = 'P0002'; end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'El contenido cambió. Actualizá antes de guardar.' using errcode = '40001';
  end if;
  if previous.deleted_at is null then
    raise exception 'Enviá la noticia a la papelera antes de eliminarla' using errcode = '22023';
  end if;
  -- The audit trigger keeps the full previous row, so the deletion remains traceable.
  delete from public.news where id = p_id;
  path := private.news_image_path(previous.image_url);
  -- Returned only when no other news shares the image, for the client to remove it.
  return case when path is not null and not public.news_image_in_use(path) then path end;
end;
$$;
revoke all on function public.admin_delete_news(uuid, timestamptz) from public, anon;
grant execute on function public.admin_delete_news(uuid, timestamptz) to authenticated;

-- Bounded batch of abandoned uploads (replaced covers, unsaved drafts) older than 24 h.
create function public.admin_unused_news_images() returns text[]
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('noticias.editar');
  return coalesce((
    select array_agg(name) from (
      select o.name from storage.objects o
      where o.bucket_id = 'news-images' and o.created_at < now() - interval '24 hours'
        and not exists (select 1 from public.news n where private.news_image_path(n.image_url) = o.name)
      order by o.created_at limit 50
    ) unused
  ), '{}');
end;
$$;
revoke all on function public.admin_unused_news_images() from public, anon;
grant execute on function public.admin_unused_news_images() to authenticated;

commit;
