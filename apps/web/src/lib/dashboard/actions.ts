'use server';

import type { MembershipRole } from '@equestrian-scheduler/domain';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireManagerSession, requireProductAdminSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

function getOrganizationId(session: Awaited<ReturnType<typeof requireManagerSession>>) {
  const organizationId = session.membership?.organizationId ?? session.profile.activeOrganizationId;
  if (!organizationId) {
    throw new Error('Brak aktywnego ośrodka.');
  }
  return organizationId;
}

export async function updateOrganization(formData: FormData): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const name = String(formData.get('name') ?? '').trim();
  const timezone = String(formData.get('timezone') ?? 'Europe/Warsaw').trim();
  const calendarOpensAt = String(formData.get('calendarOpensAt') ?? '07:00');
  const calendarClosesAt = String(formData.get('calendarClosesAt') ?? '22:00');
  const logoUrl = String(formData.get('logoUrl') ?? '').trim() || null;

  if (!name) {
    redirect(
      '/dashboard/organization?error=' + encodeURIComponent('Nazwa ośrodka jest wymagana.'),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({
      name,
      timezone,
      calendar_opens_at: calendarOpensAt,
      calendar_closes_at: calendarClosesAt,
      logo_url: logoUrl,
    })
    .eq('id', organizationId);

  if (error) {
    redirect(
      '/dashboard/organization?error=' +
        encodeURIComponent('Nie udało się zapisać ustawień ośrodka.'),
    );
  }

  revalidatePath('/dashboard/organization');
  redirect(
    '/dashboard/organization?success=' + encodeURIComponent('Zapisano ustawienia ośrodka.'),
  );
}

export async function createResource(formData: FormData): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const name = String(formData.get('name') ?? '').trim();
  const type = String(formData.get('type') ?? 'indoor');
  const parallelCapacity = Number(formData.get('parallelCapacity') ?? 1);

  if (!name || parallelCapacity < 1) {
    redirect('/dashboard/resources?error=' + encodeURIComponent('Podaj nazwę i pojemność zasobu.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('facility_resources').insert({
    organization_id: organizationId,
    name,
    type,
    parallel_capacity: parallelCapacity,
  });

  if (error) {
    redirect('/dashboard/resources?error=' + encodeURIComponent('Nie udało się dodać zasobu.'));
  }

  revalidatePath('/dashboard/resources');
  redirect('/dashboard/resources?success=' + encodeURIComponent('Dodano zasób.'));
}

export async function archiveResource(resourceId: string): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const supabase = await createClient();
  const { error } = await supabase
    .from('facility_resources')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', resourceId)
    .eq('organization_id', organizationId);

  if (error) {
    redirect('/dashboard/resources?error=' + encodeURIComponent('Nie udało się usunąć zasobu.'));
  }

  revalidatePath('/dashboard/resources');
  redirect('/dashboard/resources?success=' + encodeURIComponent('Zasób został zarchiwizowany.'));
}

export async function createHorse(formData: FormData): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const name = String(formData.get('name') ?? '').trim();
  const dailyRideLimit = Number(formData.get('dailyRideLimit') ?? 4);

  if (!name || dailyRideLimit < 1) {
    redirect('/dashboard/horses?error=' + encodeURIComponent('Podaj imię konia i limit jazd.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('horses').insert({
    organization_id: organizationId,
    name,
    daily_ride_limit: dailyRideLimit,
  });

  if (error) {
    redirect('/dashboard/horses?error=' + encodeURIComponent('Nie udało się dodać konia.'));
  }

  revalidatePath('/dashboard/horses');
  redirect('/dashboard/horses?success=' + encodeURIComponent('Dodano konia.'));
}

export async function archiveHorse(horseId: string): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const supabase = await createClient();
  const { error } = await supabase
    .from('horses')
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq('id', horseId)
    .eq('organization_id', organizationId);

  if (error) {
    redirect('/dashboard/horses?error=' + encodeURIComponent('Nie udało się usunąć konia.'));
  }

  revalidatePath('/dashboard/horses');
  redirect('/dashboard/horses?success=' + encodeURIComponent('Koń został zarchiwizowany.'));
}

export async function createInvite(formData: FormData): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? 'client') as MembershipRole;

  if (!email) {
    redirect('/dashboard/team?error=' + encodeURIComponent('Podaj adres email.'));
  }

  if (role === 'product_admin') {
    redirect('/dashboard/team?error=' + encodeURIComponent('Nie można zaprosić roli admin produktu.'));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invites')
    .insert({
      organization_id: organizationId,
      email,
      role,
      invited_by: session.userId,
    })
    .select('token')
    .single();

  if (error || !data) {
    redirect('/dashboard/team?error=' + encodeURIComponent('Nie udało się utworzyć zaproszenia.'));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${appUrl}/invite/${data.token}`;

  revalidatePath('/dashboard/team');
  redirect(
    '/dashboard/team?success=' +
      encodeURIComponent(`Zaproszenie utworzone. Link aktywacyjny: ${inviteUrl}`),
  );
}

export async function createOrganization(formData: FormData): Promise<void> {
  const session = await requireProductAdminSession();

  const name = String(formData.get('name') ?? '').trim();
  const timezone = String(formData.get('timezone') ?? 'Europe/Warsaw').trim();
  const calendarOpensAt = String(formData.get('calendarOpensAt') ?? '07:00');
  const calendarClosesAt = String(formData.get('calendarClosesAt') ?? '22:00');

  if (!name) {
    redirect('/admin/organizations?error=' + encodeURIComponent('Nazwa ośrodka jest wymagana.'));
  }

  const supabase = await createClient();
  const { data: organization, error } = await supabase
    .from('organizations')
    .insert({
      name,
      timezone,
      calendar_opens_at: calendarOpensAt,
      calendar_closes_at: calendarClosesAt,
    })
    .select('id')
    .single();

  if (error || !organization) {
    redirect('/admin/organizations?error=' + encodeURIComponent('Nie udało się utworzyć ośrodka.'));
  }

  const { error: membershipError } = await supabase.from('memberships').insert({
    organization_id: organization.id,
    user_id: session.userId,
    role: 'manager',
  });

  if (membershipError) {
    redirect(
      '/admin/organizations?error=' +
        encodeURIComponent('Ośrodek utworzony, ale nie udało się przypisać Cię jako manager.'),
    );
  }

  await supabase
    .from('profiles')
    .update({ active_organization_id: organization.id })
    .eq('id', session.userId);

  revalidatePath('/admin/organizations');
  revalidatePath('/dashboard');
  redirect('/admin/organizations?success=' + encodeURIComponent(`Utworzono ośrodek „${name}”.`));
}

export async function switchOrganization(organizationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from('profiles')
    .update({ active_organization_id: organizationId })
    .eq('id', user.id);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
