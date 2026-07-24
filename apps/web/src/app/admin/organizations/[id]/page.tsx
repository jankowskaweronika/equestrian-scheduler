import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { requireProductAdminSession } from '@/lib/auth/session';
import {
  addServicePayment,
  inviteManager,
  saveSubscription,
  setOrganizationArchived,
  setOrganizationSuspended,
} from '@/lib/admin/actions';
import { createClient } from '@/lib/supabase/server';
import { colors, radii, spacing, typography } from '@equestrian-scheduler/ui-tokens';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  ROLE_LABELS,
  SectionTitle,
  Select,
  SuccessMessage,
  Table,
} from '@/components/ui';
import {
  BILLING_CYCLE_LABELS,
  formatMoney,
  organizationLifecycle,
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusTone,
  type SubscriptionStatusKey,
} from '@/lib/admin/labels';

type MembershipRow = {
  id: string;
  role: string;
  profiles:
    | { first_name: string; last_name: string; email: string; phone: string }
    | { first_name: string; last_name: string; email: string; phone: string }[]
    | null;
};

function profileOf(member: MembershipRow) {
  return Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: spacing.md,
        padding: `${spacing.sm}px 0`,
        borderBottom: `1px solid ${colors.border}`,
        fontSize: typography.fontSize.sm,
      }}
    >
      <span style={{ color: colors.textMuted }}>{label}</span>
      <span style={{ wordBreak: 'break-word' }}>{children}</span>
    </div>
  );
}

function Value({ children }: { children: string | null | undefined }) {
  if (!children) {
    return <span style={{ color: colors.textMuted }}>—</span>;
  }
  return <>{children}</>;
}

function ExternalLink({ href }: { href: string | null | undefined }) {
  if (!href) {
    return <span style={{ color: colors.textMuted }}>—</span>;
  }
  return (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {href}
    </a>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        padding: spacing.md,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.md,
        background: colors.surface,
      }}
    >
      <p style={{ margin: 0, fontSize: typography.fontSize.xxl, fontWeight: 700 }}>{value}</p>
      <p
        style={{
          margin: `${spacing.xs}px 0 0`,
          fontSize: typography.fontSize.xs,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
    </div>
  );
}

