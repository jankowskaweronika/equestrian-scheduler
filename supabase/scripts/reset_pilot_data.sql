-- CLEAN SLATE: wipe all application data and all user accounts.
--
-- WARNING: this is destructive and irreversible. It removes every organization
-- (including "Lisek"), every membership, invite, resource, horse, lesson,
-- payment, notification, and EVERY auth user (including chomawerka@gmail.com and
-- wjankowska8@gmail.com). Run it only when you want to start from scratch and
-- re-enter everything manually.
--
-- Run in the Supabase SQL editor (executes as a privileged role).

-- 1. Remove all application rows. TRUNCATE ... CASCADE resolves FK order for us
--    and also empties public.profiles (referenced by organizations/lessons/...).
truncate table
  public.service_payments,
  public.subscriptions,
  public.notifications,
  public.notification_preferences,
  public.audit_events,
  public.participant_horses,
  public.lesson_participants,
  public.lessons,
  public.lesson_series,
  public.booking_requests,
  public.horses,
  public.facility_resources,
  public.invites,
  public.memberships,
  public.profiles,
  public.organizations
restart identity cascade;

-- 2. Remove all auth users. (profiles were already emptied above; this clears
--    the underlying Supabase Auth accounts so the emails can be reused.)
delete from auth.users;

-- ---------------------------------------------------------------------------
-- Targeted alternative (delete only specific accounts, keep other data):
--
-- delete from auth.users
-- where email in ('chomawerka@gmail.com', 'wjankowska8@gmail.com');
-- ---------------------------------------------------------------------------
