-- Development seed data (run after migrations on local or dev environment).
-- Only the two real operator accounts — no @example.com demo users.

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
-- Operator accounts (local development).
-- Password for both: haslo123
--
-- chomawerka@gmail.com  → product admin
-- wjankowska8@gmail.com → manager of Ośrodek testowy
--
-- Inserting into auth.users fires handle_new_user → public.profiles.
-- auth.identities is required for email/password sign-in.
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444400',
    'authenticated',
    'authenticated',
    'chomawerka@gmail.com',
    crypt('haslo123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('first_name', 'Weronika', 'last_name', 'Choma', 'phone', '600100200'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444401',
    'authenticated',
    'authenticated',
    'wjankowska8@gmail.com',
    crypt('haslo123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('first_name', 'Weronika', 'last_name', 'Jankowska', 'phone', '600100201'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
values
  (
    '44444444-4444-4444-4444-444444444400',
    '44444444-4444-4444-4444-444444444400',
    jsonb_build_object(
      'sub', '44444444-4444-4444-4444-444444444400',
      'email', 'chomawerka@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    '44444444-4444-4444-4444-444444444400',
    now(),
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444401',
    '44444444-4444-4444-4444-444444444401',
    jsonb_build_object(
      'sub', '44444444-4444-4444-4444-444444444401',
      'email', 'wjankowska8@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    '44444444-4444-4444-4444-444444444401',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do nothing;

update public.profiles
set is_product_admin = true
where id = '44444444-4444-4444-4444-444444444400';

insert into public.memberships (id, organization_id, user_id, role)
values
  (
    '99999999-9999-9999-9999-999999999900',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444401',
    'manager'
  )
on conflict (organization_id, user_id) do nothing;

update public.profiles
set active_organization_id = '11111111-1111-1111-1111-111111111111'
where id = '44444444-4444-4444-4444-444444444401';

-- ---------------------------------------------------------------------------
-- A few lessons for TODAY so the calendar is not empty locally.
-- Instructor = manager account (no separate demo instructors).
-- ---------------------------------------------------------------------------

insert into public.lessons (
  id, organization_id, resource_id, instructor_id, starts_at, ends_at, status, max_participants,
  cancelled_by, cancelled_at, cancellation_reason
)
values
  (
    '66666666-6666-6666-6666-666666666601',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    '44444444-4444-4444-4444-444444444401',
    (current_date + time '08:00') at time zone 'Europe/Warsaw',
    (current_date + time '09:00') at time zone 'Europe/Warsaw',
    'active',
    1,
    null,
    null,
    null
  ),
  (
    '66666666-6666-6666-6666-666666666603',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    '44444444-4444-4444-4444-444444444401',
    now() - interval '30 minutes',
    now() + interval '30 minutes',
    'active',
    1,
    null,
    null,
    null
  ),
  (
    '66666666-6666-6666-6666-666666666604',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444401',
    now() - interval '30 minutes',
    now() + interval '30 minutes',
    'active',
    1,
    null,
    null,
    null
  ),
  (
    '66666666-6666-6666-6666-666666666606',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    '44444444-4444-4444-4444-444444444401',
    (current_date + time '16:00') at time zone 'Europe/Warsaw',
    (current_date + time '17:00') at time zone 'Europe/Warsaw',
    'active',
    3,
    null,
    null,
    null
  )
on conflict (id) do nothing;
