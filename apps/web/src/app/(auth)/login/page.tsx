import Link from 'next/link';

import { LoginForm } from '@/components/login-form';
import { Card, SuccessMessage } from '@/components/ui';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <LoginForm initialError={params.error} />
      <SuccessMessage message={params.success} />
      <p style={{ marginTop: 16 }}>
        <Link href="/forgot-password">Zapomniałeś hasła?</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        Nie masz konta? <Link href="/register">Zarejestruj się</Link>
      </p>
    </Card>
  );
}
