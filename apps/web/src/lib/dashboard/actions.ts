'use server';

import type { MembershipRole } from '@equestrian-scheduler/domain';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireManagerSession, requireProductAdminSession } from '@/lib/auth/session';
import { sendInviteEmail } from '@/lib/email';
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
  const address = String(formData.get('address') ?? '').trim() || null;
  const website = String(formData.get('website') ?? '').trim() || null;
  const facebookUrl = String(formData.get('facebookUrl') ?? '').trim() || null;
  const instagramUrl = String(formData.get('instagramUrl') ?? '').trim() || null;
  const contactEmail = String(formData.get('contactEmail') ?? '').trim() || null;
  const contactPhone = String(formData.get('contactPhone') ?? '').trim() || null;

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
      address,
      website,
      facebook_url: facebookUrl,
      instagram_url: instagramUrl,
      contact_email: contactEmail,
      contact_phone: contactPhone,
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
    redirect('/dashboard/resources?error=' + encodeURIComponent('Podaj nazwę i pojemność obiektu.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('facility_resources').insert({
    organization_id: organizationId,
    name,
    type,
    parallel_capacity: parallelCapacity,
  });

  if (error) {
    redirect('/dashboard/resources?error=' + encodeURIComponent('Nie udało się dodać obiektu.'));
  }

  revalidatePath('/dashboard/resources');
  redirect('/dashboard/resources?success=' + encodeURIComponent('Dodano obiekt.'));
}

export async function updateResource(resourceId: string, formData: FormData): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const name = String(formData.get('name') ?? '').trim();
  const type = String(formData.get('type') ?? 'indoor');
  const parallelCapacity = Number(formData.get('parallelCapacity') ?? 1);

  if (!name || parallelCapacity < 1) {
    redirect(
      `/dashboard/resources?edit=${resourceId}&error=` +
        encodeURIComponent('Podaj nazwę i pojemność obiektu.'),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('facility_resources')
    .update({
      name,
      type,
      parallel_capacity: parallelCapacity,
    })
    .eq('id', resourceId)
    .eq('organization_id', organizationId)
    .is('archived_at', null);

  if (error) {
    redirect(
      `/dashboard/resources?edit=${resourceId}&error=` +
        encodeURIComponent('Nie udało się zapisać zmian obiektu.'),
    );
  }

  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard/calendar');
  redirect('/dashboard/resources?success=' + encodeURIComponent('Zapisano zmiany obiektu.'));
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
    redirect('/dashboard/resources?error=' + encodeURIComponent('Nie udało się zarchiwizować obiektu.'));
  }

  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard/calendar');
  redirect('/dashboard/resources?success=' + encodeURIComponent('Obiekt został zarchiwizowany.'));
}

export async function createFacilityEvent(formData: FormData): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const kind = String(formData.get('kind') ?? 'public_event');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const resourceId = String(formData.get('resourceId') ?? '').trim() || null;
  const startsAtLocal = String(formData.get('startsAt') ?? '');
  const endsAtLocal = String(formData.get('endsAt') ?? '');
  const blocksScheduling = formData.get('blocksScheduling') === 'on';

  if (kind !== 'public_event' && kind !== 'maintenance') {
    redirect('/dashboard/resources?error=' + encodeURIComponent('Nieprawidłowy typ wydarzenia.'));
  }

  if (!title || !startsAtLocal || !endsAtLocal) {
    redirect(
      '/dashboard/resources?error=' +
        encodeURIComponent('Podaj tytuł oraz datę rozpoczęcia i zakończenia.'),
    );
  }

  const startsAt = new Date(startsAtLocal);
  const endsAt = new Date(endsAtLocal);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    redirect(
      '/dashboard/resources?error=' +
        encodeURIComponent('Sprawdź daty — zakończenie musi być później niż start.'),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from('facility_events').insert({
    organization_id: organizationId,
    resource_id: resourceId,
    kind,
    title,
    description,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    blocks_scheduling: kind === 'maintenance' ? true : blocksScheduling,
    created_by: session.userId,
  });

  if (error) {
    redirect(
      '/dashboard/resources?error=' + encodeURIComponent('Nie udało się dodać wydarzenia.'),
    );
  }

  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard/calendar');
  redirect(
    '/dashboard/resources?success=' +
      encodeURIComponent(
        kind === 'maintenance' ? 'Dodano pracę techniczną.' : 'Dodano wydarzenie.',
      ),
  );
}

