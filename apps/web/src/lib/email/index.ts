import type { MembershipRole } from '@equestrian-scheduler/domain';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Equestrian Scheduler <onboarding@resend.dev>';

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

/** True when a Resend API key is configured. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends a transactional email through Resend's REST API.
 * Never throws: failures are logged and returned as a result so callers can
 * degrade gracefully (e.g. still surface an invite link manually).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY is not set; skipping email send.');
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }

  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[email] Resend responded ${response.status}: ${body}`);
      return { ok: false, error: `Resend ${response.status}` };
    }

    const data = (await response.json()) as { id?: string };
    return { ok: true, id: data.id ?? '' };
  } catch (error) {
    console.error('[email] Failed to call Resend:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'unknown error' };
  }
}

const ROLE_LABELS: Record<MembershipRole, string> = {
  product_admin: 'Administrator platformy',
  manager: 'Manager ośrodka',
  instructor: 'Instruktor',
  client: 'Klient',
  boarder: 'Właściciel konia (pensjonat)',
};

function inviteEmailHtml(params: {
  inviteUrl: string;
  organizationName: string;
  role: MembershipRole;
}): string {
  const roleLabel = ROLE_LABELS[params.role] ?? params.role;
  return `<!doctype html>
<html lang="pl">
  <body style="margin:0;background-color:#F7F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1D2A24;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5F0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border:1px solid #E4DFD4;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:#2F5D3A;padding:24px 32px;color:#FFFFFF;font-size:18px;font-weight:600;letter-spacing:0.02em;">
                Equestrian Scheduler
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#1D2A24;">
                  Zaproszenie do ośrodka ${params.organizationName}
                </h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6B7280;">
                  Otrzymujesz to zaproszenie, aby dołączyć do ośrodka
                  <strong style="color:#1D2A24;">${params.organizationName}</strong>
                  w roli <strong style="color:#1D2A24;">${roleLabel}</strong>.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="border-radius:10px;background-color:#2F5D3A;">
                      <a href="${params.inviteUrl}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                        Przyjmij zaproszenie
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6B7280;">
                  Jeśli przycisk nie działa, skopiuj poniższy link do przeglądarki:
                </p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;">
                  <a href="${params.inviteUrl}" style="color:#2F5D3A;">${params.inviteUrl}</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9AA3AE;">
                  Zaproszenie wygasa po 7 dniach. Jeśli nie spodziewasz się tej wiadomości, po prostu ją zignoruj.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function inviteEmailText(params: {
  inviteUrl: string;
  organizationName: string;
  role: MembershipRole;
}): string {
  const roleLabel = ROLE_LABELS[params.role] ?? params.role;
  return [
    `Zaproszenie do ośrodka ${params.organizationName} — Equestrian Scheduler`,
    '',
    `Zapraszamy Cię do dołączenia do ośrodka ${params.organizationName} w roli: ${roleLabel}.`,
    '',
    'Otwórz poniższy link, aby przyjąć zaproszenie:',
    params.inviteUrl,
    '',
    'Zaproszenie wygasa po 7 dniach. Jeśli nie spodziewasz się tej wiadomości, zignoruj ją.',
  ].join('\n');
}

/** Sends an invitation email with the activation link. */
export async function sendInviteEmail(params: {
  to: string;
  inviteUrl: string;
  organizationName: string;
  role: MembershipRole;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: params.to,
    subject: `Zaproszenie do ośrodka ${params.organizationName} — Equestrian Scheduler`,
    html: inviteEmailHtml(params),
    text: inviteEmailText(params),
  });
}

function passwordResetEmailHtml(params: { resetUrl: string }): string {
  return `<!doctype html>
<html lang="pl">
  <body style="margin:0;background-color:#F7F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1D2A24;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5F0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border:1px solid #E4DFD4;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:#2F5D3A;padding:24px 32px;color:#FFFFFF;font-size:18px;font-weight:600;letter-spacing:0.02em;">
                Equestrian Scheduler
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#1D2A24;">
                  Reset hasła
                </h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6B7280;">
                  Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.
                  Kliknij poniższy przycisk, aby ustawić nowe hasło.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="border-radius:10px;background-color:#2F5D3A;">
                      <a href="${params.resetUrl}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                        Ustaw nowe hasło
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6B7280;">
                  Jeśli przycisk nie działa, skopiuj poniższy link do przeglądarki:
                </p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;">
                  <a href="${params.resetUrl}" style="color:#2F5D3A;">${params.resetUrl}</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9AA3AE;">
                  Link jest ważny przez ograniczony czas. Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function passwordResetEmailText(params: { resetUrl: string }): string {
  return [
    'Reset hasła — Equestrian Scheduler',
    '',
    'Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.',
    'Otwórz poniższy link, aby ustawić nowe hasło:',
    params.resetUrl,
    '',
    'Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.',
  ].join('\n');
}

/** Sends a password-reset email with the recovery link. */
export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: params.to,
    subject: 'Reset hasła — Equestrian Scheduler',
    html: passwordResetEmailHtml(params),
    text: passwordResetEmailText(params),
  });
}
