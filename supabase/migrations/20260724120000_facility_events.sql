-- Facility events: public notices (shows, competitions) and technical work
-- windows (maintenance, repairs) attached to a facility resource or the whole
-- center. Managers create them; all org members can read public events;
-- maintenance events stay manager-only for now.

create type public.facility_event_kind as enum ('public_event', 'maintenance');

create table public.facility_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  resource_id uuid references public.facility_resources (id),
  kind public.facility_event_kind not null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  blocks_scheduling boolean not null default false,
  archived_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index facility_events_organization_id_idx
  on public.facility_events (organization_id);

create index facility_events_resource_id_idx
  on public.facility_events (resource_id);

create index facility_events_org_range_idx
  on public.facility_events (organization_id, starts_at, ends_at)
  where archived_at is null;

create trigger facility_events_set_updated_at
before update on public.facility_events
for each row execute function public.set_updated_at();

alter table public.facility_events enable row level security;

-- Public events: any org member (incl. boarders later). Maintenance: managers only.
create policy "facility_events_select_member"
on public.facility_events for select
using (
  public.is_product_admin()
  or (
    public.is_member_of_org(organization_id)
    and (
      kind = 'public_event'
      or public.can_manage_org(organization_id)
    )
  )
);

create policy "facility_events_manage_manager"
on public.facility_events for all
using (public.can_manage_org(organization_id))
with check (public.can_manage_org(organization_id));
