'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { sendPasswordResetEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = {
  error?: string;
  success?: string;
};

export async function signUp(formData: FormData): Promise<void> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!firstName || !lastName || !email || !phone || password.length < 8) {
    redirect(
      '/register?error=' +
        encodeURIComponent('Uzupełnij wszystkie pola. Hasło min. 8 znaków.'),
    );
  }

  if (phone.replace(/\D/g, '').length < 9) {
    redirect('/register?error=' + encodeURIComponent('Podaj prawidłowy numer telefonu.'));
  }

  const admin = createAdminClient();

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      phone,
    },
  });

  if (createError) {
    if (createError.message?.includes('already been registered')) {
      redirect(
        '/register?error=' +
          encodeURIComponent('Konto z tym adresem email już istnieje. Zaloguj się.'),
      );
    }
    redirect('/register?error=' + encodeURIComponent('Nie udało się utworzyć konta.'));
  }

  redirect(
    '/login?success=' +
      encodeURIComponent('Konto utworzone. Możesz się teraz zalogować.'),
  );
}

export async function signIn(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/login?error=' + encodeURIComponent('Podaj email i hasło.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/login?error=' + encodeURIComponent('Nieprawidłowy email lub hasło.'));
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!email) {
    redirect('/forgot-password?error=' + encodeURIComponent('Podaj adres email.'));
  }

  // Always show the same success copy so we do not leak whether an account exists.
  const successBase = 'Jeśli konto istnieje, wysłaliśmy link do resetu hasła.';

  // Build a custom recovery URL with the hashed token and send it via Resend
  // (same pattern as invites). /auth/callback verifies the token and opens a
  // recovery session before redirecting to /reset-password.
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
  });

  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    redirect('/forgot-password?success=' + encodeURIComponent(successBase));
  }

  const resetUrl = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=recovery&next=${encodeURIComponent('/reset-password')}`;
  const emailResult = await sendPasswordResetEmail({ to: email, resetUrl });

  if (emailResult.ok) {
    redirect('/forgot-password?success=' + encodeURIComponent(successBase));
  }

  // Resend can fail for unverified recipient domains (e.g. demo @example.com).
  // Surface the link so local/dev testing still works.
  redirect(
    '/forgot-password?success=' +
      encodeURIComponent(
        `${successBase} Nie udało się wysłać e-maila — użyj linku: ${resetUrl}`,
      ),
  );
}

export async function updatePassword(formData: FormData): Promise<void> {
  const password = String(formData.get('password') ?? '');

  if (password.length < 8) {
    redirect('/reset-password?error=' + encodeURIComponent('Hasło musi mieć co najmniej 8 znaków.'));
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      '/reset-password?error=' +
        encodeURIComponent('Sesja resetu wygasła. Poproś o nowy link do resetu hasła.'),
    );
  }

  // Prefer the authenticated updateUser call. If the recovery session is rejected
  // by the hosted Auth API (common with custom recovery links), fall back to the
  // admin API for the already-verified user id.
  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    console.error('[auth] updateUser failed:', updateError.message, updateError);

    const admin = createAdminClient();
    const { error: adminError } = await admin.auth.admin.updateUserById(user.id, {
      password,
    });

    if (adminError) {
      console.error('[auth] admin.updateUserById failed:', adminError.message, adminError);
      const message = mapPasswordUpdateError(updateError.message || adminError.message);
      redirect('/reset-password?error=' + encodeURIComponent(message));
    }
  }

  // Refresh the browser session cookies after a successful password change.
  await supabase.auth.signOut();
  redirect(
    '/login?success=' +
      encodeURIComponent('Hasło zostało zmienione. Zaloguj się nowym hasłem.'),
  );
}

function mapPasswordUpdateError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('different') || lower.includes('same')) {
    return 'Nowe hasło musi być inne niż poprzednie.';
  }
  if (lower.includes('weak') || lower.includes('strength') || lower.includes('least')) {
    return 'Hasło jest zbyt słabe. Użyj co najmniej 8 znaków.';
  }
  if (lower.includes('session') || lower.includes('jwt') || lower.includes('expired')) {
    return 'Sesja resetu wygasła. Poproś o nowy link do resetu hasła.';
  }
  return `Nie udało się zaktualizować hasła: ${message}`;
}

export async function acceptInvite(token: string, formData: FormData): Promise<void> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!firstName || !lastName || !phone || password.length < 8) {
    redirect(
      `/invite/${token}?error=` +
        encodeURIComponent('Uzupełnij wszystkie pola. Hasło min. 8 znaków.'),
    );
  }

  const admin = createAdminClient();

  const { data: inviteRecord, error: inviteError } = await admin
    .from('invites')
    .select('id, email, role, organization_id')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (inviteError || !inviteRecord) {
    redirect(
      `/invite/${token}?error=` +
        encodeURIComponent('Zaproszenie jest nieprawidłowe lub wygasło.'),
    );
  }

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email: inviteRecord.email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      phone,
    },
  });

  if (createError || !createdUser.user) {
    if (createError?.message?.includes('already been registered')) {
      redirect(
        `/invite/${token}?error=` +
          encodeURIComponent('Konto z tym adresem email już istnieje. Zaloguj się.'),
      );
    }
    redirect(`/invite/${token}?error=` + encodeURIComponent('Nie udało się utworzyć konta.'));
  }

  const userId = createdUser.user.id;

  await admin
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
    })
    .eq('id', userId);

  const { data: membership, error: membershipError } = await admin
    .from('memberships')
    .insert({
      organization_id: inviteRecord.organization_id,
      user_id: userId,
      role: inviteRecord.role,
    })
    .select('organization_id')
    .single();

  if (membershipError || !membership) {
    redirect(
      `/invite/${token}?error=` +
        encodeURIComponent('Konto utworzone, ale nie udało się przypisać do ośrodka.'),
    );
  }

  await admin
    .from('invites')
    .update({
      status: 'accepted',
      accepted_by: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', inviteRecord.id);

  await admin
    .from('profiles')
    .update({ active_organization_id: membership.organization_id })
    .eq('id', userId);

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: inviteRecord.email, password });

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
