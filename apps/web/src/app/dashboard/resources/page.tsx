import { requireManagerSession } from '@/lib/auth/session';
import { archiveResource, createResource } from '@/lib/dashboard/actions';
import { createClient } from '@/lib/supabase/server';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  RESOURCE_TYPE_LABELS,
  Select,
  SuccessMessage,
} from '@/components/ui';

export default async function ResourcesPage({
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
  const { data: resources } = await supabase
    .from('facility_resources')
    .select('id, name, type, parallel_capacity')
    .eq('organization_id', organizationId)
    .is('archived_at', null)
    .order('name');

  return (
    <div>
      <PageHeader
        title="Zasoby"
        description="Hale, ujeżdżalnie i inne zasoby z limitami równoległych zajęć."
      />

      <Card style={{ marginBottom: 24 }}>
        <form action={createResource} style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
          <Field label="Nazwa">
            <Input name="name" required placeholder="Hala" />
          </Field>
          <Field label="Typ">
            <Select name="type" defaultValue="indoor">
              {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Maks. równoległych zajęć">
            <Input name="parallelCapacity" type="number" min={1} defaultValue={1} required />
          </Field>
          <SuccessMessage message={params.success} />
          <ErrorMessage message={params.error} />
          <Button type="submit">Dodaj zasób</Button>
        </form>
      </Card>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Nazwa</th>
              <th align="left">Typ</th>
              <th align="left">Pojemność</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {resources?.map((resource) => (
              <tr key={resource.id}>
                <td>{resource.name}</td>
                <td>{RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS]}</td>
                <td>{resource.parallel_capacity}</td>
                <td>
                  <form action={archiveResource.bind(null, resource.id)}>
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
