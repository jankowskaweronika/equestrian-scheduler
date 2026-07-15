import { requireManagerSession } from '@/lib/auth/session';
import { archiveHorse, createHorse } from '@/lib/dashboard/actions';
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

      <Card style={{ marginBottom: 24 }}>
        <form action={createHorse} style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
          <Field label="Imię konia">
            <Input name="name" required />
          </Field>
          <Field label="Dzienny limit jazd">
            <Input name="dailyRideLimit" type="number" min={1} defaultValue={4} required />
          </Field>
          <SuccessMessage message={params.success} />
          <ErrorMessage message={params.error} />
          <Button type="submit">Dodaj konia</Button>
        </form>
      </Card>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Imię</th>
              <th align="left">Limit jazd / dzień</th>
              <th align="left">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {horses?.map((horse) => (
              <tr key={horse.id}>
                <td>{horse.name}</td>
                <td>{horse.daily_ride_limit}</td>
                <td>{horse.is_active ? 'Aktywny' : 'Nieaktywny'}</td>
                <td>
                  <form action={archiveHorse.bind(null, horse.id)}>
                    <Button type="submit" variant="secondary">
                      Archiwizuj
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
