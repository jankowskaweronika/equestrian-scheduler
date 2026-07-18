import { requireManagerSession } from '@/lib/auth/session';
import { archiveResource, createResource } from '@/lib/dashboard/actions';
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
  RESOURCE_TYPE_LABELS,
  SectionTitle,
  Select,
  SuccessMessage,
  Table,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';

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

      <Card style={{ marginBottom: spacing.lg }}>
        <SectionTitle>Dodaj zasób</SectionTitle>
        <form action={createResource} style={{ display: 'grid', gap: spacing.md, maxWidth: 520 }}>
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
          <Button type="submit" style={{ justifySelf: 'start' }}>
            <PlusIcon width={16} height={16} /> Dodaj zasób
          </Button>
        </form>
      </Card>

      <Card>
        <SectionTitle>Lista zasobów</SectionTitle>
        {resources && resources.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Typ</th>
                <th>Pojemność</th>
                <th aria-label="Akcje" />
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <strong>{resource.name}</strong>
                  </td>
                  <td>
                    <Badge>
                      {RESOURCE_TYPE_LABELS[resource.type as keyof typeof RESOURCE_TYPE_LABELS]}
                    </Badge>
                  </td>
                  <td>{resource.parallel_capacity}</td>
                  <td style={{ textAlign: 'right' }}>
                    <form action={archiveResource.bind(null, resource.id)}>
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
          <EmptyState>Nie dodano jeszcze żadnych zasobów.</EmptyState>
        )}
      </Card>
    </div>
  );
}
