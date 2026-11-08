begin;

-- Auth updates email only once its confirmation flow has completed.
-- Never copy email_change or any client-supplied metadata into the account.
create function private.sync_admin_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.admin_accounts set email = new.email
  where id = new.id and email is distinct from new.email;
  return new;
end;
$$;
revoke all on function private.sync_admin_email() from public, anon, authenticated;

create trigger sync_confirmed_admin_email
after update of email on auth.users
for each row when (old.email is distinct from new.email and new.email is not null)
execute function private.sync_admin_email();

-- Reconcile previously confirmed changes without altering roles or activation.
update public.admin_accounts a set email = u.email
from auth.users u where a.id = u.id and u.email is not null and a.email is distinct from u.email;

commit;
