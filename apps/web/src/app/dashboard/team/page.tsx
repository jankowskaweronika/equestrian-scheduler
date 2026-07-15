import { requireManagerSession } from '@/lib/auth/session';
import { createInvite } from '@/lib/dashboard/actions';
import { createClient } from '@/lib/supabase/server';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Input,
  PageHeader,
  ROLE_LABELS,
  Select,
  SuccessMessage,
} from '@/components/ui';

export default async function TeamPage({
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

  const { data: members } = await supabase
    .from('memberships')
    .select('id, role, profiles(first_name, last_name, email, phone)')
    .eq('organization_id', organizationId)
    .is('archived_at', null);

  const { data: invites } = await supabase
    .from('invites')
    .select('id, email, role, status, expires_at, token')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return (
    <div>
      <PageHeader
        title="Zespół"
        description="Członkowie ośrodka i zaproszenia ważne 7 dni."
      />

      <Card style={{ marginBottom: 24 }}>
        <form action={createInvite} style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Rola">
            <Select name="role" defaultValue="client">
              <option value="manager">Manager</option>
              <option value="instructor">Instruktor</option>
              <option value="client">Klient</option>
              <option value="boarder">Pensjonariusz</option>
            </Select>
          </Field>
          <SuccessMessage message={params.success} />
          <ErrorMessage message={params.error} />
          <Button type="submit">Utwórz zaproszenie</Button>
        </form>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Członkowie</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Imię i nazwisko</th>
              <th align="left">Email</th>
              <th align="left">Telefon</th>
              <th align="left">Rola</th>
            </tr>
          </thead>
          <tbody>
            {members?.map((member) => {
              const profile = (Array.isArray(member.profiles)
                ? member.profiles[0]
                : member.profiles) as {
                first_name: string;
                last_name: string;
                email: string;
                phone: string;
              } | null;

              return (
                <tr key={member.id}>
                  <td>
                    {profile?.first_name} {profile?.last_name}
                  </td>
                  <td>{profile?.email}</td>
                  <td>{profile?.phone}</td>
                  <td>{ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0 }}>Oczekujące zaproszenia</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Email</th>
              <th align="left">Rola</th>
              <th align="left">Wygasa</th>
              <th align="left">Link</th>
            </tr>
          </thead>
          <tbody>
            {invites?.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.email}</td>
                <td>{ROLE_LABELS[invite.role as keyof typeof ROLE_LABELS]}</td>
                <td>{new Date(invite.expires_at).toLocaleString('pl-PL')}</td>
                <td>
                  <a href={`${appUrl}/invite/${invite.token}`}>{`${appUrl}/invite/${invite.token}`}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
