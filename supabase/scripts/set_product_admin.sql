-- Promote a registered user to platform product admin (operator).
--
-- `profiles.is_product_admin` is a protected column: it cannot be changed
-- through the API (RLS + column grants + the enforce_profile_protected_columns
-- trigger). Run this in the Supabase SQL editor (or with the service role),
-- which executes as the table owner and may set it.
--
-- The target user must have signed up first, so a row already exists in
-- public.profiles. Replace the email before running.

update public.profiles
set is_product_admin = true
where email = 'chomawerka@gmail.com';

-- To revoke admin access again:
-- update public.profiles set is_product_admin = false where email = 'chomawerka@gmail.com';
