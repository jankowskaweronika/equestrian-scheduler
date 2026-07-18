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
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Błysk', 4),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Kasztan', 4),
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'Luna', 4)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Demo users (local development only). Inserting into auth.users fires the
-- handle_new_user trigger, which creates the matching public.profiles rows.
-- Password for every demo account is: haslo123
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444400', 'authenticated', 'authenticated',
   'manager@example.com', crypt('haslo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   jsonb_build_object('first_name', 'Maria', 'last_name', 'Manager', 'phone', '600100200'),
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444401', 'authenticated', 'authenticated',
   'anna.instruktor@example.com', crypt('haslo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   jsonb_build_object('first_name', 'Anna', 'last_name', 'Kowalska', 'phone', '600100201'),
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444402', 'authenticated', 'authenticated',
   'marek.instruktor@example.com', crypt('haslo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   jsonb_build_object('first_name', 'Marek', 'last_name', 'Nowak', 'phone', '600100202'),
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555501', 'authenticated', 'authenticated',
   'jan.klient@example.com', crypt('haslo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   jsonb_build_object('first_name', 'Jan', 'last_name', 'Wiśniewski', 'phone', '600100301'),
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555502', 'authenticated', 'authenticated',
   'ola.klient@example.com', crypt('haslo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   jsonb_build_object('first_name', 'Ola', 'last_name', 'Zielińska', 'phone', '600100302'),
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555503', 'authenticated', 'authenticated',
   'piotr.klient@example.com', crypt('haslo123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   jsonb_build_object('first_name', 'Piotr', 'last_name', 'Lewandowski', 'phone', '600100303'),
   now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.memberships (id, organization_id, user_id, role)
values
  ('99999999-9999-9999-9999-999999999900', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444400', 'manager'),
  ('99999999-9999-9999-9999-999999999901', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444401', 'instructor'),
  ('99999999-9999-9999-9999-999999999902', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444402', 'instructor'),
  ('99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555501', 'client'),
  ('99999999-9999-9999-9999-999999999904', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555502', 'client'),
  ('99999999-9999-9999-9999-999999999905', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555503', 'client')
on conflict (organization_id, user_id) do nothing;

-- Make the demo organization the active one for the manager account.
update public.profiles
set active_organization_id = '11111111-1111-1111-1111-111111111111'
where id = '44444444-4444-4444-4444-444444444400';

-- ---------------------------------------------------------------------------
-- Demo lessons for TODAY (times are Europe/Warsaw wall-clock). Two "now"
-- lessons (C and D) span the current moment so the "Teraz na obiektach" panel
-- and the now-line are populated whenever the seed is run.
-- ---------------------------------------------------------------------------

insert into public.lessons (
  id, organization_id, resource_id, instructor_id, starts_at, ends_at, status, max_participants,
  cancelled_by, cancelled_at, cancellation_reason
)
values
  -- A: 08:00-09:00 Hala, Anna
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444401',
   (current_date + time '08:00') at time zone 'Europe/Warsaw',
   (current_date + time '09:00') at time zone 'Europe/Warsaw', 'active', 1, null, null, null),
  -- B: 09:15-10:15 Ujeżdżalnia, Marek (group)
  ('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444402',
   (current_date + time '09:15') at time zone 'Europe/Warsaw',
   (current_date + time '10:15') at time zone 'Europe/Warsaw', 'active', 4, null, null, null),
  -- C: now-30min .. now+30min Hala, Anna (currently ongoing)
  ('66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444401',
   now() - interval '30 minutes', now() + interval '30 minutes', 'active', 1, null, null, null),
  -- D: now-30min .. now+30min Ujeżdżalnia, Marek (currently ongoing)
  ('66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444402',
   now() - interval '30 minutes', now() + interval '30 minutes', 'active', 1, null, null, null),
  -- E: 14:00-15:00 Ujeżdżalnia, Marek (cancelled)
  ('66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444402',
   (current_date + time '14:00') at time zone 'Europe/Warsaw',
   (current_date + time '15:00') at time zone 'Europe/Warsaw', 'cancelled', 1,
   '44444444-4444-4444-4444-444444444402', now(), 'Choroba instruktora'),
  -- F: 16:00-17:00 Hala, Anna (group)
  ('66666666-6666-6666-6666-666666666606', '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222221', '44444444-4444-4444-4444-444444444401',
   (current_date + time '16:00') at time zone 'Europe/Warsaw',
   (current_date + time '17:00') at time zone 'Europe/Warsaw', 'active', 3, null, null, null)
on conflict (id) do nothing;

insert into public.lesson_participants (id, lesson_id, user_id, status, payment_status)
values
  ('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'active', 'paid'),
  ('77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502', 'active', 'unpaid'),
  ('77777777-7777-7777-7777-777777777703', '66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555503', 'active', 'paid'),
  ('77777777-7777-7777-7777-777777777704', '66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555502', 'active', 'paid'),
  ('77777777-7777-7777-7777-777777777705', '66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555501', 'active', 'unpaid'),
  ('77777777-7777-7777-7777-777777777706', '66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555503', 'active', 'unpaid'),
  ('77777777-7777-7777-7777-777777777707', '66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555501', 'active', 'paid'),
  ('77777777-7777-7777-7777-777777777708', '66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555503', 'active', 'unpaid')
on conflict (id) do nothing;

insert into public.participant_horses (id, participant_id, horse_id)
values
  ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', '33333333-3333-3333-3333-333333333331'),
  ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777702', '33333333-3333-3333-3333-333333333332'),
  ('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777703', '33333333-3333-3333-3333-333333333333'),
  ('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777704', '33333333-3333-3333-3333-333333333334'),
  ('88888888-8888-8888-8888-888888888805', '77777777-7777-7777-7777-777777777705', '33333333-3333-3333-3333-333333333333'),
  ('88888888-8888-8888-8888-888888888806', '77777777-7777-7777-7777-777777777706', '33333333-3333-3333-3333-333333333331'),
  ('88888888-8888-8888-8888-888888888807', '77777777-7777-7777-7777-777777777707', '33333333-3333-3333-3333-333333333331'),
  ('88888888-8888-8888-8888-888888888808', '77777777-7777-7777-7777-777777777708', '33333333-3333-3333-3333-333333333332')
on conflict (id) do nothing;
