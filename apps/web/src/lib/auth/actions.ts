'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
  const email = String(formData.get('email') ?? '').trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!email) {
    redirect('/forgot-password?error=' + encodeURIComponent('Podaj adres email.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/reset-password`,
  });

  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent('Nie udało się wysłać linku resetującego.'));
  }

  redirect(
    '/forgot-password?success=' +
      encodeURIComponent('Jeśli konto istnieje, wysłaliśmy link do resetu hasła.'),
  );
}

export async function updatePassword(formData: FormData): Promise<void> {
  const password = String(formData.get('password') ?? '');

  if (password.length < 8) {
    redirect('/reset-password?error=' + encodeURIComponent('Hasło musi mieć co najmniej 8 znaków.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect('/reset-password?error=' + encodeURIComponent('Nie udało się zaktualizować hasła.'));
  }

  redirect('/dashboard');
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
