begin;
create table private.invitation_limits (
  user_id uuid primary key,
  window_start timestamptz not null,
  attempts integer not null
);
revoke all on private.invitation_limits from public, anon, authenticated;
create function public.admin_allow_invitation() returns boolean
language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
  perform private.require_permission('usuarios.gestionar');
  insert into private.invitation_limits(user_id, window_start, attempts)
    values ((select auth.uid()), now(), 1)
    on conflict (user_id) do update set
      window_start = case when invitation_limits.window_start < now() - interval '1 hour' then now() else invitation_limits.window_start end,
      attempts = case when invitation_limits.window_start < now() - interval '1 hour' then 1 else invitation_limits.attempts + 1 end
    returning attempts <= 10 into allowed;
  return allowed;
end;
$$;
revoke all on function public.admin_allow_invitation() from public, anon;
grant execute on function public.admin_allow_invitation() to authenticated;
commit;
