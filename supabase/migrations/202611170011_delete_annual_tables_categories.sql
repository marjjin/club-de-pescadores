-- Permanent deletion of annual tables and tournament categories.
-- An annual table must be archived first (as tournaments are); deleting it drops its
-- links and preset categories, never a tournament or its points.
-- A category can only go when no tournament uses it, so no entry or score is lost.
begin;

create function public.annual_table_delete(p_id uuid, p_version timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare previous public.annual_tables;
begin
  perform private.require_permission('torneos.gestionar');
  select * into previous from public.annual_tables where id = p_id for update;
  if not found then raise exception 'No existe la tabla anual' using errcode = 'P0002'; end if;
  if previous.archived_at is null then
    raise exception 'Archivá la tabla anual antes de eliminarla' using errcode = '22023';
  end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'La tabla anual cambió. Actualizá antes de eliminarla.' using errcode = '40001';
  end if;
  delete from public.tournament_category_annual where annual_table_id = p_id;
  delete from public.annual_table_categories where annual_table_id = p_id;
  delete from public.annual_tables where id = p_id;
end;
$$;

create function public.tournament_category_delete(p_id uuid, p_version timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare previous public.tournament_categories;
begin
  perform private.require_permission('torneos.gestionar');
  -- The row lock also stops a tournament from taking the category meanwhile.
  select * into previous from public.tournament_categories where id = p_id for update;
  if not found then raise exception 'No existe la categoría' using errcode = 'P0002'; end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'La categoría cambió. Actualizá antes de eliminarla.' using errcode = '40001';
  end if;
  if exists (select 1 from public.tournament_category_links where category_id = p_id) then
    raise exception 'No podés eliminar una categoría que usan torneos: quitala de esos torneos o archivala'
      using errcode = '23503';
  end if;
  delete from public.annual_table_categories where category_id = p_id;
  delete from public.tournament_categories where id = p_id;
end;
$$;

revoke all on function public.annual_table_delete(uuid, timestamptz),
  public.tournament_category_delete(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.annual_table_delete(uuid, timestamptz),
  public.tournament_category_delete(uuid, timestamptz) to authenticated;

commit;
