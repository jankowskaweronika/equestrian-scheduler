-- ---------------------------------------------------------------------------
-- Assign the "manager" role to an EXISTING user for a given organization.
--
-- Use this when the invited person already has an account, so the invitation
-- activation link cannot re-create them (it fails with "already registered").
--
-- Prerequisites:
--   1. The user account must already exist (register via /register first).
--   2. The organization must already exist (create it in the admin panel).
--
-- How to run: paste into Supabase -> SQL Editor and adjust the two values
-- in the CONFIG block below, then Run. The script is idempotent.
-- ---------------------------------------------------------------------------

do $$
declare
  -- CONFIG: change these two values.
  v_email text := 'wjankowska8@gmail.com';
  v_org_name text := 'Ośrodek Lisek';

  v_user_id uuid;
  v_org_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(v_email);
  if v_user_id is null then
    raise exception 'No auth user with email %. Register the account first.', v_email;
  end if;

  select id into v_org_id
  from public.organizations
  where lower(name) = lower(v_org_name)
  order by created_at desc
  limit 1;
  if v_org_id is null then
    raise exception 'No organization named %.', v_org_name;
  end if;

  -- Grant (or restore) the manager membership.
  insert into public.memberships (organization_id, user_id, role)
  values (v_org_id, v_user_id, 'manager')
  on conflict (organization_id, user_id)
  do update set role = 'manager', archived_at = null;

  -- Make this organization the active one for the user.
  update public.profiles
  set active_organization_id = v_org_id
  where id = v_user_id;

  -- Mark any pending invite for this email/org as accepted (cosmetic cleanup).
  update public.invites
  set status = 'accepted', accepted_by = v_user_id, accepted_at = now()
  where organization_id = v_org_id
    and lower(email) = lower(v_email)
    and status = 'pending';

  raise notice 'Manager role assigned: user % -> organization %', v_user_id, v_org_id;
end $$;
