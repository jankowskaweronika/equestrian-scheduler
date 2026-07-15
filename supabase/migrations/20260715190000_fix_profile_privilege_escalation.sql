-- Fix: prevent privilege escalation through profiles.is_product_admin
--
-- Problem: the "profiles_update_self" RLS policy lets a user update their own
-- profile row without any column restriction. An authenticated user could call
-- update({ is_product_admin: true }) on their own row and gain product-admin
-- access across every organization.
--
-- Defense in depth:
--   1. Revoke column-level UPDATE on is_product_admin from anon/authenticated,
--      so PostgREST rejects the write at the privilege layer. service_role
--      (server-side admin client) and SQL bootstrap keep the privilege.
--   2. A BEFORE UPDATE trigger that blocks changes to is_product_admin coming
--      from an authenticated caller who is not already a product admin, in case
--      the column grant is ever re-added.

-- ---------------------------------------------------------------------------
-- 1. Column-level privilege
-- ---------------------------------------------------------------------------

revoke update (is_product_admin) on public.profiles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Trigger safeguard
-- ---------------------------------------------------------------------------

create or replace function public.enforce_profile_protected_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_product_admin is distinct from old.is_product_admin then
    -- auth.uid() is null for the service role / server-side admin client.
    -- Authenticated end users may only keep the existing value unless they are
    -- already a product admin.
    if auth.uid() is not null and not public.is_product_admin() then
      raise exception 'Not allowed to modify is_product_admin'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_protected_columns on public.profiles;

create trigger profiles_enforce_protected_columns
before update on public.profiles
for each row execute function public.enforce_profile_protected_columns();
