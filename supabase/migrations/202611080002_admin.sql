begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index roles_name_unique on public.roles (lower(name));
create unique index roles_single_system on public.roles (is_system) where is_system;
create table public.permissions (
  id text primary key,
  label text not null,
  reserved boolean not null default false
);
create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id text not null references public.permissions(id),
  primary key (role_id, permission_id)
);
create table public.admin_accounts (
  id uuid primary key references auth.users(id),
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid not null references public.admin_accounts(id),
  role_id uuid not null references public.roles(id),
  primary key (user_id, role_id)
);
create index user_roles_role_idx on public.user_roles(role_id, user_id);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  resource_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_cursor_idx on public.audit_logs(created_at desc, id desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);
create index admin_accounts_cursor_idx on public.admin_accounts(created_at desc, id desc);
create index roles_cursor_idx on public.roles(created_at desc, id desc);

insert into public.roles(name, is_system) values ('Administrador general', true);
insert into public.permissions(id, label, reserved) values
  ('noticias.ver', 'Ver noticias', false), ('noticias.editar', 'Editar noticias', false),
  ('noticias.publicar', 'Publicar noticias', false), ('noticias.archivar', 'Archivar y restaurar noticias', false),
  ('eventos.ver', 'Ver eventos', false), ('eventos.editar', 'Editar eventos', false),
  ('eventos.publicar', 'Publicar eventos', false), ('eventos.archivar', 'Archivar y restaurar eventos', false),
  ('tarifas.ver', 'Ver tarifas', false), ('tarifas.editar', 'Editar tarifas', false),
  ('tarifas.publicar', 'Publicar tarifas', false), ('tarifas.archivar', 'Archivar y restaurar tarifas', false),
  ('auditoria.ver', 'Consultar auditoría', false),
  ('usuarios.gestionar', 'Gestionar usuarios', true), ('roles.gestionar', 'Gestionar roles', true);

create function public.has_permission(p_permission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt()->>'aal') = 'aal2', false)
    and exists (
      select 1 from public.admin_accounts a
      join public.user_roles ur on ur.user_id = a.id
      join public.roles r on r.id = ur.role_id
      where a.id = (select auth.uid()) and a.active
      and (r.is_system or exists (
        select 1 from public.role_permissions rp join public.permissions p on p.id = rp.permission_id
        where rp.role_id = r.id and rp.permission_id = p_permission and not p.reserved
      ))
    );
$$;
revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated;

create function private.require_permission(p_permission text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission(p_permission) then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
end;
$$;

create function public.admin_context() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'active', exists(select 1 from public.admin_accounts where id = (select auth.uid()) and active),
    'general', exists(select 1 from public.admin_accounts a join public.user_roles ur on ur.user_id = a.id
      join public.roles r on r.id = ur.role_id where a.id = (select auth.uid()) and a.active and r.is_system),
    'aal2', coalesce((select auth.jwt()->>'aal') = 'aal2', false)
  );
$$;
revoke all on function public.admin_context() from public, anon;
grant execute on function public.admin_context() to authenticated;

