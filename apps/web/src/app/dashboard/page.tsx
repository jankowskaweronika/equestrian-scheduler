import Link from 'next/link';

import { requireManagerSession } from '@/lib/auth/session';
import { Card, PageHeader } from '@/components/ui';
import {
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  HorseIcon,
  ResourcesIcon,
  TeamIcon,
} from '@/components/icons';
import { colors, radii, spacing, typography } from '@equestrian-scheduler/ui-tokens';

const SECTIONS = [
  {
    href: '/dashboard/calendar',
    title: 'Kalendarz',
    description: 'Lekcje na obiektach: instruktorzy, konie i status.',
    icon: <CalendarIcon width={22} height={22} />,
  },
  {
    href: '/dashboard/organization',
    title: 'Ośrodek',
    description: 'Nazwa, godziny kalendarza i logo.',
    icon: <BuildingIcon width={22} height={22} />,
  },
  {
    href: '/dashboard/resources',
    title: 'Obiekty',
    description: 'Hale, ujeżdżalnie, wydarzenia i prace techniczne.',
    icon: <ResourcesIcon width={22} height={22} />,
  },
  {
    href: '/dashboard/horses',
    title: 'Konie',
    description: 'Konie szkoły i dzienne limity jazd.',
    icon: <HorseIcon width={22} height={22} />,
  },
  {
    href: '/dashboard/team',
    title: 'Zespół',
    description: 'Członkowie ośrodka i zaproszenia.',
    icon: <TeamIcon width={22} height={22} />,
  },
];

export default async function DashboardPage() {
  const session = await requireManagerSession();

  return (
    <div>
      <PageHeader
        title="Przegląd"
        description="Zarządzaj kalendarzem, ośrodkiem, obiektami, końmi i zespołem."
      />

      {!session.membership ? (
        <Card>
          <p style={{ marginTop: 0 }}>Nie masz jeszcze przypisanego ośrodka.</p>
          {session.profile.isProductAdmin ? (
            <p style={{ marginBottom: 0 }}>
              <Link href="/admin/organizations">Przejdź do panelu ośrodków (admin) →</Link>
            </p>
          ) : null}
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: spacing.md,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {SECTIONS.map((section) => (
            <Link key={section.href} href={section.href} className="es-card-link">
              <Card style={{ height: '100%', display: 'grid', gap: spacing.md }}>
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: radii.md,
                    background: colors.primarySoft,
                    color: colors.primary,
                  }}
                >
                  {section.icon}
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: typography.fontSize.lg }}>{section.title}</h2>
                  <p
                    style={{
                      margin: `${spacing.xs}px 0 0`,
                      color: colors.textMuted,
                      fontSize: typography.fontSize.sm,
                    }}
                  >
                    {section.description}
                  </p>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    color: colors.primary,
                    fontSize: typography.fontSize.sm,
                    fontWeight: 600,
                  }}
                >
                  Zarządzaj <ArrowRightIcon width={16} height={16} />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
