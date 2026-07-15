-- Initial schema for equestrian-scheduler MVP
-- Multi-tenant scheduling with organization-scoped RLS

-- ---------------------------------------------------------------------------
-- Extensions & enums
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create type public.membership_role as enum (
  'product_admin',
  'manager',
  'instructor',
  'client',
  'boarder'
);

create type public.lesson_status as enum ('active', 'cancelled');

create type public.participant_status as enum ('active', 'cancelled');

create type public.payment_status as enum ('paid', 'unpaid');

create type public.invite_status as enum ('pending', 'accepted', 'expired');

create type public.booking_request_status as enum ('pending', 'approved', 'rejected');

create type public.resource_type as enum ('indoor', 'outdoor_arena', 'other');

create type public.notification_category as enum (
  'reminder',
  'schedule_change',
  'booking_request',
  'instructor_message',
  'account_security'
);

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  timezone text not null default 'Europe/Warsaw',
  calendar_opens_at time not null default '07:00',
  calendar_closes_at time not null default '22:00',
  logo_url text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_calendar_hours_valid check (calendar_closes_at > calendar_opens_at)
);

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(trim(first_name)) > 0),
  last_name text not null check (char_length(trim(last_name)) > 0),
  email text not null unique check (position('@' in email) > 1),
  phone text not null check (char_length(trim(phone)) >= 9),
  is_product_admin boolean not null default false,
  active_organization_id uuid references public.organizations (id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Memberships
-- ---------------------------------------------------------------------------

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_organization_id_idx on public.memberships (organization_id);

-- ---------------------------------------------------------------------------
-- Invites
-- ---------------------------------------------------------------------------

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  email text not null,
  role public.membership_role not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  status public.invite_status not null default 'pending',
  invited_by uuid not null references public.profiles (id),
  accepted_by uuid references public.profiles (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invites_role_not_product_admin check (role <> 'product_admin')
);

create index invites_organization_id_idx on public.invites (organization_id);
create index invites_email_idx on public.invites (lower(email));

-- ---------------------------------------------------------------------------
-- Facility resources
-- ---------------------------------------------------------------------------

create table public.facility_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null check (char_length(trim(name)) > 0),
  type public.resource_type not null default 'indoor',
  parallel_capacity integer not null default 1 check (parallel_capacity >= 1),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index facility_resources_organization_id_idx on public.facility_resources (organization_id);

-- ---------------------------------------------------------------------------
-- Horses (school horses only; boarder horses are implicit)
-- ---------------------------------------------------------------------------

create table public.horses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null check (char_length(trim(name)) > 0),
  daily_ride_limit integer not null default 4 check (daily_ride_limit >= 1),
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index horses_organization_id_idx on public.horses (organization_id);

-- ---------------------------------------------------------------------------
-- Lesson series (weekly recurring templates)
-- ---------------------------------------------------------------------------

create table public.lesson_series (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  resource_id uuid not null references public.facility_resources (id),
  instructor_id uuid not null references public.profiles (id),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  max_participants integer not null default 1 check (max_participants >= 1),
  starts_on date not null default current_date,
  ends_on date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_series_time_valid check (ends_at > starts_at)
);

create index lesson_series_organization_id_idx on public.lesson_series (organization_id);

-- ---------------------------------------------------------------------------
-- Lessons
-- ---------------------------------------------------------------------------

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  resource_id uuid not null references public.facility_resources (id),
  instructor_id uuid not null references public.profiles (id),
  series_id uuid references public.lesson_series (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.lesson_status not null default 'active',
  max_participants integer not null default 1 check (max_participants >= 1),
  is_series_exception boolean not null default false,
  cancelled_by uuid references public.profiles (id),
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_time_valid check (ends_at > starts_at),
  constraint lessons_cancelled_metadata check (
    status = 'active'
    or (cancelled_by is not null and cancelled_at is not null)
  )
);

create index lessons_organization_id_idx on public.lessons (organization_id);
create index lessons_starts_at_idx on public.lessons (starts_at);
create index lessons_resource_id_idx on public.lessons (resource_id);
create index lessons_instructor_id_idx on public.lessons (instructor_id);

-- ---------------------------------------------------------------------------
-- Lesson participants
-- ---------------------------------------------------------------------------

create table public.lesson_participants (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  status public.participant_status not null default 'active',
  payment_status public.payment_status not null default 'unpaid',
  cancelled_by uuid references public.profiles (id),
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, user_id),
  constraint lesson_participants_cancelled_metadata check (
    status = 'active'
    or (cancelled_by is not null and cancelled_at is not null)
  )
);

