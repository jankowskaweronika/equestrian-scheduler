import type { MembershipRole } from '@equestrian-scheduler/domain';
import { canManageOrganization } from '@equestrian-scheduler/domain';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type UserSession = {
  userId: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    isProductAdmin: boolean;
    activeOrganizationId: string | null;
  };
  membership: {
    id: string;
    organizationId: string;
    role: MembershipRole;
    organizationName: string;
  } | null;
  memberships: Array<{
    id: string;
    organizationId: string;
    role: MembershipRole;
    organizationName: string;
  }>;
};

export async function getSession(): Promise<UserSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, is_product_admin, active_organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return null;
  }

  const { data: memberships } = await supabase
    .from('memberships')
    .select('id, organization_id, role, organizations(name)')
    .eq('user_id', user.id)
    .is('archived_at', null);

  const mappedMemberships =
    memberships?.map((membership) => ({
      id: membership.id,
      organizationId: membership.organization_id,
      role: membership.role as MembershipRole,
      organizationName:
        (Array.isArray(membership.organizations)
          ? membership.organizations[0]?.name
          : (membership.organizations as { name: string } | null)?.name) ?? 'Ośrodek',
    })) ?? [];

  const activeMembership =
    mappedMemberships.find((m) => m.organizationId === profile.active_organization_id) ??
    mappedMemberships[0] ??
    null;

  return {
    userId: user.id,
    email: user.email ?? '',
    profile: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone,
      isProductAdmin: profile.is_product_admin,
      activeOrganizationId: profile.active_organization_id,
    },
    membership: activeMembership,
    memberships: mappedMemberships,
  };
}

const NO_ACCESS_MESSAGE =
  'Konto jest aktywne, ale nie masz dostępu do panelu managera. Poproś administratora o zaproszenie do ośrodka.';

export async function requireSession(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect('/login?error=' + encodeURIComponent('Sesja wygasła. Zaloguj się ponownie.'));
  }
  return session;
}

export async function requireManagerSession(): Promise<UserSession> {
  const session = await requireSession();

  if (
    !session.profile.isProductAdmin &&
    (!session.membership || !canManageOrganization(session.membership.role))
  ) {
    redirect('/login?error=' + encodeURIComponent(NO_ACCESS_MESSAGE));
  }

  return session;
}

export async function requireProductAdminSession(): Promise<UserSession> {
  const session = await requireSession();

  if (!session.profile.isProductAdmin) {
    redirect('/dashboard');
  }

  return session;
}
