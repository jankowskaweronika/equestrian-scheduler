import Link from 'next/link';

import { requireProductAdminSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { colors, radii, spacing, typography } from '@equestrian-scheduler/ui-tokens';
import {
  Badge,
  Card,
  EmptyState,
  ErrorMessage,
  PageHeader,
  SectionTitle,
  SuccessMessage,
} from '@/components/ui';
import { ArrowRightIcon, PlusIcon } from '@/components/icons';
import {
  organizationLifecycle,
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusTone,
  type SubscriptionStatusKey,
} from '@/lib/admin/labels';

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireProductAdminSession();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, timezone, created_at, archived_at, suspended_at')
    .order('created_at', { ascending: false });

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('organization_id, plan, status');

  const subscriptionByOrg = new Map(
    (subscriptions ?? []).map((sub) => [sub.organization_id, sub]),
  );

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: spacing.xl }}>
      <p style={{ marginTop: 0 }}>
        <Link href="/dashboard">← Wróć do panelu</Link>
      </p>

      <PageHeader
        title="Panel administratora"
        description="Zarządzanie ośrodkami, subskrypcjami i płatnościami za usługę."
        actions={
          <Link href="/admin/organizations/new" className="es-btn es-btn--primary" style={primaryLinkStyle}>
            <PlusIcon width={16} height={16} /> Nowy ośrodek
          </Link>
        }
      />

      <p
        style={{
          marginTop: `-${spacing.md}px`,
          marginBottom: spacing.lg,
          color: colors.textMuted,
          fontSize: typography.fontSize.sm,
        }}
      >
        Zalogowana jako {session.profile.firstName} {session.profile.lastName} · operator platformy
      </p>

      <SuccessMessage message={params.success} />
      <ErrorMessage message={params.error} />

      <Card style={{ marginTop: spacing.md }}>
        <SectionTitle>Wszystkie ośrodki ({organizations?.length ?? 0})</SectionTitle>
        {organizations && organizations.length > 0 ? (
          <div style={{ display: 'grid', gap: spacing.sm }}>
            {organizations.map((organization) => {
              const lifecycle = organizationLifecycle(organization);
              const subscription = subscriptionByOrg.get(organization.id);
              return (
                <Link
                  key={organization.id}
                  href={`/admin/organizations/${organization.id}`}
                  className="es-card-link"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: spacing.md,
                      padding: `${spacing.md}px`,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radii.md,
                      background: colors.surface,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <strong>{organization.name}</strong>
                      <p
                        style={{
                          margin: `2px 0 0`,
                          color: colors.textMuted,
                          fontSize: typography.fontSize.xs,
                        }}
                      >
                        {organization.timezone} · utworzono{' '}
                        {new Date(organization.created_at).toLocaleDateString('pl-PL')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      {subscription ? (
                        <Badge
                          tone={subscriptionStatusTone(subscription.status)}
                        >
                          {SUBSCRIPTION_STATUS_LABELS[
                            subscription.status as SubscriptionStatusKey
                          ] ?? subscription.status}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Brak subskrypcji</Badge>
                      )}
                      <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
                      <ArrowRightIcon width={16} height={16} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState>Nie utworzono jeszcze żadnych ośrodków.</EmptyState>
        )}
      </Card>
    </div>
  );
}

const primaryLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing.xs,
  padding: `10px ${spacing.md}px`,
  borderRadius: radii.md,
  border: '1px solid transparent',
  background: colors.primary,
  color: colors.primaryContrast,
  fontSize: typography.fontSize.sm,
  fontWeight: 600,
  textDecoration: 'none',
} as const;
