-- The panel tells each person which roles they hold. Only the caller's own roles are
-- returned, and only while their account is active, so nothing about others leaks.
begin;

create or replace function public.admin_context() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'active', exists(select 1 from public.admin_accounts where id = (select auth.uid()) and active),
    'general', private.is_general(),
    'pier', public.has_permission('muelle.publicar'),
    'permissions', coalesce((select jsonb_agg(p.id order by p.id) from public.permissions p
      where public.has_permission(p.id)), '[]'::jsonb),
    'roles', coalesce((select jsonb_agg(r.name order by r.is_system desc, lower(r.name))
      from public.admin_accounts a join public.user_roles ur on ur.user_id = a.id
      join public.roles r on r.id = ur.role_id
      where a.id = (select auth.uid()) and a.active), '[]'::jsonb),
    'aal2', coalesce((select auth.jwt()->>'aal') = 'aal2', false)
  );
$$;
revoke all on function public.admin_context() from public, anon;
grant execute on function public.admin_context() to authenticated;

commit;
