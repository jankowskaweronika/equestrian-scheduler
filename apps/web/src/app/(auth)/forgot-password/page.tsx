import Link from 'next/link';

import { requestPasswordReset } from '@/lib/auth/actions';
import { Button, Card, ErrorMessage, Field, Input, SuccessMessage } from '@/components/ui';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <form action={requestPasswordReset} style={{ display: 'grid', gap: 16 }}>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <ErrorMessage message={params.error} />
        <SuccessMessage message={params.success} />
        <Button type="submit">Wyślij link resetujący</Button>
      </form>
      <p style={{ marginTop: 16 }}>
        <Link href="/login">Wróć do logowania</Link>
      </p>
    </Card>
  );
}
