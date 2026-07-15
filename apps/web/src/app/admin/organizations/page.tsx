import Link from 'next/link';

import { requireProductAdminSession } from '@/lib/auth/session';
import { createOrganization } from '@/lib/dashboard/actions';
import { createClient } from '@/lib/supabase/server';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  SuccessMessage,
} from '@/components/ui';

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
    .select('id, name, timezone, created_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <PageHeader
        title="Ośrodki"
        description="Tworzenie nowych ośrodków podczas fazy pilotażu."
      />

      <p>
        Zalogowana jako: {session.profile.firstName} {session.profile.lastName}
      </p>
      <p>
        <Link href="/dashboard">Wróć do panelu</Link>
      </p>

      <Card style={{ marginBottom: 24 }}>
        <form action={createOrganization} style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
          <Field label="Nazwa ośrodka">
            <Input name="name" required />
          </Field>
          <Field label="Strefa czasowa">
            <Input name="timezone" defaultValue="Europe/Warsaw" required />
          </Field>
          <Field label="Kalendarz od">
            <Input name="calendarOpensAt" type="time" defaultValue="07:00" required />
          </Field>
          <Field label="Kalendarz do">
            <Input name="calendarClosesAt" type="time" defaultValue="22:00" required />
          </Field>
          <SuccessMessage message={params.success} />
          <ErrorMessage message={params.error} />
          <Button type="submit">Utwórz ośrodek</Button>
        </form>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0 }}>Istniejące ośrodki</h2>
        <ul>
          {organizations?.map((organization) => (
            <li key={organization.id}>
              {organization.name} ({organization.timezone})
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
