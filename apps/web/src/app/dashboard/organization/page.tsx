import { requireManagerSession } from '@/lib/auth/session';
import { updateOrganization } from '@/lib/dashboard/actions';
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

export default async function OrganizationPage({
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
  const { data: organization } = await supabase
    .from('organizations')
    .select('name, timezone, calendar_opens_at, calendar_closes_at, logo_url')
    .eq('id', organizationId)
    .single();

  if (!organization) {
    return <p>Nie znaleziono ośrodka.</p>;
  }

  return (
    <div>
      <PageHeader title="Ustawienia ośrodka" description="Nazwa, godziny kalendarza i logo." />
      <Card>
        <form action={updateOrganization} style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
          <Field label="Nazwa ośrodka">
            <Input name="name" defaultValue={organization.name} required />
          </Field>
          <Field label="Strefa czasowa">
            <Input name="timezone" defaultValue={organization.timezone} required />
          </Field>
          <Field label="Kalendarz od">
            <Input
              name="calendarOpensAt"
              type="time"
              defaultValue={organization.calendar_opens_at.slice(0, 5)}
              required
            />
          </Field>
          <Field label="Kalendarz do">
            <Input
              name="calendarClosesAt"
              type="time"
              defaultValue={organization.calendar_closes_at.slice(0, 5)}
              required
            />
          </Field>
          <Field label="URL logo (opcjonalnie)">
            <Input name="logoUrl" type="url" defaultValue={organization.logo_url ?? ''} />
          </Field>
          <SuccessMessage message={params.success} />
          <ErrorMessage message={params.error} />
          <Button type="submit">Zapisz</Button>
        </form>
      </Card>
    </div>
  );
}
