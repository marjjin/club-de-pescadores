-- Removing someone from the team is a soft delete: the account leaves the list, loses
-- its roles and access, and stays as the author of its history (audit, pier reports,
-- tournaments). Inviting the same e-mail later restores that account.
begin;

alter table public.admin_accounts add column deleted_at timestamptz;
alter table public.admin_accounts add constraint admin_accounts_removed_inactive
  check (deleted_at is null or not active);
create index admin_accounts_listed on public.admin_accounts (created_at desc, id desc) where deleted_at is null;

create function public.admin_remove_user(p_id uuid, p_version timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare previous public.admin_accounts;
begin
  -- Same lock as every access change, so the last-general check cannot race.
  perform pg_advisory_xact_lock(81061108);
  perform private.require_permission('usuarios.gestionar');
  if p_id = (select auth.uid()) then raise exception 'Otro administrador debe quitar tu acceso' using errcode = '42501'; end if;
  -- Only a general administrator may remove another general administrator.
  perform private.require_assignable('{}'::uuid[], p_id);
  select * into previous from public.admin_accounts where id = p_id for update;
  if not found or previous.deleted_at is not null then raise exception 'No existe el usuario' using errcode = 'P0002'; end if;
  if p_version is null or previous.updated_at <> p_version then
    raise exception 'El usuario cambió. Actualizá antes de continuar.' using errcode = '40001';
  end if;
  delete from public.user_roles where user_id = p_id;
  update public.admin_accounts set active = false, deleted_at = now() where id = p_id;
  if not exists(select 1 from public.admin_accounts a join public.user_roles ur on ur.user_id=a.id
    join public.roles r on r.id=ur.role_id where a.active and r.is_system) then
    raise exception 'Debe existir un administrador general activo' using errcode = '23514';
  end if;
end;
$$;
revoke all on function public.admin_remove_user(uuid, timestamptz) from public, anon;
grant execute on function public.admin_remove_user(uuid, timestamptz) to authenticated;

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
      -- User managers read the catalog to assign roles, limited to the ones they may grant.
      if not public.has_permission('roles.gestionar') then
        perform private.require_permission('usuarios.ver');
        role_scope := ' and private.can_assign_role(t.id)';
      end if;
      table_name := 'roles'; search_col := 'name';
      fields := 'id,name,is_system,created_at,updated_at,(select coalesce(jsonb_agg(permission_id order by permission_id), ''[]''::jsonb) from public.role_permissions where role_id = t.id) as permissions';
    when 'users' then
      perform private.require_permission('usuarios.ver'); table_name := 'admin_accounts'; search_col := 'email';
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
    -- Small administrative catalogs use a bounded prefix search, never an unbounded contains scan.
    filter_sql := format('($3 = '''' or starts_with(lower(%I), lower($3)))', search_col) || role_scope;
    -- People removed from the team leave the list; their history stays.
    if p_kind = 'users' then filter_sql := filter_sql || ' and deleted_at is null'; end if;
  end if;
  execute format('select coalesce(jsonb_agg(to_jsonb(page)), ''[]''::jsonb) from
    (select %s from public.%I t where ($1 is null or (created_at,id) < ($1,$2)) and (%s)
    order by created_at desc,id desc limit 21) page', fields, table_name, filter_sql)
    into result using p_before, p_id, p_search;
  return result;
end;
$$;

create or replace function public.admin_save_user(p_id uuid, p_roles uuid[], p_active boolean, p_version timestamptz default null) returns void
language plpgsql security definer set search_path = '' as $$
declare previous public.admin_accounts; user_email text;
begin
  -- Serialize all access changes. A second request rechecks permissions after this lock.
  perform pg_advisory_xact_lock(81061108);
  perform private.require_permission('usuarios.gestionar');
  if p_id = (select auth.uid()) then raise exception 'Otro administrador debe modificar tu acceso' using errcode = '42501'; end if;
  if p_roles is null or cardinality(p_roles) not between 1 and 10 or p_active is null then raise exception 'Acceso inválido' using errcode = '22023'; end if;
  perform private.require_assignable(p_roles, p_id);
  select * into previous from public.admin_accounts where id=p_id for update;
  if found and previous.deleted_at is not null then
    -- Only a new invitation (no version) restores someone removed; a stale editor cannot.
    if p_version is not null then raise exception 'No existe el usuario' using errcode = 'P0002'; end if;
    update public.admin_accounts set active=p_active, deleted_at=null where id=p_id;
  elsif found then
    if p_version is null or previous.updated_at <> p_version then raise exception 'El usuario cambió. Actualizá antes de guardar.' using errcode = '40001'; end if;
    update public.admin_accounts set active=p_active where id=p_id;
  else
    select email into user_email from auth.users where id=p_id;
    if user_email is null then raise exception 'Invitá primero al usuario' using errcode = '22023'; end if;
    insert into public.admin_accounts(id,email,active) values(p_id,user_email,p_active);
  end if;
  delete from public.user_roles where user_id=p_id;
  insert into public.user_roles(user_id,role_id) select p_id, unnest(p_roles) on conflict do nothing;
  if not exists(select 1 from public.admin_accounts a join public.user_roles ur on ur.user_id=a.id
    join public.roles r on r.id=ur.role_id where a.active and r.is_system) then
    raise exception 'Debe existir un administrador general activo' using errcode = '23514';
  end if;
end;
$$;

create or replace function public.admin_invitation_target(p_email text, p_roles uuid[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare target_id uuid;
begin
  perform private.require_permission('usuarios.gestionar');
  if p_roles is null or cardinality(p_roles) not between 1 and 10
    or exists(select 1 from unnest(p_roles) as requested(id) where requested.id is null or not exists(select 1 from public.roles r where r.id = requested.id)) then
    raise exception 'Roles inválidos' using errcode = '22023';
  end if;
  -- Checked before Auth sends the e-mail, so a refused invitation never reaches anyone.
  select id into target_id from auth.users where lower(email) = lower(btrim(p_email));
  perform private.require_assignable(p_roles, target_id);
  if p_email is null or char_length(p_email) > 254 then raise exception 'Correo inválido' using errcode = '22023'; end if;
  select id into target_id from auth.users where lower(email) = lower(btrim(p_email));
  return jsonb_build_object('existing_id', target_id, 'registered', exists(select 1 from public.admin_accounts where id = target_id and deleted_at is null));
end;
$$;

commit;
