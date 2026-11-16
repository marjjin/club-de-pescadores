begin;

-- Replaces the "remove from team" soft delete (202611130001): deleting a panel user
-- now removes their Auth account (credentials, sessions, MFA) and keeps an anonymous
-- row. Pier reports, tournaments and the audit trail still reference it, so
-- authorship stays consistent without exposing the e-mail. deleted_at, its
-- "inactive" check and the listing index come from 202611130001.
alter table public.admin_accounts drop constraint admin_accounts_id_fkey;
alter table public.admin_accounts alter column email drop not null;
alter table public.admin_accounts add constraint admin_accounts_deleted_anonymous
  check ((deleted_at is null) = (email is not null));
-- Its "restore on re-invite" contract cannot hold once the Auth account is gone.
drop function public.admin_remove_user(uuid, timestamptz);

-- If the Auth deletion failed, a later e-mail change must not revive the address.
create or replace function private.sync_admin_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.admin_accounts set email = new.email
  where id = new.id and deleted_at is null and email is distinct from new.email;
  return new;
end;
$$;
revoke all on function private.sync_admin_email() from public, anon, authenticated;

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
  if found then
    -- A deleted account is never reactivated: a new invitation creates a new account.
    if previous.deleted_at is not null then raise exception 'El usuario fue eliminado' using errcode = '22023'; end if;
    if p_version is null or previous.updated_at <> p_version then raise exception 'El usuario cambió. Actualizá antes de guardar.' using errcode = '40001'; end if;
    update public.admin_accounts set active=p_active where id=p_id;
    delete from public.user_roles where user_id=p_id;
  else
    select email into user_email from auth.users where id=p_id;
    if user_email is null then raise exception 'Invitá primero al usuario' using errcode = '22023'; end if;
    insert into public.admin_accounts(id,email,active) values(p_id,user_email,p_active);
  end if;
  insert into public.user_roles(user_id,role_id) select p_id, unnest(p_roles) on conflict do nothing;
  if not exists(select 1 from public.admin_accounts a join public.user_roles ur on ur.user_id=a.id
    join public.roles r on r.id=ur.role_id where a.active and r.is_system) then
    raise exception 'Debe existir un administrador general activo' using errcode = '23514';
  end if;
end;
$$;

create function public.admin_delete_user(p_id uuid, p_version timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare previous public.admin_accounts;
begin
  perform pg_advisory_xact_lock(81061108);
  perform private.require_permission('usuarios.gestionar');
  if p_id = (select auth.uid()) then raise exception 'Otro administrador debe eliminar tu acceso' using errcode = '42501'; end if;
  select * into previous from public.admin_accounts where id=p_id for update;
  if not found or previous.deleted_at is not null then raise exception 'El usuario no existe' using errcode = 'P0002'; end if;
  if p_version is null or previous.updated_at <> p_version then raise exception 'El usuario cambió. Actualizá antes de eliminarlo.' using errcode = '40001'; end if;
  -- Same rule as editing: you may only remove access you could have granted.
  perform private.require_assignable(
    coalesce((select array_agg(role_id) from public.user_roles where user_id=p_id), '{}'::uuid[]), p_id);
  -- The audit triggers keep the previous e-mail and roles of the deleted account.
  delete from public.user_roles where user_id=p_id;
  update public.admin_accounts set active=false, email=null, deleted_at=now() where id=p_id;
  if not exists(select 1 from public.admin_accounts a join public.user_roles ur on ur.user_id=a.id
    join public.roles r on r.id=ur.role_id where a.active and r.is_system) then
    raise exception 'Debe existir un administrador general activo' using errcode = '23514';
  end if;
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
      -- Deleted accounts only remain for authorship and audit; they are not team members.
      role_scope := ' and t.deleted_at is null';
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

revoke all on function public.admin_save_user(uuid, uuid[], boolean, timestamptz),
  public.admin_delete_user(uuid, timestamptz), public.admin_list(text, timestamptz, uuid, text, text)
  from public, anon;
grant execute on function public.admin_save_user(uuid, uuid[], boolean, timestamptz),
  public.admin_delete_user(uuid, timestamptz), public.admin_list(text, timestamptz, uuid, text, text)
  to authenticated;

commit;
