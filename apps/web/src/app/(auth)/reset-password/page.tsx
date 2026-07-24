import Link from 'next/link';

import { updatePassword } from '@/lib/auth/actions';
import { getSession } from '@/lib/auth/session';
import { Button, Card, ErrorMessage, Field, Input, SuccessMessage } from '@/components/ui';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  if (!session) {
    return (
      <Card>
        <p style={{ marginTop: 0 }}>
          Link do resetu hasła jest nieprawidłowy, wygasł albo nie został jeszcze otwarty.
          Poproś o nowy link na stronie odzyskiwania hasła.
        </p>
        <ErrorMessage message={params.error} />
        <p style={{ marginBottom: 0 }}>
          <Link href="/forgot-password">Wyślij nowy link resetujący</Link>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form action={updatePassword} style={{ display: 'grid', gap: 16 }}>
        <Field label="Nowe hasło">
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <ErrorMessage message={params.error} />
        <SuccessMessage message={params.success} />
        <Button type="submit">Ustaw nowe hasło</Button>
      </form>
      <p style={{ marginTop: 16 }}>
        <Link href="/login">Wróć do logowania</Link>
      </p>
    </Card>
  );
}
