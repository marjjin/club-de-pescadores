begin;
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('news-images', 'news-images', true, 5242880, array['image/jpeg','image/png','image/webp']);
create policy news_images_insert on storage.objects for insert to authenticated
with check (bucket_id = 'news-images' and (select public.has_permission('noticias.editar'))
  and (select public.has_permission('noticias.ver'))
  and split_part(name, '/', 1) = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|png)$');
create policy news_images_read on storage.objects for select to authenticated
using (bucket_id = 'news-images' and (select public.has_permission('noticias.ver')));
-- Images have immutable random names; overwrites and browser deletes stay denied.
create policy news_images_deny_update on storage.objects for update to authenticated
using (false) with check (false);
create policy news_images_deny_delete on storage.objects for delete to authenticated using (false);
commit;
