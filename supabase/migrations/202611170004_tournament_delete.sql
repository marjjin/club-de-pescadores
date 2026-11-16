-- Permanent deletion of an archived tournament: its entries, points, categories and
-- agenda event go with it. People stay in the registry for future tournaments, and
-- the audit triggers keep a copy of every deleted row.
begin;

create function public.tournament_delete(p_id uuid, p_version timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare previous public.tournaments;
begin
  perform pg_advisory_xact_lock(81061120);
  perform private.require_permission('torneos.gestionar');
  select * into previous from public.tournaments where id = p_id for update;
  if not found then raise exception 'No existe el torneo' using errcode = 'P0002'; end if;
  -- Two steps on purpose: archiving hides it first, deleting is a separate decision.
  if previous.status <> 'archived' then
    raise exception 'Archivá el torneo antes de eliminarlo' using errcode = '22023';
  end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'El torneo cambió. Actualizá antes de eliminarlo.' using errcode = '40001';
  end if;
  -- The agenda event is protected from direct edits; this is the tournament itself.
  perform set_config('app.tournament_event_sync', 'on', true);
  delete from public.events where tournament_id = p_id;
  perform set_config('app.tournament_event_sync', 'off', true);
  delete from public.tournament_scores where tournament_id = p_id;
  delete from public.tournament_participants where tournament_id = p_id;
  delete from public.tournament_category_links where tournament_id = p_id;
  delete from public.tournaments where id = p_id;
end;
$$;
revoke all on function public.tournament_delete(uuid, timestamptz) from public, anon;
grant execute on function public.tournament_delete(uuid, timestamptz) to authenticated;

commit;
