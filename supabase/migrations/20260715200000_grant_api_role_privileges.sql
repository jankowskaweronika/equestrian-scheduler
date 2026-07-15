-- Grant base-table privileges to the Supabase API roles.
--
-- Problem: application tables are created by the `postgres` role during
-- migrations. The default privileges for `postgres` only grant TRUNCATE /
-- REFERENCES / TRIGGER / MAINTAIN to anon/authenticated/service_role, NOT
-- select/insert/update/delete. As a result every PostgREST request fails with
-- "permission denied for table ...". Row Level Security is already enabled on
-- every table, so it (not the absence of grants) is the real access gate.
--
-- Model:
--   * service_role  -> full CRUD (trusted server key; also bypasses RLS).
--   * authenticated -> full CRUD, but every row is still filtered by RLS.
--   * anon          -> no table privileges (least privilege). It only needs
--                      schema usage to call the SECURITY DEFINER invite-preview
--                      RPC, whose EXECUTE grant is defined in an earlier
--                      migration. No app flow reads tables as anon directly.

-- ---------------------------------------------------------------------------
-- Schema usage
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Table & sequence privileges for existing objects
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;

grant usage, select on all sequences in schema public
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Default privileges so future tables created by `postgres` inherit the grants
-- ---------------------------------------------------------------------------

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Re-assert the privilege-escalation fix (migration 20260715190000).
--
-- The blanket `grant update ... to authenticated` above re-granted UPDATE on
-- every profiles column, including is_product_admin. A column-level REVOKE of a
-- single column is a no-op while the role holds table-wide UPDATE (PostgreSQL
-- cannot carve a column exception out of a table grant). So instead we drop the
-- table-wide UPDATE for `authenticated` on profiles and re-grant UPDATE only on
-- the columns an end user may legitimately change. is_product_admin is
-- intentionally excluded, so only service_role (bootstrap) can set it.
--
-- service_role keeps full table UPDATE (it is trusted and bypasses RLS).
-- The trigger `profiles_enforce_protected_columns` remains the second layer.
-- ---------------------------------------------------------------------------

revoke update on public.profiles from authenticated;

grant update (first_name, last_name, phone, active_organization_id)
  on public.profiles to authenticated;
