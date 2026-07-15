import Link from 'next/link';

import { requireManagerSession } from '@/lib/auth/session';
import { Card, PageHeader } from '@/components/ui';

export default async function DashboardPage() {
  const session = await requireManagerSession();

  return (
    <div>
      <PageHeader
        title="Przegląd"
        description="Zarządzaj ośrodkiem, zasobami, końmi i zespołem przed uruchomieniem kalendarza."
      />

      {!session.membership ? (
        <Card>
          <p>Nie masz jeszcze przypisanego ośrodka.</p>
          {session.profile.isProductAdmin ? (
            <p>
              <Link href="/admin/organizations">Utwórz pierwszy ośrodek</Link>
            </p>
          ) : null}
        </Card>
      ) : (
        <div
          style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          <Card>
            <h2 style={{ marginTop: 0 }}>Ośrodek</h2>
            <p>{session.membership.organizationName}</p>
            <Link href="/dashboard/organization">Ustawienia</Link>
          </Card>
          <Card>
            <h2 style={{ marginTop: 0 }}>Zasoby</h2>
            <p>Hale i ujeżdżalnie</p>
            <Link href="/dashboard/resources">Zarządzaj</Link>
          </Card>
          <Card>
            <h2 style={{ marginTop: 0 }}>Konie</h2>
            <p>Konie szkoły i limity jazd</p>
            <Link href="/dashboard/horses">Zarządzaj</Link>
          </Card>
          <Card>
            <h2 style={{ marginTop: 0 }}>Zespół</h2>
            <p>Członkowie i zaproszenia</p>
            <Link href="/dashboard/team">Zarządzaj</Link>
          </Card>
        </div>
      )}
    </div>
  );
}