create index lesson_participants_lesson_id_idx on public.lesson_participants (lesson_id);
create index lesson_participants_user_id_idx on public.lesson_participants (user_id);

-- ---------------------------------------------------------------------------
-- Participant horses
-- ---------------------------------------------------------------------------

create table public.participant_horses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.lesson_participants (id) on delete cascade,
  horse_id uuid not null references public.horses (id),
  created_at timestamptz not null default now(),
  unique (participant_id)
);

create index participant_horses_horse_id_idx on public.participant_horses (horse_id);

-- ---------------------------------------------------------------------------
-- Booking requests
-- ---------------------------------------------------------------------------

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  requested_by uuid not null references public.profiles (id),
  resource_id uuid not null references public.facility_resources (id),
  instructor_id uuid references public.profiles (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_request_status not null default 'pending',
  decided_by uuid references public.profiles (id),
  decided_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_requests_time_valid check (ends_at > starts_at)
);

create index booking_requests_organization_id_idx on public.booking_requests (organization_id);

-- ---------------------------------------------------------------------------
-- Audit events
-- ---------------------------------------------------------------------------

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  actor_id uuid not null references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_organization_id_idx on public.audit_events (organization_id);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category public.notification_category not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

create table public.notification_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  reminders_enabled boolean not null default true,
  schedule_changes_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

-- ---------------------------------------------------------------------------
-- Timestamp helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger memberships_set_updated_at
before update on public.memberships
for each row execute function public.set_updated_at();

create trigger facility_resources_set_updated_at
before update on public.facility_resources
for each row execute function public.set_updated_at();

create trigger horses_set_updated_at
before update on public.horses
for each row execute function public.set_updated_at();

create trigger lesson_series_set_updated_at
before update on public.lesson_series
for each row execute function public.set_updated_at();

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

create trigger lesson_participants_set_updated_at
before update on public.lesson_participants
for each row execute function public.set_updated_at();

create trigger booking_requests_set_updated_at
before update on public.booking_requests
for each row execute function public.set_updated_at();

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: auto-create profile on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helper functions
-- ---------------------------------------------------------------------------

create or replace function public.is_product_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_product_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_member_of_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
      and m.archived_at is null
  );
$$;

create or replace function public.get_membership_role(target_org_id uuid)
returns public.membership_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.memberships m
  where m.organization_id = target_org_id
    and m.user_id = auth.uid()
    and m.archived_at is null
  limit 1;
$$;

create or replace function public.can_manage_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_product_admin()
    or public.get_membership_role(target_org_id) = 'manager';
$$;

