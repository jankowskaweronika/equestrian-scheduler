import Link from 'next/link';

import { requireProductAdminSession } from '@/lib/auth/session';
import { createOrganization } from '@/lib/dashboard/actions';
import { colors, spacing, typography } from '@equestrian-scheduler/ui-tokens';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  SectionTitle,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';

export default async function NewOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireProductAdminSession();
  const params = await searchParams;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: spacing.xl }}>
      <p style={{ marginTop: 0 }}>
        <Link href="/admin/organizations">← Wróć do listy ośrodków</Link>
      </p>

      <PageHeader
        title="Nowy ośrodek"
        description="Utwórz ośrodek i zaproś jego managera (właściciela) przez e-mail."
      />

      <ErrorMessage message={params.error} />

      <Card style={{ marginTop: spacing.md }}>
        <SectionTitle>Dane ośrodka</SectionTitle>
        <form action={createOrganization} style={{ display: 'grid', gap: spacing.md }}>
          <Field label="Nazwa ośrodka">
            <Input name="name" required />
          </Field>
          <Field label="Email managera (właściciela)">
            <Input name="managerEmail" type="email" placeholder="wlasciciel@przyklad.pl" />
          </Field>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: typography.fontSize.xs }}>
            Podanie e-maila utworzy zaproszenie dla managera. Ty (admin) nie zostajesz managerem
            ośrodka.
          </p>
          <Field label="Strefa czasowa">
            <Input name="timezone" defaultValue="Europe/Warsaw" required />
          </Field>
          <div style={{ display: 'grid', gap: spacing.md, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Kalendarz od">
              <Input name="calendarOpensAt" type="time" defaultValue="07:00" required />
            </Field>
            <Field label="Kalendarz do">
              <Input name="calendarClosesAt" type="time" defaultValue="22:00" required />
            </Field>
          </div>
          <Button type="submit" style={{ justifySelf: 'start' }}>
            <PlusIcon width={16} height={16} /> Utwórz ośrodek
          </Button>
        </form>
      </Card>
    </div>
  );
}
