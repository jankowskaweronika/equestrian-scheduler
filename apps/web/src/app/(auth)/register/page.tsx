import Link from 'next/link';

import { signUp } from '@/lib/auth/actions';
import { Button, Card, ErrorMessage, Field, Input } from '@/components/ui';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <form action={signUp} style={{ display: 'grid', gap: 16 }}>
        <Field label="Imię">
          <Input name="firstName" required autoComplete="given-name" />
        </Field>
        <Field label="Nazwisko">
          <Input name="lastName" required autoComplete="family-name" />
        </Field>
        <Field label="Telefon">
          <Input name="phone" type="tel" required autoComplete="tel" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Hasło">
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <ErrorMessage message={params.error} />
        <Button type="submit">Utwórz konto</Button>
      </form>
      <p style={{ marginTop: 16 }}>
        Masz już konto? <Link href="/login">Zaloguj się</Link>
      </p>
    </Card>
  );
}
