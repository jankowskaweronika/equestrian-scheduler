import { requireManagerSession } from '@/lib/auth/session';
import { updateOrganization } from '@/lib/dashboard/actions';
import { createClient } from '@/lib/supabase/server';
import { spacing } from '@equestrian-scheduler/ui-tokens';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  SectionTitle,
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
    .select(
      'name, timezone, calendar_opens_at, calendar_closes_at, logo_url, address, website, facebook_url, instagram_url, contact_email, contact_phone',
    )
    .eq('id', organizationId)
    .single();

  if (!organization) {
    return <p>Nie znaleziono ośrodka.</p>;
  }

  return (
    <div>
      <PageHeader title="Ustawienia ośrodka" description="Nazwa, godziny kalendarza i logo." />
      <Card style={{ maxWidth: 620 }}>
        <SectionTitle>Dane ośrodka</SectionTitle>
        <form action={updateOrganization} style={{ display: 'grid', gap: spacing.md }}>
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

          <SectionTitle>Profil publiczny</SectionTitle>
          <Field label="Adres">
            <Input
              name="address"
              defaultValue={organization.address ?? ''}
              placeholder="ul. Stajenna 1, 00-000 Miasto"
            />
          </Field>
          <Field label="Strona internetowa">
            <Input
              name="website"
              type="url"
              defaultValue={organization.website ?? ''}
              placeholder="https://..."
            />
          </Field>
          <div style={{ display: 'grid', gap: spacing.md, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Facebook">
              <Input
                name="facebookUrl"
                type="url"
                defaultValue={organization.facebook_url ?? ''}
                placeholder="https://facebook.com/..."
              />
            </Field>
            <Field label="Instagram">
              <Input
                name="instagramUrl"
                type="url"
                defaultValue={organization.instagram_url ?? ''}
                placeholder="https://instagram.com/..."
              />
            </Field>
          </div>
          <div style={{ display: 'grid', gap: spacing.md, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Email kontaktowy">
              <Input
                name="contactEmail"
                type="email"
                defaultValue={organization.contact_email ?? ''}
              />
            </Field>
            <Field label="Telefon kontaktowy">
              <Input name="contactPhone" type="tel" defaultValue={organization.contact_phone ?? ''} />
            </Field>
          </div>

          <SuccessMessage message={params.success} />
          <ErrorMessage message={params.error} />
          <Button type="submit" style={{ justifySelf: 'start' }}>
            Zapisz
          </Button>
        </form>
      </Card>
    </div>
  );
}