create or replace function public.can_operate_lessons(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_product_admin()
    or public.get_membership_role(target_org_id) in ('manager', 'instructor');
$$;

create or replace function public.is_client_or_boarder(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_membership_role(target_org_id) in ('client', 'boarder');
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.facility_resources enable row level security;
alter table public.horses enable row level security;
alter table public.lesson_series enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_participants enable row level security;
alter table public.participant_horses enable row level security;
alter table public.booking_requests enable row level security;
alter table public.audit_events enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

-- Organizations
create policy "organizations_select_member"
on public.organizations for select
using (public.is_product_admin() or public.is_member_of_org(id));

create policy "organizations_insert_product_admin"
on public.organizations for insert
with check (public.is_product_admin());

create policy "organizations_update_manager"
on public.organizations for update
using (public.can_manage_org(id));

-- Profiles
create policy "profiles_select_self_or_shared_org"
on public.profiles for select
using (
  public.is_product_admin()
  or id = auth.uid()
  or exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on mine.organization_id = theirs.organization_id
    where mine.user_id = auth.uid()
      and theirs.user_id = profiles.id
      and mine.archived_at is null
      and theirs.archived_at is null
      and public.can_operate_lessons(mine.organization_id)
  )
);

create policy "profiles_update_self"
on public.profiles for update
using (id = auth.uid() or public.is_product_admin());

-- Memberships
create policy "memberships_select_member"
on public.memberships for select
using (public.is_product_admin() or public.is_member_of_org(organization_id));

create policy "memberships_manage_manager"
on public.memberships for all
using (public.can_manage_org(organization_id))
with check (public.can_manage_org(organization_id));

-- Invites
create policy "invites_select_manager"
on public.invites for select
using (public.can_manage_org(organization_id));

create policy "invites_manage_manager"
on public.invites for all
using (public.can_manage_org(organization_id))
with check (public.can_manage_org(organization_id));

-- Facility resources & horses (managers write; lesson operators read)
create policy "facility_resources_select_member"
on public.facility_resources for select
using (public.is_product_admin() or public.is_member_of_org(organization_id));

create policy "facility_resources_manage_manager"
on public.facility_resources for all
using (public.can_manage_org(organization_id))
with check (public.can_manage_org(organization_id));

create policy "horses_select_member"
on public.horses for select
using (public.is_product_admin() or public.is_member_of_org(organization_id));

create policy "horses_manage_manager"
on public.horses for all
using (public.can_manage_org(organization_id))
with check (public.can_manage_org(organization_id));

-- Lesson series
create policy "lesson_series_select_operator"
on public.lesson_series for select
using (public.is_product_admin() or public.can_operate_lessons(organization_id));

create policy "lesson_series_manage_operator"
on public.lesson_series for all
using (public.can_operate_lessons(organization_id))
with check (public.can_operate_lessons(organization_id));

-- Lessons (instructors see all lessons in their org)
create policy "lessons_select_member"
on public.lessons for select
using (
  public.is_product_admin()
  or public.can_operate_lessons(organization_id)
  or (
    public.is_member_of_org(organization_id)
    and exists (
      select 1
      from public.lesson_participants lp
      where lp.lesson_id = lessons.id
        and lp.user_id = auth.uid()
    )
  )
);

create policy "lessons_manage_operator"
on public.lessons for all
using (public.can_operate_lessons(organization_id))
with check (public.can_operate_lessons(organization_id));

-- Lesson participants
create policy "lesson_participants_select_related"
on public.lesson_participants for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.lessons l
    where l.id = lesson_participants.lesson_id
      and (
        public.can_operate_lessons(l.organization_id)
        or (
          public.is_member_of_org(l.organization_id)
          and exists (
            select 1
            from public.lesson_participants lp2
            where lp2.lesson_id = l.id
              and lp2.user_id = auth.uid()
          )
        )
      )
  )
);

create policy "lesson_participants_manage_operator"
on public.lesson_participants for all
using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_participants.lesson_id
      and public.can_operate_lessons(l.organization_id)
  )
)
with check (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_participants.lesson_id
      and public.can_operate_lessons(l.organization_id)
  )
);

create policy "lesson_participants_cancel_self"
on public.lesson_participants for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Participant horses
create policy "participant_horses_select_operator"
on public.participant_horses for select
using (
  exists (
    select 1
    from public.lesson_participants lp
    join public.lessons l on l.id = lp.lesson_id
    where lp.id = participant_horses.participant_id
      and (
        public.can_operate_lessons(l.organization_id)
        or lp.user_id = auth.uid()
      )
  )
);

create policy "participant_horses_manage_operator"
on public.participant_horses for all
using (
  exists (
    select 1
    from public.lesson_participants lp
    join public.lessons l on l.id = lp.lesson_id
    where lp.id = participant_horses.participant_id
      and public.can_operate_lessons(l.organization_id)
  )
)
with check (
  exists (
    select 1
    from public.lesson_participants lp
    join public.lessons l on l.id = lp.lesson_id
    where lp.id = participant_horses.participant_id
      and public.can_operate_lessons(l.organization_id)
  )
);

-- Booking requests
create policy "booking_requests_select_related"
on public.booking_requests for select
using (
  public.can_manage_org(organization_id)
  or requested_by = auth.uid()
);

create policy "booking_requests_insert_client"
on public.booking_requests for insert
with check (
  requested_by = auth.uid()
  and public.is_client_or_boarder(organization_id)
);

create policy "booking_requests_update_manager"
on public.booking_requests for update
using (public.can_manage_org(organization_id));

-- Audit events
create policy "audit_events_select_manager"
on public.audit_events for select
using (public.can_manage_org(organization_id));

create policy "audit_events_insert_operator"
on public.audit_events for insert
with check (public.can_operate_lessons(organization_id) or public.can_manage_org(organization_id));

-- Notifications
create policy "notifications_select_own"
on public.notifications for select
using (user_id = auth.uid());

create policy "notifications_update_own"
on public.notifications for update
using (user_id = auth.uid());

create policy "notifications_insert_service"
on public.notifications for insert
with check (public.can_operate_lessons(organization_id) or public.can_manage_org(organization_id));

-- Notification preferences
create policy "notification_preferences_select_own"
on public.notification_preferences for select
using (user_id = auth.uid());

create policy "notification_preferences_upsert_own"
on public.notification_preferences for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
