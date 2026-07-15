'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, ErrorMessage, Field, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      setError('Podaj email i hasło.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Nieprawidłowy email lub hasło.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" disabled={loading} />
      </Field>
      <Field label="Hasło">
        <Input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={loading}
        />
      </Field>
      <ErrorMessage message={error} />
      <Button type="submit" disabled={loading}>
        {loading ? 'Logowanie…' : 'Zaloguj się'}
      </Button>
    </form>
  );
}
