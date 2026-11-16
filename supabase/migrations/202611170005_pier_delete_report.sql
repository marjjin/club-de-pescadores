-- Deleting a pier report removes a wrong measurement for good, with its photos and
-- videos. If it was the height the site shows, the river bar falls back to the
-- previous published report, or hides when none is left: it never keeps a deleted value.
begin;

create function public.pier_delete_report(p_id uuid) returns text[]
language plpgsql security definer set search_path = '' as $$
declare report public.pier_reports; river public.river_levels; fallback public.pier_reports; files text[];
begin
  perform private.require_permission('muelle.publicar');
  -- Same lock order as publishing, so a new report and a deletion cannot interleave.
  select * into river from public.river_levels where id = 1 for update;
  select * into report from public.pier_reports where id = p_id for update;
  if not found then raise exception 'No existe el parte' using errcode = 'P0002'; end if;
  select coalesce(array_agg(m.path) || array_agg(m.poster_path) filter (where m.poster_path is not null), '{}')
    into files from public.media_items m where m.pier_report_id = p_id;
  -- media_items cascade; the audit triggers keep a copy of both rows.
  delete from public.pier_reports where id = p_id;
  if river.id is not null and river.measured_at = report.measured_at and river.height_cm = report.height_cm then
    select * into fallback from public.pier_reports where is_published
      order by measured_at desc, created_at desc limit 1;
    if found then
      update public.river_levels set height_cm = fallback.height_cm, measured_at = fallback.measured_at,
        is_published = true where id = 1;
    else
      update public.river_levels set is_published = false where id = 1;
    end if;
  end if;
  -- The client removes these files; Storage refuses any that something still uses.
  return files;
end;
$$;
revoke all on function public.pier_delete_report(uuid) from public, anon;
grant execute on function public.pier_delete_report(uuid) to authenticated;

commit;
