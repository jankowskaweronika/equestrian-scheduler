import Link from 'next/link';

import { updatePassword } from '@/lib/auth/actions';
import { Button, Card, ErrorMessage, Field, Input } from '@/components/ui';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <form action={updatePassword} style={{ display: 'grid', gap: 16 }}>
        <Field label="Nowe hasło">
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <ErrorMessage message={params.error} />
        <Button type="submit">Ustaw nowe hasło</Button>
      </form>
      <p style={{ marginTop: 16 }}>
        <Link href="/login">Wróć do logowania</Link>
      </p>
    </Card>
  );
}
