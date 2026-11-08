begin;
-- Safe even if SQL Editor already enabled RLS while applying migration 004.
-- Only the checked SECURITY DEFINER function accesses this private counter.
alter table private.invitation_limits enable row level security;
commit;