export async function archiveFacilityEvent(eventId: string): Promise<void> {
  const session = await requireManagerSession();
  const organizationId = getOrganizationId(session);

  const supabase = await createClient();
  const { error } = await supabase
    .from('facility_events')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', eventId)
    .eq('organization_id', organizationId);

  if (error) {
    redirect(
      '/dashboard/resources?error=' + encodeURIComponent('Nie udało się zarchiwizować wydarzenia.'),
    );
  }

  revalidatePath('/dashboard/resources');
  revalidatePath('/dashboard/calendar');
  redirect('/dashboard/resources?success=' + encodeURIComponent('Wydarzenie zostało zarchiwizowane.'));
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

  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${appUrl}/invite/${data.token}`;

  const emailResult = await sendInviteEmail({
    to: email,
    inviteUrl,
    organizationName: organization?.name ?? 'ośrodka',
    role,
  });
  const emailNote = emailResult.ok
    ? `Wysłaliśmy e-mail na ${email}.`
    : 'Nie udało się wysłać e-maila — przekaż link ręcznie.';

  revalidatePath('/dashboard/team');
  redirect(
    '/dashboard/team?success=' +
      encodeURIComponent(`Zaproszenie utworzone. ${emailNote} Link aktywacyjny: ${inviteUrl}`),
  );
}

export async function createOrganization(formData: FormData): Promise<void> {
  const session = await requireProductAdminSession();

  const name = String(formData.get('name') ?? '').trim();
  const timezone = String(formData.get('timezone') ?? 'Europe/Warsaw').trim();
  const calendarOpensAt = String(formData.get('calendarOpensAt') ?? '07:00');
  const calendarClosesAt = String(formData.get('calendarClosesAt') ?? '22:00');
  const managerEmail = String(formData.get('managerEmail') ?? '')
    .trim()
    .toLowerCase();

  if (!name) {
    redirect(
      '/admin/organizations/new?error=' + encodeURIComponent('Nazwa ośrodka jest wymagana.'),
    );
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
    redirect(
      '/admin/organizations/new?error=' + encodeURIComponent('Nie udało się utworzyć ośrodka.'),
    );
  }

  // The platform admin does NOT become the manager. Instead they invite the
  // center owner (manager) by email, who accepts and runs the center.
  if (!managerEmail) {
    revalidatePath('/admin/organizations');
    redirect(
      '/admin/organizations?success=' +
        encodeURIComponent(`Utworzono ośrodek „${name}”. Dodaj managera z listy ośrodków.`),
    );
  }

  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .insert({
      organization_id: organization.id,
      email: managerEmail,
      role: 'manager',
      invited_by: session.userId,
    })
    .select('token')
    .single();

  if (inviteError || !invite) {
    redirect(
      '/admin/organizations?error=' +
        encodeURIComponent('Ośrodek utworzony, ale nie udało się utworzyć zaproszenia managera.'),
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  const emailResult = await sendInviteEmail({
    to: managerEmail,
    inviteUrl,
    organizationName: name,
    role: 'manager',
  });
  const emailNote = emailResult.ok
    ? `Wysłaliśmy zaproszenie na ${managerEmail}.`
    : 'Nie udało się wysłać e-maila — przekaż link managerowi ręcznie.';

  revalidatePath('/admin/organizations');
  redirect(
    '/admin/organizations?success=' +
      encodeURIComponent(`Utworzono ośrodek „${name}”. ${emailNote} Link dla managera: ${inviteUrl}`),
  );
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
