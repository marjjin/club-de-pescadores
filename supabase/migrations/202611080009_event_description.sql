-- Optional event description shown in the admin editor and the public agenda.
-- Nullable so existing rows stay valid; empty strings are stored as null.
begin;

alter table public.events
  add column description text
  check (description is null or char_length(btrim(description)) between 1 and 600);

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
      fields := 'id,title,starts_at,place,description,is_published,deleted_at,created_at,updated_at';
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

create or replace function public.admin_save_content(p_kind text, p_data jsonb, p_id uuid default null,
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
        insert into public.events(title,starts_at,place,description,is_published) values(e.title,e.starts_at,e.place,nullif(btrim(e.description),''),published) returning to_jsonb(events) into result;
      else
        update public.events set title=e.title,starts_at=e.starts_at,place=e.place,description=nullif(btrim(e.description),''),is_published=published where id=p_id returning to_jsonb(events) into result;
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

commit;
