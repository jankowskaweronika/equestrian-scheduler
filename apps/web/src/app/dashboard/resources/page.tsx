import Link from 'next/link';

import { requireManagerSession } from '@/lib/auth/session';
import {
  archiveFacilityEvent,
  archiveResource,
  createFacilityEvent,
  createResource,
  updateResource,
} from '@/lib/dashboard/actions';
import { createClient } from '@/lib/supabase/server';
import { colors, spacing } from '@equestrian-scheduler/ui-tokens';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  FACILITY_EVENT_KIND_LABELS,
  Field,
  Input,
  PageHeader,
  RESOURCE_TYPE_LABELS,
  SectionTitle,
  Select,
  SuccessMessage,
  Table,
  Textarea,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';

function toDatetimeLocalValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatEventRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateFmt = new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; edit?: string }>;
}) {
  const session = await requireManagerSession();
  const params = await searchParams;
  const organizationId =
    session.membership?.organizationId ?? session.profile.activeOrganizationId;

  if (!organizationId) {
    return <p>Brak aktywnego ośrodka.</p>;
  }

  const supabase = await createClient();
  const [{ data: resources }, { data: events }] = await Promise.all([
    supabase
      .from('facility_resources')
      .select('id, name, type, parallel_capacity')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('name'),
    supabase
      .from('facility_events')
      .select('id, kind, title, description, starts_at, ends_at, blocks_scheduling, resource_id')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .gte('ends_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('starts_at', { ascending: true }),
  ]);

  const resourceList = resources ?? [];
  const resourceNameById = new Map(resourceList.map((resource) => [resource.id, resource.name]));
  const editing = resourceList.find((resource) => resource.id === params.edit) ?? null;

  const publicEvents = (events ?? []).filter((event) => event.kind === 'public_event');
  const maintenanceEvents = (events ?? []).filter((event) => event.kind === 'maintenance');

  const defaultStart = toDatetimeLocalValue();
  const defaultEnd = toDatetimeLocalValue(new Date(Date.now() + 2 * 60 * 60 * 1000));

  return (
    <div>
      <PageHeader
        title="Obiekty"
        description="Hale, ujeżdżalnie i place do jazdy — pojemność, wydarzenia oraz prace techniczne."
      />

      <SuccessMessage message={params.success} />
      <ErrorMessage message={params.error} />

      <Card style={{ marginBottom: spacing.lg, marginTop: params.success || params.error ? spacing.md : 0 }}>
        <SectionTitle>{editing ? 'Edytuj obiekt' : 'Dodaj obiekt'}</SectionTitle>
        <form
          action={editing ? updateResource.bind(null, editing.id) : createResource}
          style={{ display: 'grid', gap: spacing.md, maxWidth: 520 }}
        >
          <Field label="Nazwa">
            <Input
              name="name"
              required
              placeholder="Hala 1"
              defaultValue={editing?.name ?? ''}
              key={editing?.id ?? 'new'}
            />
          </Field>
          <Field label="Typ">
            <Select name="type" defaultValue={editing?.type ?? 'indoor'} key={`type-${editing?.id ?? 'new'}`}>
              {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Maks. równoległych zajęć">
            <Input
              name="parallelCapacity"
              type="number"
              min={1}
              required
              defaultValue={editing?.parallel_capacity ?? 1}
              key={`cap-${editing?.id ?? 'new'}`}
            />
          </Field>
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button type="submit" style={{ justifySelf: 'start' }}>
              {editing ? (
                'Zapisz zmiany'
              ) : (
                <>
                  <PlusIcon width={16} height={16} /> Dodaj obiekt
                </>
              )}
            </Button>
            {editing ? (
              <Link href="/dashboard/resources" className="es-btn es-btn--secondary">
                Anuluj edycję
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <SectionTitle>Lista obiektów</SectionTitle>
        {resourceList.length > 0 ? (
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
              {resourceList.map((resource) => (
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
                    <div
                      style={{
                        display: 'inline-flex',
                        gap: spacing.sm,
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Link
                        href={`/dashboard/resources?edit=${resource.id}`}
                        className="es-btn es-btn--secondary"
                      >
                        Edytuj
                      </Link>
                      <form action={archiveResource.bind(null, resource.id)}>
                        <Button type="submit" variant="secondary">
                          Archiwizuj
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>Nie dodano jeszcze żadnych obiektów.</EmptyState>
        )}
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <SectionTitle>Wydarzenia na obiektach</SectionTitle>
        <p style={{ marginTop: 0, color: colors.textMuted, maxWidth: 640 }}>
          Zawody, czempionaty, pokazy i inne wydarzenia widoczne dla członków ośrodka (w tym
          pensjonariuszy).
        </p>
        <form
          action={createFacilityEvent}
          style={{ display: 'grid', gap: spacing.md, maxWidth: 640, marginBottom: spacing.lg }}
        >
          <input type="hidden" name="kind" value="public_event" />
          <Field label="Tytuł">
            <Input name="title" required placeholder="Zawody skokowe — lipiec" />
          </Field>
          <Field label="Opis (opcjonalnie)">
            <Textarea name="description" placeholder="Krótka informacja dla pensjonariuszy i klientów" />
          </Field>
          <Field label="Obiekt (opcjonalnie)">
            <Select name="resourceId" defaultValue="">
              <option value="">Cały ośrodek</option>
              {resourceList.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </Select>
          </Field>
          <div style={{ display: 'grid', gap: spacing.md, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Od">
              <Input name="startsAt" type="datetime-local" required defaultValue={defaultStart} />
            </Field>
            <Field label="Do">
              <Input name="endsAt" type="datetime-local" required defaultValue={defaultEnd} />
            </Field>
          </div>
          <label style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            <input type="checkbox" name="blocksScheduling" />
            <span>Blokuj planowanie lekcji w tym czasie</span>
          </label>
          <Button type="submit" style={{ justifySelf: 'start' }}>
            <PlusIcon width={16} height={16} /> Dodaj wydarzenie
          </Button>
        </form>

        {publicEvents.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <th>Wydarzenie</th>
                <th>Obiekt</th>
                <th>Termin</th>
                <th>Lekcje</th>
                <th aria-label="Akcje" />
              </tr>
            </thead>
            <tbody>
              {publicEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <strong>{event.title}</strong>
                    {event.description ? (
                      <div style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>
                        {event.description}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {event.resource_id
                      ? (resourceNameById.get(event.resource_id) ?? 'Obiekt')
                      : 'Cały ośrodek'}
                  </td>
                  <td>{formatEventRange(event.starts_at, event.ends_at)}</td>
                  <td>
                    <Badge tone={event.blocks_scheduling ? 'warning' : 'neutral'}>
                      {event.blocks_scheduling ? 'Zablokowane' : 'Dozwolone'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <form action={archiveFacilityEvent.bind(null, event.id)}>
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
          <EmptyState>Brak zaplanowanych wydarzeń.</EmptyState>
        )}
      </Card>

      <Card>
        <SectionTitle>Prace techniczne</SectionTitle>
        <p style={{ marginTop: 0, color: colors.textMuted, maxWidth: 640 }}>
          Remonty, wyrównanie poidłoża, naprawy hali i inne prace — widoczne dla managera, domyślnie
          blokują planowanie lekcji.
        </p>
        <form
          action={createFacilityEvent}
          style={{ display: 'grid', gap: spacing.md, maxWidth: 640, marginBottom: spacing.lg }}
        >
          <input type="hidden" name="kind" value="maintenance" />
          <Field label="Tytuł">
            <Input name="title" required placeholder="Wyrównanie poidłoża — ujeżdżalnia" />
          </Field>
          <Field label="Opis (opcjonalnie)">
            <Textarea name="description" placeholder="Szczegóły dla zespołu zarządzającego" />
          </Field>
          <Field label="Obiekt (opcjonalnie)">
            <Select name="resourceId" defaultValue="">
              <option value="">Cały ośrodek</option>
              {resourceList.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </Select>
          </Field>
          <div style={{ display: 'grid', gap: spacing.md, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Od">
              <Input name="startsAt" type="datetime-local" required defaultValue={defaultStart} />
            </Field>
            <Field label="Do">
              <Input name="endsAt" type="datetime-local" required defaultValue={defaultEnd} />
            </Field>
          </div>
          <Button type="submit" style={{ justifySelf: 'start' }}>
            <PlusIcon width={16} height={16} /> Dodaj pracę techniczną
          </Button>
        </form>

        {maintenanceEvents.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <th>Praca</th>
                <th>Obiekt</th>
                <th>Termin</th>
                <th>Typ</th>
                <th aria-label="Akcje" />
              </tr>
            </thead>
            <tbody>
              {maintenanceEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <strong>{event.title}</strong>
                    {event.description ? (
                      <div style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>
                        {event.description}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {event.resource_id
                      ? (resourceNameById.get(event.resource_id) ?? 'Obiekt')
                      : 'Cały ośrodek'}
                  </td>
                  <td>{formatEventRange(event.starts_at, event.ends_at)}</td>
                  <td>
                    <Badge tone="warning">{FACILITY_EVENT_KIND_LABELS.maintenance}</Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <form action={archiveFacilityEvent.bind(null, event.id)}>
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
          <EmptyState>Brak zaplanowanych prac technicznych.</EmptyState>
        )}
      </Card>
    </div>
  );
}
