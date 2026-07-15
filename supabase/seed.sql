-- Development seed data (run after migrations on local or dev environment)

insert into public.organizations (id, name, timezone, calendar_opens_at, calendar_closes_at)
values (
  '11111111-1111-1111-1111-111111111111',
  'Ośrodek testowy',
  'Europe/Warsaw',
  '07:00',
  '22:00'
)
on conflict (id) do nothing;

insert into public.facility_resources (id, organization_id, name, type, parallel_capacity)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Hala', 'indoor', 2),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Ujeżdżalnia', 'outdoor_arena', 3)
on conflict (id) do nothing;

insert into public.horses (id, organization_id, name, daily_ride_limit)
values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Rapan', 4),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Błysk', 4)
on conflict (id) do nothing;
