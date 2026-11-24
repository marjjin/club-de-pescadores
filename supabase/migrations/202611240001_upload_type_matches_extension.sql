begin;
-- Ties each file's extension to the Content-Type Storage records for it, so a
-- `.jpg` cannot be served as `video/mp4`. Storage first checks the policy without
-- metadata (a permission probe before the upload) and then inserts the row with
-- metadata->>'mimetype' filled in; a missing mimetype therefore has to pass, and the
-- final insert is the one that enforces the match. The mimetype is still what the
-- client declared: this checks consistency, not the file's real content.
alter policy news_images_insert on storage.objects
with check (bucket_id = 'news-images' and (select public.has_permission('noticias.editar'))
  and (select public.has_permission('noticias.ver'))
  and split_part(name, '/', 1) = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|png)$'
  and (metadata->>'mimetype' is null
    or lower(split_part(metadata->>'mimetype', ';', 1)) = case substring(name from '\.([a-z]+)$')
      when 'webp' then 'image/webp' when 'jpg' then 'image/jpeg' when 'png' then 'image/png' end));
alter policy club_media_insert on storage.objects
with check (bucket_id = 'club-media' and (select public.can_manage_media())
  and split_part(name, '/', 1) = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|mp4|webm|mov)$'
  and (metadata->>'mimetype' is null
    or lower(split_part(metadata->>'mimetype', ';', 1)) = case substring(name from '\.([a-z0-9]+)$')
      when 'webp' then 'image/webp' when 'jpg' then 'image/jpeg' when 'mp4' then 'video/mp4'
      when 'webm' then 'video/webm' when 'mov' then 'video/quicktime' end));
commit;
