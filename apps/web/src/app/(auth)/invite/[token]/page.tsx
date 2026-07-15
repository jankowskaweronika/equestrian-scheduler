import Link from 'next/link';

import { acceptInvite } from '@/lib/auth/actions';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Input,
  ROLE_LABELS,
} from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: inviteRows } = await supabase.rpc('get_invite_preview', {
    invite_token: token,
  });

  const invite = inviteRows?.[0] as
    | {
        email: string;
        role: keyof typeof ROLE_LABELS;
        organization_name: string;
      }
    | undefined;

  if (!invite) {
    return (
      <Card>
        <p>To zaproszenie jest nieprawidłowe lub wygasło.</p>
        <Link href="/login">Przejdź do logowania</Link>
      </Card>
    );
  }

  const boundAcceptInvite = acceptInvite.bind(null, token);

  return (
    <Card>
      <p>
        Zaproszenie do <strong>{invite.organization_name}</strong> jako{' '}
        <strong>{ROLE_LABELS[invite.role]}</strong>
      </p>
      <form action={boundAcceptInvite} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        <Field label="Email">
          <Input value={invite.email} readOnly />
        </Field>
        <Field label="Imię">
          <Input name="firstName" required />
        </Field>
        <Field label="Nazwisko">
          <Input name="lastName" required />
        </Field>
        <Field label="Telefon">
          <Input name="phone" type="tel" required />
        </Field>
        <Field label="Hasło">
          <Input name="password" type="password" required minLength={8} />
        </Field>
        <ErrorMessage message={query.error} />
        <Button type="submit">Aktywuj konto</Button>
      </form>
    </Card>
  );
}
