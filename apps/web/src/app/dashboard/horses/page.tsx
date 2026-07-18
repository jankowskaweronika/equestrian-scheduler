import { requireManagerSession } from '@/lib/auth/session';
import { archiveHorse, createHorse } from '@/lib/dashboard/actions';
import { createClient } from '@/lib/supabase/server';
import { spacing } from '@equestrian-scheduler/ui-tokens';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  SectionTitle,
  SuccessMessage,
  Table,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';

export default async function HorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await requireManagerSession();
  const params = await searchParams;
  const organizationId =
    session.membership?.organizationId ?? session.profile.activeOrganizationId;

  if (!organizationId) {
    return <p>Brak aktywnego ośrodka.</p>;
  }

  const supabase = await createClient();
  const { data: horses } = await supabase
    .from('horses')
    .select('id, name, daily_ride_limit, is_active')
    .eq('organization_id', organizationId)
    .is('archived_at', null)
    .order('name');

  return (
    <div>
      <PageHeader
        title="Konie"
        description="Konie szkoły z dziennym limitem jazd dla wskaźnika obciążenia."
      />

      <Card style={{ marginBottom: spacing.lg }}>
        <SectionTitle>Dodaj konia</SectionTitle>
        <form action={createHorse} style={{ display: 'grid', gap: spacing.md, maxWidth: 520 }}>
          <Field label="Imię konia">
            <Input name="name" required />
          </Field>
          <Field label="Dzienny limit jazd">
            <Input name="dailyRideLimit" type="number" min={1} defaultValue={4} required />
          </Field>
          <SuccessMessage message={params.success} />
          <ErrorMessage message={params.error} />
          <Button type="submit" style={{ justifySelf: 'start' }}>
            <PlusIcon width={16} height={16} /> Dodaj konia
          </Button>
        </form>
      </Card>

      <Card>
        <SectionTitle>Lista koni</SectionTitle>
        {horses && horses.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <th>Imię</th>
                <th>Limit jazd / dzień</th>
                <th>Status</th>
                <th aria-label="Akcje" />
              </tr>
            </thead>
            <tbody>
              {horses.map((horse) => (
                <tr key={horse.id}>
                  <td>
                    <strong>{horse.name}</strong>
                  </td>
                  <td>{horse.daily_ride_limit}</td>
                  <td>
                    <Badge tone={horse.is_active ? 'success' : 'neutral'}>
                      {horse.is_active ? 'Aktywny' : 'Nieaktywny'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <form action={archiveHorse.bind(null, horse.id)}>
                      <Button type="submit" variant="secondary">
                        Archiwizuj
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>Nie dodano jeszcze żadnych koni.</EmptyState>
        )}
      </Card>
    </div>
  );
}
