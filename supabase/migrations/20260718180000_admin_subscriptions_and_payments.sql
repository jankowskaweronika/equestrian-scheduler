-- Admin (product_admin) service billing overview.
--
-- Adds a lightweight, MANUAL subscription + payment tracker for the platform
-- operator (product_admin). This is informational bookkeeping for the pilot, not
-- an automated billing gateway. Only product admins can read or write these
-- rows; RLS enforces it via the existing is_product_admin() helper.
--
-- Also adds organizations.suspended_at so an admin can suspend an org's access
-- to the service independently from the archive (soft-delete) flag.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

create type public.subscription_status as enum (
  'trial',
  'active',
  'past_due',
  'cancelled'
);

create type public.billing_cycle as enum (
  'monthly',
  'yearly'
);

-- ---------------------------------------------------------------------------
-- 2. Organizations: suspend flag (distinct from archive)
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column suspended_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. Subscriptions (one active row per organization)
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  plan text not null default 'pilot',
  status public.subscription_status not null default 'trial',
  price_amount numeric(10, 2) not null default 0,
  currency text not null default 'PLN',
  billing_cycle public.billing_cycle not null default 'monthly',
  current_period_end date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_price_non_negative check (price_amount >= 0)
);

create index subscriptions_organization_id_idx
  on public.subscriptions (organization_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Service payments (append-only history of what an org paid the platform)
-- ---------------------------------------------------------------------------

create table public.service_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'PLN',
  paid_at date not null default current_date,
  period_start date,
  period_end date,
  note text,
  created_at timestamptz not null default now(),
  constraint service_payments_amount_non_negative check (amount >= 0)
);

create index service_payments_organization_id_idx
  on public.service_payments (organization_id, paid_at desc);

-- ---------------------------------------------------------------------------
-- 5. Row Level Security: product admins only
-- ---------------------------------------------------------------------------

alter table public.subscriptions enable row level security;
alter table public.service_payments enable row level security;

create policy "subscriptions_admin_all"
  on public.subscriptions for all
  using (public.is_product_admin())
  with check (public.is_product_admin());

create policy "service_payments_admin_all"
  on public.service_payments for all
  using (public.is_product_admin())
  with check (public.is_product_admin());

-- ---------------------------------------------------------------------------
-- 6. Grants (RLS still filters every row)
--
-- Default privileges from migration 20260715200000 already grant CRUD on new
-- tables to authenticated/service_role, but we grant explicitly for clarity.
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.subscriptions
  to authenticated, service_role;

grant select, insert, update, delete on public.service_payments
  to authenticated, service_role;
