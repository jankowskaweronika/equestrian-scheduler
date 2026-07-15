import Link from 'next/link';

import { signOut } from '@/lib/auth/actions';
import { requireManagerSession } from '@/lib/auth/session';
import { colors, spacing, typography } from '@equestrian-scheduler/ui-tokens';
import { Button } from '@/components/ui';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Przegląd' },
  { href: '/dashboard/organization', label: 'Ośrodek' },
  { href: '/dashboard/resources', label: 'Zasoby' },
  { href: '/dashboard/horses', label: 'Konie' },
  { href: '/dashboard/team', label: 'Zespół' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireManagerSession();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      <aside
        style={{
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          padding: spacing.lg,
          display: 'grid',
          gap: spacing.lg,
          alignContent: 'start',
        }}
      >
        <div>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: typography.fontSize.sm }}>
            Equestrian Scheduler
          </p>
          <strong>{session.membership?.organizationName ?? 'Panel admina'}</strong>
          <p
            style={{
              margin: `${spacing.xs}px 0 0`,
              color: colors.textMuted,
              fontSize: typography.fontSize.sm,
            }}
          >
            {session.profile.firstName} {session.profile.lastName}
          </p>
        </div>

        <nav style={{ display: 'grid', gap: spacing.sm }}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} style={{ color: colors.text }}>
              {item.label}
            </Link>
          ))}
          {session.profile.isProductAdmin ? (
            <Link href="/admin/organizations" style={{ color: colors.primary }}>
              Nowy ośrodek
            </Link>
          ) : null}
        </nav>

        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Wyloguj
          </Button>
        </form>
      </aside>

      <main style={{ padding: spacing.xl, background: colors.background }}>{children}</main>
    </div>
  );
}
