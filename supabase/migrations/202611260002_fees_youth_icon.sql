-- A "youth" icon for fees aimed at minors. The cadet fee (members under 16) used the
-- anchor printed on the club notice, which says nothing about age.
begin;

alter table public.fees drop constraint fees_icon_check;
alter table public.fees add constraint fees_icon_check check (icon in ('person','family','senior',
  'sailboat','boat','garage','rack','kayak','anchor','tent','caravan','motorhome','ticket','youth'));

-- Only the row as seeded: if staff already changed it from the panel, theirs stays.
update public.fees set icon = 'youth', detail = coalesce(detail, 'Menores de 16 años')
  where kind = 'membership' and name = 'Cadete' and icon = 'anchor';

commit;
