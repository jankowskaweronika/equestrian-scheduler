-- Etap 1: invite preview RPC and product_admin membership bootstrap

create policy "memberships_insert_product_admin"
on public.memberships
for insert
with check (public.is_product_admin());

create or replace function public.get_invite_preview(invite_token text)
returns table (
  id uuid,
  email text,
  role public.membership_role,
  organization_name text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.email, i.role, o.name, i.expires_at
  from public.invites i
  join public.organizations o on o.id = i.organization_id
  where i.token = invite_token
    and i.status = 'pending'
    and i.expires_at > now();
$$;

revoke all on function public.get_invite_preview(text) from public;
grant execute on function public.get_invite_preview(text) to anon, authenticated;
