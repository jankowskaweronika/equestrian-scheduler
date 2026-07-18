'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireProductAdminSession } from '@/lib/auth/session';
import { sendInviteEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

function detailPath(organizationId: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return `/admin/organizations/${organizationId}${query ? `?${query}` : ''}`;
}

export async function inviteManager(formData: FormData): Promise<void> {
  const session = await requireProductAdminSession();

  const organizationId = String(formData.get('organizationId') ?? '');
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  if (!organizationId || !email) {
    redirect(detailPath(organizationId, { error: 'Podaj adres e-mail managera.' }));
  }

  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from('invites')
    .insert({
      organization_id: organizationId,
      email,
      role: 'manager',
      invited_by: session.userId,
    })
    .select('token')
    .single();

  if (error || !invite) {
    redirect(detailPath(organizationId, { error: 'Nie udało się utworzyć zaproszenia managera.' }));
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  const emailResult = await sendInviteEmail({
    to: email,
    inviteUrl,
    organizationName: organization?.name ?? 'ośrodka',
    role: 'manager',
  });
  const emailNote = emailResult.ok
    ? `Wysłaliśmy zaproszenie na ${email}.`
    : 'Nie udało się wysłać e-maila — przekaż link ręcznie.';

  revalidatePath(`/admin/organizations/${organizationId}`);
  redirect(
    detailPath(organizationId, {
      success: `${emailNote} Link: ${inviteUrl}`,
    }),
  );
}

export async function saveSubscription(formData: FormData): Promise<void> {
  await requireProductAdminSession();

  const organizationId = String(formData.get('organizationId') ?? '');
  const plan = String(formData.get('plan') ?? '').trim() || 'pilot';
  const status = String(formData.get('status') ?? 'trial');
  const priceAmount = Number(formData.get('priceAmount') ?? 0);
  const currency = String(formData.get('currency') ?? 'PLN').trim().toUpperCase() || 'PLN';
  const billingCycle = String(formData.get('billingCycle') ?? 'monthly');
  const currentPeriodEnd = String(formData.get('currentPeriodEnd') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!organizationId || Number.isNaN(priceAmount) || priceAmount < 0) {
    redirect(detailPath(organizationId, { error: 'Podaj poprawną kwotę subskrypcji.' }));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('subscriptions').upsert(
    {
      organization_id: organizationId,
      plan,
      status,
      price_amount: priceAmount,
      currency,
      billing_cycle: billingCycle,
      current_period_end: currentPeriodEnd,
      notes,
    },
    { onConflict: 'organization_id' },
  );

  if (error) {
    redirect(detailPath(organizationId, { error: 'Nie udało się zapisać subskrypcji.' }));
  }

  revalidatePath(`/admin/organizations/${organizationId}`);
  redirect(detailPath(organizationId, { success: 'Zapisano subskrypcję.' }));
}

export async function addServicePayment(formData: FormData): Promise<void> {
  await requireProductAdminSession();

  const organizationId = String(formData.get('organizationId') ?? '');
  const amount = Number(formData.get('amount') ?? 0);
  const currency = String(formData.get('currency') ?? 'PLN').trim().toUpperCase() || 'PLN';
  const paidAt = String(formData.get('paidAt') ?? '').trim() || new Date().toISOString().slice(0, 10);
  const periodStart = String(formData.get('periodStart') ?? '').trim() || null;
  const periodEnd = String(formData.get('periodEnd') ?? '').trim() || null;
  const note = String(formData.get('note') ?? '').trim() || null;

  if (!organizationId || Number.isNaN(amount) || amount < 0) {
    redirect(detailPath(organizationId, { error: 'Podaj poprawną kwotę płatności.' }));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('service_payments').insert({
    organization_id: organizationId,
    amount,
    currency,
    paid_at: paidAt,
    period_start: periodStart,
    period_end: periodEnd,
    note,
  });

  if (error) {
    redirect(detailPath(organizationId, { error: 'Nie udało się zapisać płatności.' }));
  }

  revalidatePath(`/admin/organizations/${organizationId}`);
  redirect(detailPath(organizationId, { success: 'Zapisano płatność.' }));
}

export async function setOrganizationSuspended(
  organizationId: string,
  suspended: boolean,
): Promise<void> {
  await requireProductAdminSession();

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ suspended_at: suspended ? new Date().toISOString() : null })
    .eq('id', organizationId);

  if (error) {
    redirect(detailPath(organizationId, { error: 'Nie udało się zmienić statusu zawieszenia.' }));
  }

  revalidatePath(`/admin/organizations/${organizationId}`);
  redirect(
    detailPath(organizationId, {
      success: suspended ? 'Ośrodek został zawieszony.' : 'Zawieszenie zostało cofnięte.',
    }),
  );
}

export async function setOrganizationArchived(
  organizationId: string,
  archived: boolean,
): Promise<void> {
  await requireProductAdminSession();

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', organizationId);

  if (error) {
    redirect(detailPath(organizationId, { error: 'Nie udało się zmienić statusu archiwizacji.' }));
  }

  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath('/admin/organizations');
  redirect(
    detailPath(organizationId, {
      success: archived ? 'Ośrodek został zarchiwizowany.' : 'Archiwizacja została cofnięta.',
    }),
  );
}