export default async function AdminOrganizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireProductAdminSession();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: organization } = await supabase
    .from('organizations')
    .select(
      'id, name, timezone, calendar_opens_at, calendar_closes_at, logo_url, address, website, facebook_url, instagram_url, contact_email, contact_phone, created_at, archived_at, suspended_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (!organization) {
    notFound();
  }

  const [{ data: subscription }, { data: payments }, { data: members }, resourceCount, horseCount, lessonCount] =
    await Promise.all([
      supabase
        .from('subscriptions')
        .select(
          'plan, status, price_amount, currency, billing_cycle, current_period_end, notes',
        )
        .eq('organization_id', id)
        .maybeSingle(),
      supabase
        .from('service_payments')
        .select('id, amount, currency, paid_at, period_start, period_end, note')
        .eq('organization_id', id)
        .order('paid_at', { ascending: false }),
      supabase
        .from('memberships')
        .select('id, role, profiles(first_name, last_name, email, phone)')
        .eq('organization_id', id)
        .is('archived_at', null),
      supabase
        .from('facility_resources')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', id)
        .is('archived_at', null),
      supabase
        .from('horses')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', id)
        .is('archived_at', null),
      supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', id),
    ]);

  const memberRows = (members ?? []) as MembershipRow[];
  const roleCounts = memberRows.reduce<Record<string, number>>((acc, member) => {
    acc[member.role] = (acc[member.role] ?? 0) + 1;
    return acc;
  }, {});
  const managers = memberRows.filter((member) => member.role === 'manager');

  const lifecycle = organizationLifecycle(organization);
  const currency = subscription?.currency ?? 'PLN';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: spacing.xl }}>
      <p style={{ marginTop: 0 }}>
        <Link href="/admin/organizations">← Wszystkie ośrodki</Link>
      </p>

      <PageHeader
        title={organization.name}
        description={`Strefa ${organization.timezone} · utworzono ${new Date(
          organization.created_at,
        ).toLocaleDateString('pl-PL')}`}
        actions={<Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>}
      />

      <div style={{ marginBottom: spacing.md }}>
        <SuccessMessage message={query.success} />
        <ErrorMessage message={query.error} />
      </div>

      <div style={{ display: 'grid', gap: spacing.lg }}>
        {/* Center profile (read-only for admin) */}
        <Card>
          <SectionTitle>Profil ośrodka</SectionTitle>
          <p style={{ marginTop: 0, color: colors.textMuted, fontSize: typography.fontSize.sm }}>
            Dane wprowadza właściciel ośrodka. Widok administratora jest tylko do odczytu.
          </p>
          <div>
            <InfoRow label="Nazwa">
              <Value>{organization.name}</Value>
            </InfoRow>
            <InfoRow label="Adres">
              <Value>{organization.address}</Value>
            </InfoRow>
            <InfoRow label="Strona internetowa">
              <ExternalLink href={organization.website} />
            </InfoRow>
            <InfoRow label="Facebook">
              <ExternalLink href={organization.facebook_url} />
            </InfoRow>
            <InfoRow label="Instagram">
              <ExternalLink href={organization.instagram_url} />
            </InfoRow>
            <InfoRow label="Email kontaktowy">
              {organization.contact_email ? (
                <a href={`mailto:${organization.contact_email}`}>{organization.contact_email}</a>
              ) : (
                <Value>{null}</Value>
              )}
            </InfoRow>
            <InfoRow label="Telefon kontaktowy">
              {organization.contact_phone ? (
                <a href={`tel:${organization.contact_phone}`}>{organization.contact_phone}</a>
              ) : (
                <Value>{null}</Value>
              )}
            </InfoRow>
            <InfoRow label="Strefa czasowa">
              <Value>{organization.timezone}</Value>
            </InfoRow>
            <InfoRow label="Godziny kalendarza">
              {`${organization.calendar_opens_at.slice(0, 5)} – ${organization.calendar_closes_at.slice(0, 5)}`}
            </InfoRow>
          </div>
        </Card>

        {/* Usage statistics */}
        <Card>
          <SectionTitle>Statystyki użycia</SectionTitle>
          <div
            style={{
              display: 'grid',
              gap: spacing.sm,
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            }}
          >
            <Stat label="Członkowie" value={memberRows.length} />
            <Stat label="Obiekty" value={resourceCount.count ?? 0} />
            <Stat label="Konie" value={horseCount.count ?? 0} />
            <Stat label="Lekcje" value={lessonCount.count ?? 0} />
          </div>
          {memberRows.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
              {Object.entries(roleCounts).map(([role, count]) => (
                <Badge key={role} tone="neutral">
                  {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}: {count}
                </Badge>
              ))}
            </div>
          ) : null}
        </Card>

        {/* Owner / contact */}
        <Card>
          <SectionTitle>Właściciel i kontakt</SectionTitle>
          {managers.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <th>Imię i nazwisko</th>
                  <th>Email</th>
                  <th>Telefon</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((member) => {
                  const profile = profileOf(member);
                  return (
                    <tr key={member.id}>
                      <td>
                        <strong>
                          {profile?.first_name} {profile?.last_name}
                        </strong>
                      </td>
                      <td>{profile?.email}</td>
                      <td>{profile?.phone}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <EmptyState>Brak przypisanego managera (właściciela).</EmptyState>
          )}

          <form
            action={inviteManager}
            style={{
              display: 'flex',
              gap: spacing.sm,
              alignItems: 'end',
              flexWrap: 'wrap',
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <input type="hidden" name="organizationId" value={organization.id} />
            <div style={{ flex: '1 1 240px' }}>
              <Field label="Zaproś managera (e-mail)">
                <Input name="email" type="email" required placeholder="wlasciciel@przyklad.pl" />
              </Field>
            </div>
            <Button type="submit" variant="secondary">
              Wyślij zaproszenie
            </Button>
          </form>
        </Card>

        {/* Subscription */}
        <Card>
          <SectionTitle>Subskrypcja usługi</SectionTitle>
          {subscription ? (
            <p style={{ marginTop: 0, color: colors.textMuted, fontSize: typography.fontSize.sm }}>
              Aktualnie:{' '}
              <Badge tone={subscriptionStatusTone(subscription.status)}>
                {SUBSCRIPTION_STATUS_LABELS[subscription.status as SubscriptionStatusKey] ??
                  subscription.status}
              </Badge>{' '}
              · {formatMoney(subscription.price_amount, currency)} /{' '}
              {BILLING_CYCLE_LABELS[
                subscription.billing_cycle as keyof typeof BILLING_CYCLE_LABELS
              ] ?? subscription.billing_cycle}
            </p>
          ) : (
            <p style={{ marginTop: 0, color: colors.textMuted, fontSize: typography.fontSize.sm }}>
              Ten ośrodek nie ma jeszcze zapisanej subskrypcji.
            </p>
          )}
          <form action={saveSubscription} style={{ display: 'grid', gap: spacing.md, maxWidth: 520 }}>
            <input type="hidden" name="organizationId" value={organization.id} />
            <Field label="Plan">
              <Input name="plan" defaultValue={subscription?.plan ?? 'pilot'} />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={subscription?.status ?? 'trial'}>
                {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <div style={{ display: 'grid', gap: spacing.md, gridTemplateColumns: '2fr 1fr' }}>
              <Field label="Kwota">
                <Input
                  name="priceAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={subscription?.price_amount ?? 0}
                />
              </Field>
              <Field label="Waluta">
                <Input name="currency" defaultValue={currency} maxLength={3} />
              </Field>
            </div>
            <Field label="Cykl rozliczeniowy">
              <Select name="billingCycle" defaultValue={subscription?.billing_cycle ?? 'monthly'}>
                {Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Opłacone do">
              <Input
                name="currentPeriodEnd"
                type="date"
                defaultValue={subscription?.current_period_end ?? ''}
              />
            </Field>
            <Field label="Notatki">
              <Input name="notes" defaultValue={subscription?.notes ?? ''} />
            </Field>
            <Button type="submit" style={{ justifySelf: 'start' }}>
              Zapisz subskrypcję
            </Button>
          </form>
        </Card>

        {/* Payments */}
        <Card>
          <SectionTitle>Płatności za usługę</SectionTitle>
          <form
            action={addServicePayment}
            style={{
              display: 'grid',
              gap: spacing.md,
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              alignItems: 'end',
              marginBottom: spacing.lg,
            }}
          >
            <input type="hidden" name="organizationId" value={organization.id} />
            <Field label="Kwota">
              <Input name="amount" type="number" min={0} step="0.01" required />
            </Field>
            <Field label="Waluta">
              <Input name="currency" defaultValue={currency} maxLength={3} />
            </Field>
            <Field label="Data wpłaty">
              <Input name="paidAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label="Okres od">
              <Input name="periodStart" type="date" />
            </Field>
            <Field label="Okres do">
              <Input name="periodEnd" type="date" />
            </Field>
            <Button type="submit">Dodaj płatność</Button>
          </form>

          {payments && payments.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Kwota</th>
                  <th>Okres</th>
                  <th>Notatka</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.paid_at).toLocaleDateString('pl-PL')}</td>
                    <td>
                      <strong>{formatMoney(payment.amount, payment.currency)}</strong>
                    </td>
                    <td>
                      {payment.period_start && payment.period_end
                        ? `${new Date(payment.period_start).toLocaleDateString('pl-PL')} – ${new Date(
                            payment.period_end,
                          ).toLocaleDateString('pl-PL')}`
                        : '—'}
                    </td>
                    <td>{payment.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState>Brak zarejestrowanych płatności.</EmptyState>
          )}
        </Card>

        {/* Administrative actions */}
        <Card>
          <SectionTitle>Akcje administracyjne</SectionTitle>
          <p style={{ marginTop: 0, color: colors.textMuted, fontSize: typography.fontSize.sm }}>
            Zawieszenie blokuje dostęp ośrodka do usługi. Archiwizacja ukrywa ośrodek (miękkie
            usunięcie). Obie akcje są odwracalne.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
            <form action={setOrganizationSuspended.bind(null, organization.id, !organization.suspended_at)}>
              <Button type="submit" variant="secondary">
                {organization.suspended_at ? 'Cofnij zawieszenie' : 'Zawieś ośrodek'}
              </Button>
            </form>
            <form action={setOrganizationArchived.bind(null, organization.id, !organization.archived_at)}>
              <Button type="submit" variant={organization.archived_at ? 'secondary' : 'danger'}>
                {organization.archived_at ? 'Cofnij archiwizację' : 'Archiwizuj ośrodek'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