create function private.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare old_data jsonb; new_data jsonb;
begin
  if tg_op <> 'INSERT' then old_data := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_data := to_jsonb(new); end if;
  insert into public.audit_logs(actor_id, action, resource_id, before_data, after_data)
  values ((select auth.uid()), tg_table_name || '.' || lower(tg_op),
    coalesce(new_data->>'id', old_data->>'id', new_data->>'user_id', old_data->>'user_id', new_data->>'role_id', old_data->>'role_id'),
    old_data, new_data);
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['roles','permissions','role_permissions','admin_accounts','user_roles','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select public.has_permission(%L)))', t || '_read', t,
      case when t = 'audit_logs' then 'auditoria.ver' else 'usuarios.gestionar' end);
    execute format('create policy %I on public.%I for insert to anon, authenticated with check (false)', t || '_deny_insert', t);
    execute format('create policy %I on public.%I for update to anon, authenticated using (false) with check (false)', t || '_deny_update', t);
    execute format('create policy %I on public.%I for delete to anon, authenticated using (false)', t || '_deny_delete', t);
  end loop;
  foreach t in array array['events','news','pool_rates','roles','role_permissions','admin_accounts','user_roles'] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.audit_change()', t || '_audit', t);
  end loop;
  foreach t in array array['events','news','pool_rates'] loop
    execute format('create index %I on public.%I (created_at desc, id desc)', t || '_admin_cursor', t);
    execute format('create index %I on public.%I using gin (to_tsvector(''spanish'', %I))', t || '_admin_search', t,
      case when t = 'pool_rates' then 'season' else 'title' end);
    execute format('create policy %I on public.%I for select to authenticated using ((select public.has_permission(%L)))', t || '_admin_read', t,
      case t when 'events' then 'eventos.ver' when 'news' then 'noticias.ver' else 'tarifas.ver' end);
  end loop;
  foreach t in array array['roles','admin_accounts'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_content_updated_at()', t || '_updated', t);
  end loop;
end;
$$;

-- Direct browser writes stay revoked. Every mutation uses a checked RPC and audit triggers.
create function public.admin_list(p_kind text, p_before timestamptz default null, p_id uuid default null,
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
      fields := 'id,actor_id,action,resource_id,before_data,after_data,created_at';
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

create function public.admin_dashboard() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('usuarios.gestionar');
  return jsonb_build_object(
    'news', (select count(*) from public.news where deleted_at is null and is_published),
    'events', (select count(*) from public.events where deleted_at is null and is_published and starts_at >= now()),
    'rates', (select count(*) from public.pool_rates where deleted_at is null and is_published and (valid_until is null or valid_until >= (now() at time zone 'America/Argentina/Buenos_Aires')::date)),
    'drafts', (select count(*) from public.news where deleted_at is null and not is_published)
      + (select count(*) from public.events where deleted_at is null and not is_published)
      + (select count(*) from public.pool_rates where deleted_at is null and not is_published),
    'users', (select count(*) from public.admin_accounts where active));
end;
$$;

create function public.admin_permissions() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_permission('roles.gestionar');
  return (select jsonb_agg(jsonb_build_object('id',id,'label',label,'reserved',reserved) order by id) from public.permissions);
end;
$$;

create function public.admin_save_content(p_kind text, p_data jsonb, p_id uuid default null,
  p_version timestamptz default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare prefix text; previous jsonb; result jsonb; published boolean; n public.news; e public.events; r public.pool_rates;
begin
  prefix := case p_kind when 'news' then 'noticias' when 'events' then 'eventos' when 'pool_rates' then 'tarifas' end;
  if prefix is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Contenido inválido' using errcode = '22023'; end if;
  perform private.require_permission(prefix || '.ver');
  perform private.require_permission(prefix || '.editar');
  if p_id is not null then
    execute format('select to_jsonb(t) from public.%I t where id = $1 for update', p_kind) into previous using p_id;
    if previous is null then raise exception 'No existe el contenido' using errcode = 'P0002'; end if;
    if p_version is null or (previous->>'updated_at')::timestamptz <> p_version then raise exception 'El contenido cambió. Actualizá antes de guardar.' using errcode = '40001'; end if;
    if previous->>'deleted_at' is not null then raise exception 'Restaurá el contenido antes de editarlo' using errcode = '22023'; end if;
  end if;
  published := coalesce((p_data->>'is_published')::boolean, false);
  if published or coalesce((previous->>'is_published')::boolean, false) then perform private.require_permission(prefix || '.publicar'); end if;
  case p_kind
    when 'news' then
      n := jsonb_populate_record(null::public.news, p_data);
      if p_id is null then
        insert into public.news(title,excerpt,published_at,image_url,image_alt,is_published)
          values(n.title,n.excerpt,n.published_at,n.image_url,n.image_alt,published) returning to_jsonb(news) into result;
      else
        update public.news set title=n.title,excerpt=n.excerpt,published_at=n.published_at,image_url=n.image_url,image_alt=n.image_alt,is_published=published
          where id=p_id returning to_jsonb(news) into result;
      end if;
    when 'events' then
      e := jsonb_populate_record(null::public.events, p_data);
      if p_id is null then
        insert into public.events(title,starts_at,place,is_published) values(e.title,e.starts_at,e.place,published) returning to_jsonb(events) into result;
      else
        update public.events set title=e.title,starts_at=e.starts_at,place=e.place,is_published=published where id=p_id returning to_jsonb(events) into result;
      end if;
    when 'pool_rates' then
      r := jsonb_populate_record(null::public.pool_rates, p_data);
      if p_id is null then
        insert into public.pool_rates(season,period,family_price_cents,individual_price_cents,family_description,discount_note,valid_from,valid_until,is_published)
          values(r.season,r.period,r.family_price_cents,r.individual_price_cents,r.family_description,r.discount_note,r.valid_from,r.valid_until,published) returning to_jsonb(pool_rates) into result;
      else
        update public.pool_rates set season=r.season,period=r.period,family_price_cents=r.family_price_cents,individual_price_cents=r.individual_price_cents,
          family_description=r.family_description,discount_note=r.discount_note,valid_from=r.valid_from,valid_until=r.valid_until,is_published=published
          where id=p_id returning to_jsonb(pool_rates) into result;
      end if;
  end case;
  return result;
end;
$$;

create function public.admin_archive_content(p_kind text, p_id uuid, p_version timestamptz, p_restore boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare prefix text; previous jsonb;
begin
  prefix := case p_kind when 'news' then 'noticias' when 'events' then 'eventos' when 'pool_rates' then 'tarifas' end;
  if prefix is null then raise exception 'Contenido inválido' using errcode = '22023'; end if;
  perform private.require_permission(prefix || '.ver');
  perform private.require_permission(prefix || '.archivar');
  execute format('select to_jsonb(t) from public.%I t where id = $1 for update', p_kind) into previous using p_id;
  if previous is null then raise exception 'No existe el contenido' using errcode = 'P0002'; end if;
  if p_version is null or (previous->>'updated_at')::timestamptz <> p_version then raise exception 'El contenido cambió. Actualizá antes de guardar.' using errcode = '40001'; end if;
  if (previous->>'is_published')::boolean then perform private.require_permission(prefix || '.publicar'); end if;
  -- Restores always return to draft; they cannot accidentally republish expired content.
  execute format('update public.%I set deleted_at = $1, is_published = false where id = $2', p_kind)
    using case when p_restore then null else now() end, p_id;
end;
$$;

create function public.admin_save_role(p_name text, p_permissions text[], p_id uuid default null, p_version timestamptz default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare role_id uuid := coalesce(p_id, gen_random_uuid()); previous public.roles; perm text;
begin
  perform pg_advisory_xact_lock(81061108);
  perform private.require_permission('roles.gestionar');
  if p_permissions is null or cardinality(p_permissions) > 30 then raise exception 'Permisos inválidos' using errcode = '22023'; end if;
  foreach perm in array p_permissions loop
    if not exists(select 1 from public.permissions where id = perm and not reserved) then raise exception 'Permiso reservado o desconocido' using errcode = '42501'; end if;
    if split_part(perm,'.',1) in ('noticias','eventos','tarifas') and not (split_part(perm,'.',1)||'.ver' = any(p_permissions)) then
      raise exception 'Se requiere permiso de lectura del módulo' using errcode = '22023';
    end if;
  end loop;
  if p_id is not null then
    select * into previous from public.roles where id=p_id for update;
    if not found or previous.is_system then raise exception 'Rol protegido o inexistente' using errcode = '42501'; end if;
    if p_version is null or previous.updated_at <> p_version then raise exception 'El rol cambió. Actualizá antes de guardar.' using errcode = '40001'; end if;
    update public.roles set name=btrim(p_name) where id=p_id;
    delete from public.role_permissions where role_permissions.role_id = p_id;
  else insert into public.roles(id,name) values(role_id,btrim(p_name)); end if;
  insert into public.role_permissions(role_id,permission_id) select role_id, unnest(p_permissions) on conflict do nothing;
  return role_id;
end;
$$;

create function public.admin_delete_role(p_id uuid, p_version timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(81061108);
  perform private.require_permission('roles.gestionar');
  if exists(select 1 from public.user_roles where role_id=p_id) then raise exception 'El rol tiene usuarios asignados' using errcode = '23503'; end if;
  delete from public.roles where id=p_id and not is_system and updated_at=p_version;
  if not found then raise exception 'Rol protegido, modificado o inexistente' using errcode = '40001'; end if;
end;
$$;

create function public.admin_save_user(p_id uuid, p_roles uuid[], p_active boolean, p_version timestamptz default null) returns void
language plpgsql security definer set search_path = '' as $$
declare previous public.admin_accounts; user_email text;
begin
  -- Serialize all access changes. A second request rechecks permissions after this lock.
  perform pg_advisory_xact_lock(81061108);
  perform private.require_permission('usuarios.gestionar');
  if p_id = (select auth.uid()) then raise exception 'Otro administrador debe modificar tu acceso' using errcode = '42501'; end if;
  if p_roles is null or cardinality(p_roles) not between 1 and 10 or p_active is null then raise exception 'Acceso inválido' using errcode = '22023'; end if;
  select * into previous from public.admin_accounts where id=p_id for update;
  if found then
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

-- Trusted installation only: the owner runs this once, never via a public browser key.
create function public.bootstrap_admin(p_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare account_id uuid; system_role uuid;
begin
  perform pg_advisory_xact_lock(81061108);
  if exists(select 1 from public.admin_accounts) then raise exception 'La instalación inicial ya fue realizada'; end if;
  select id into account_id from auth.users where lower(email)=lower(btrim(p_email));
  if account_id is null then raise exception 'Creá o invitá primero la cuenta desde Auth'; end if;
  select id into system_role from public.roles where is_system;
  insert into public.admin_accounts(id,email) select id,email from auth.users where id=account_id;
  insert into public.user_roles(user_id,role_id) values(account_id,system_role);
  return account_id;
end;
$$;
revoke all on function public.bootstrap_admin(text) from public, anon, authenticated;
grant execute on function public.bootstrap_admin(text) to service_role;

revoke all on all functions in schema private from public, anon, authenticated;
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'admin_%' loop
    execute format('revoke all on function %s from public, anon', f.signature);
    execute format('grant execute on function %s to authenticated', f.signature);
  end loop;
end;
$$;
commit;
