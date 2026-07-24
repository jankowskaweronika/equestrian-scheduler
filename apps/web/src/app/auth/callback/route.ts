import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  'recovery',
  'signup',
  'invite',
  'magiclink',
  'email',
]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const typeParam = searchParams.get('type');
  const nextParam = searchParams.get('next') ?? '/dashboard';
  const next = nextParam.startsWith('/') ? nextParam : '/dashboard';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Brak konfiguracji logowania.')}`,
    );
  }

  // Build the redirect response first, then attach auth cookies to THAT response.
  // Using cookies() from next/headers alone can drop the session on redirect.
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let authError: string | null = null;

  if (tokenHash && typeParam && ALLOWED_OTP_TYPES.has(typeParam as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) {
      authError = error.message;
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      authError = error.message;
    }
  } else {
    authError = 'missing token';
  }

  if (authError) {
    console.error('[auth/callback] failed:', authError);
    const failedTarget =
      next === '/reset-password'
        ? `/reset-password?error=${encodeURIComponent('Link do resetu hasła jest nieprawidłowy lub wygasł.')}`
        : `/login?error=${encodeURIComponent('Logowanie nie powiodło się.')}`;
    return NextResponse.redirect(`${origin}${failedTarget}`);
  }

  return response;
}
