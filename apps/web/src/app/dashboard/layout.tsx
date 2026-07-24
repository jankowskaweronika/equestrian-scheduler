import { signOut } from '@/lib/auth/actions';
import { requireManagerSession } from '@/lib/auth/session';
import { colors, radii, spacing, typography } from '@equestrian-scheduler/ui-tokens';
import { Button } from '@/components/ui';
import { NavLink } from '@/components/nav-link';
import {
  BuildingIcon,
  CalendarIcon,
  HorseIcon,
  OverviewIcon,
  PlusIcon,
  ResourcesIcon,
  TeamIcon,
} from '@/components/icons';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Przegląd', icon: <OverviewIcon />, exact: true },
  { href: '/dashboard/calendar', label: 'Kalendarz', icon: <CalendarIcon /> },
  { href: '/dashboard/organization', label: 'Ośrodek', icon: <BuildingIcon /> },
  { href: '/dashboard/resources', label: 'Obiekty', icon: <ResourcesIcon /> },
  { href: '/dashboard/horses', label: 'Konie', icon: <HorseIcon /> },
  { href: '/dashboard/team', label: 'Zespół', icon: <TeamIcon /> },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireManagerSession();
  const initials =
    `${session.profile.firstName?.[0] ?? ''}${session.profile.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div
      className="es-dashboard-shell"
      style={{ display: 'grid', gridTemplateColumns: '264px 1fr', minHeight: '100vh' }}
    >
      <aside
        className="es-dashboard-sidebar"
        style={{
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          padding: spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: radii.md,
              background: colors.primary,
              color: colors.primaryContrast,
              fontWeight: 700,
              fontSize: typography.fontSize.md,
            }}
          >
            ES
          </span>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: colors.textMuted,
            }}
          >
            Equestrian
            <br />
            Scheduler
          </span>
        </div>

        <div
          style={{
            padding: `${spacing.sm}px ${spacing.md}px`,
            background: colors.surfaceMuted,
            borderRadius: radii.md,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: typography.fontSize.xs,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Ośrodek
          </p>
          <strong style={{ display: 'block', marginTop: 2 }}>
            {session.membership?.organizationName ?? 'Panel admina'}
          </strong>
        </div>

        <nav style={{ display: 'grid', gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
            />
          ))}
          {session.profile.isProductAdmin ? (
            <NavLink href="/admin/organizations" label="Ośrodki (admin)" icon={<PlusIcon />} />
          ) : null}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.border}`,
            display: 'grid',
            gap: spacing.md,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 34,
                height: 34,
                borderRadius: radii.full,
                background: colors.primarySoft,
                color: colors.primaryHover,
                fontWeight: 700,
                fontSize: typography.fontSize.sm,
                flexShrink: 0,
              }}
            >
              {initials || '?'}
            </span>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.sm,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.profile.firstName} {session.profile.lastName}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.xs,
                  color: colors.textMuted,
                }}
              >
                Zalogowano
              </p>
            </div>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="secondary" style={{ width: '100%' }}>
              Wyloguj
            </Button>
          </form>
        </div>
      </aside>

      <main
        style={{
          padding: spacing.xl,
          background: colors.background,
          maxWidth: 1120,
          width: '100%',
        }}
      >
        {children}
      </main>
    </div>
  );
}
