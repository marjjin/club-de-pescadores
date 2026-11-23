-- A delegate with usuarios.gestionar could edit an account whose current roles carry
-- permissions the delegate lacks: strip those roles or deactivate it (the Edge Function
-- then bans it in Auth). Deletion already refused that case. Editing now applies the
-- same rule as deleting: you may only change access you could have granted, so the
-- target's current roles must be assignable too.
begin;

create or replace function private.require_assignable(p_roles uuid[], p_target uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if exists(select 1 from unnest(p_roles) requested(id)
      where requested.id is null or not exists(select 1 from public.roles r where r.id = requested.id)) then
    raise exception 'Roles inválidos' using errcode = '22023';
  end if;
  -- This check includes general administrators. Existing assignments survive edits;
  -- the panel cannot create new assignments to a retired-only role.
  if exists(select 1 from unnest(p_roles) requested(id)
      where not private.is_panel_role(requested.id)
        and not exists(select 1 from public.user_roles ur where ur.user_id = p_target and ur.role_id = requested.id)) then
    raise exception 'Ese rol ya no está disponible para asignar desde el panel' using errcode = '42501';
  end if;
  if private.is_general() then return; end if;
  -- Existing hidden assignments still carry their original permissions. A delegate
  -- must hold them too before changing or reactivating that account.
  if exists(select 1 from unnest(p_roles) requested(id)
      where not private.can_assign_role(requested.id)) then
    raise exception 'Solo podés asignar roles con permisos que ya tenés' using errcode = '42501';
  end if;
  if exists(select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
      where ur.user_id = p_target and r.is_system) then
    raise exception 'Solo un administrador general puede modificar a otro' using errcode = '42501';
  end if;
  -- Removing or deactivating access is as sensitive as granting it.
  if exists(select 1 from public.user_roles ur
      where ur.user_id = p_target and not private.can_assign_role(ur.role_id)) then
    raise exception 'Solo podés modificar usuarios con permisos que ya tenés' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.require_assignable(uuid[], uuid) from public, anon, authenticated;

commit;
