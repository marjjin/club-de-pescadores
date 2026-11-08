begin;

create or replace function public.admin_list(p_kind text, p_before timestamptz default null, p_id uuid default null,
  p_state text default 'all', p_search text default '') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare table_name text; fields text; filter_sql text := 'true'; search_col text; result jsonb;
begin
  if char_length(p_search) > 100 or p_state not in ('all','draft','published','archived') then
    raise exception 'Filtro inválido' using errcode = '22023';
  end if;
  case p_kind
    when 'news' then
      perform private.require_permission('noticias.ver'); table_name := 'news'; search_col := 'title';
      fields := 'id,title,excerpt,published_at,image_url,image_alt,is_published,deleted_at,created_at,updated_at';
    when 'events' then
      perform private.require_permission('eventos.ver'); table_name := 'events'; search_col := 'title';
      fields := 'id,title,starts_at,place,is_published,deleted_at,created_at,updated_at';
    when 'pool_rates' then
      perform private.require_permission('tarifas.ver'); table_name := 'pool_rates'; search_col := 'season';
      fields := 'id,season,period,family_price_cents,individual_price_cents,family_description,discount_note,valid_from,valid_until,is_published,deleted_at,created_at,updated_at';
    when 'roles' then
      perform private.require_permission('roles.gestionar'); table_name := 'roles'; search_col := 'name';
      fields := 'id,name,is_system,created_at,updated_at,(select coalesce(jsonb_agg(permission_id order by permission_id), ''[]''::jsonb) from public.role_permissions where role_id = t.id) as permissions';
    when 'users' then
      perform private.require_permission('usuarios.gestionar'); table_name := 'admin_accounts'; search_col := 'email';
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
    filter_sql := format('($3 = '''' or starts_with(lower(%I), lower($3)))', search_col);
  end if;
  execute format('select coalesce(jsonb_agg(to_jsonb(page)), ''[]''::jsonb) from
    (select %s from public.%I t where ($1 is null or (created_at,id) < ($1,$2)) and (%s)
    order by created_at desc,id desc limit 21) page', fields, table_name, filter_sql)
    into result using p_before, p_id, p_search;
  return result;
end;
$$;

create function public.admin_invitation_target(p_email text, p_roles uuid[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare target_id uuid;
begin
  perform private.require_permission('usuarios.gestionar');
  if p_roles is null or cardinality(p_roles) not between 1 and 10
    or exists(select 1 from unnest(p_roles) as requested(id) where requested.id is null or not exists(select 1 from public.roles r where r.id = requested.id)) then
    raise exception 'Roles inválidos' using errcode = '22023';
  end if;
  if p_email is null or char_length(p_email) > 254 then raise exception 'Correo inválido' using errcode = '22023'; end if;
  select id into target_id from auth.users where lower(email) = lower(btrim(p_email));
  return jsonb_build_object('existing_id', target_id, 'registered', exists(select 1 from public.admin_accounts where id = target_id));
end;
$$;
revoke all on function public.admin_invitation_target(text,uuid[]) from public, anon;
grant execute on function public.admin_invitation_target(text,uuid[]) to authenticated;
commit;
