-- Permission names that grew with the features: tournament management now covers
-- categories, annual tables and deletion, and user management can remove accounts.
-- Only the labels change; who holds each permission stays the same.
begin;

update public.permissions set label = 'Gestionar torneos, categorías y tablas anuales'
  where id = 'torneos.gestionar';
update public.permissions set label = 'Dar de alta, modificar y dar de baja usuarios'
  where id = 'usuarios.gestionar';

commit;
