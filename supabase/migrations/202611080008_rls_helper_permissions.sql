begin;
-- SQL Editor may install this event-trigger helper when enabling automatic RLS.
-- DDL event triggers do not need browser roles to have EXECUTE permission.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
commit;
