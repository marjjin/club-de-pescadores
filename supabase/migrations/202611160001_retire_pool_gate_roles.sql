-- Retire operational pool/gate roles from the panel without deleting historical
-- assignments or audit records. Pool rates and mixed roles keep their other work.
begin;

create function private.is_panel_permission(p_permission text) returns boolean
language sql immutable strict set search_path = '' as $$
  select split_part(lower(p_permission), '.', 1) not in ('pileta', 'porteria', 'portería')
$$;

create function private.is_panel_role(p_role uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.roles r where r.id = p_role and (
    r.is_system
    or not exists(select 1 from public.role_permissions rp where rp.role_id = r.id)
    or exists(select 1 from public.role_permissions rp
      where rp.role_id = r.id and private.is_panel_permission(rp.permission_id))
  ))
$$;
revoke all on function private.is_panel_permission(text), private.is_panel_role(uuid)
  from public, anon, authenticated;

create or replace function public.admin_context() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'active', exists(select 1 from public.admin_accounts where id = (select auth.uid()) and active),
    'general', private.is_general(),
    'pier', public.has_permission('muelle.publicar'),
    'permissions', coalesce((select jsonb_agg(p.id order by p.id) from public.permissions p
      where private.is_panel_permission(p.id) and public.has_permission(p.id)), '[]'::jsonb),
    'roles', coalesce((select jsonb_agg(r.name order by r.is_system desc, lower(r.name))
      from public.admin_accounts a join public.user_roles ur on ur.user_id = a.id
      join public.roles r on r.id = ur.role_id
      where a.id = (select auth.uid()) and a.active and private.is_panel_role(r.id)), '[]'::jsonb),
    'aal2', coalesce((select auth.jwt()->>'aal') = 'aal2', false)
  );
$$;

create or replace function public.admin_permissions() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('roles.gestionar');
  return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label,'reserved',reserved) order by id), '[]'::jsonb)
    from public.permissions where private.is_panel_permission(id));
end;
$$;

create or replace function public.admin_list(p_kind text, p_before timestamptz default null, p_id uuid default null,
  p_state text default 'all', p_search text default '') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare table_name text; fields text; filter_sql text := 'true'; search_col text; result jsonb; role_scope text := '';
begin
  if char_length(p_search) > 100 or p_state not in ('all','draft','published','archived') then
    raise exception 'Filtro inválido' using errcode = '22023';
  end if;
  case p_kind
    when 'news' then
      perform private.require_permission('noticias.ver'); table_name := 'news'; search_col := 'title';
      fields := 'id,title,excerpt,published_at,image_url,image_alt,image_focus_x,image_focus_y,is_published,deleted_at,created_at,updated_at';
    when 'events' then
      perform private.require_permission('eventos.ver'); table_name := 'events'; search_col := 'title';
      fields := 'id,title,starts_at,place,description,is_published,deleted_at,created_at,updated_at';
    when 'pool_rates' then
      perform private.require_permission('tarifas.ver'); table_name := 'pool_rates'; search_col := 'season';
      fields := 'id,season,period,family_price_cents,individual_price_cents,family_description,discount_note,valid_from,valid_until,is_published,deleted_at,created_at,updated_at';
    when 'roles' then
      -- Filter before ordering/limiting so hidden roles never consume a page slot.
      role_scope := ' and private.is_panel_role(t.id)';
      if not public.has_permission('roles.gestionar') then
        perform private.require_permission('usuarios.ver');
        role_scope := role_scope || ' and private.can_assign_role(t.id)';
      end if;
      table_name := 'roles'; search_col := 'name';
      fields := 'id,name,is_system,created_at,updated_at,(select coalesce(jsonb_agg(permission_id order by permission_id), ''[]''::jsonb) from public.role_permissions where role_id = t.id and private.is_panel_permission(permission_id)) as permissions';
    when 'users' then
      perform private.require_permission('usuarios.ver'); table_name := 'admin_accounts'; search_col := 'email';
      -- Preserve all assignment IDs: saving a visible edit must not revoke hidden roles.
      fields := 'id,email,active,created_at,updated_at,(select coalesce(jsonb_agg(role_id order by role_id), ''[]''::jsonb) from public.user_roles where user_id = t.id) as roles';
    when 'audit' then
      perform private.require_permission('auditoria.ver'); table_name := 'audit_logs'; search_col := 'action';
      fields := 'id,actor_id,(select email from public.admin_accounts where id = t.actor_id) as actor_email,action,resource_id,before_data,after_data,created_at';
    else raise exception 'Listado inválido' using errcode = '22023';
  end case;
  if p_kind in ('news','events','pool_rates') then
    filter_sql := case p_state
      when 'draft' then 'deleted_at is null and not is_published'
      when 'published' then 'deleted_at is null and is_published'
      when 'archived' then 'deleted_at is not null'
      else 'deleted_at is null' end;
    filter_sql := filter_sql || format(' and ($3 = '''' or to_tsvector(''spanish'', %I) @@ websearch_to_tsquery(''spanish'', $3))', search_col);
  else
    filter_sql := format('($3 = '''' or starts_with(lower(%I), lower($3)))', search_col) || role_scope;
  end if;
  execute format('select coalesce(jsonb_agg(to_jsonb(page)), ''[]''::jsonb) from
    (select %s from public.%I t where ($1 is null or (created_at,id) < ($1,$2)) and (%s)
    order by created_at desc,id desc limit 21) page', fields, table_name, filter_sql)
    into result using p_before, p_id, p_search;
  return result;
end;
$$;

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
    if split_part(perm,'.',1) in ('noticias','eventos','tarifas','usuarios','torneos') and not (split_part(perm,'.',1)||'.ver' = any(p_permissions)) then
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
end;
$$;

revoke all on function private.require_assignable(uuid[], uuid) from public, anon, authenticated;
revoke all on function public.admin_context(), public.admin_permissions(),
  public.admin_list(text, timestamptz, uuid, text, text), public.admin_save_role(text, text[], uuid, timestamptz)
  from public, anon;
grant execute on function public.admin_context(), public.admin_permissions(),
  public.admin_list(text, timestamptz, uuid, text, text), public.admin_save_role(text, text[], uuid, timestamptz)
  to authenticated;

commit;
