/**
 * Email service using the Resend SDK.
 * Sends transactional emails for email verification.
 */
import { Resend } from "resend";

const RESEND_API_KEY = process.env["RESEND_API_KEY"];
const APP_URL = process.env["APP_URL"] ?? "https://sorte-ar.vercel.app";
const FROM_ADDRESS = process.env["EMAIL_FROM"] ?? "Sorte.ar <onboarding@resend.dev>";

function getResend(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(RESEND_API_KEY);
}

/**
 * Sends a verification email to a newly registered user.
 */
export async function sendVerificationEmail(
  toEmail: string,
  displayName: string,
  token: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn(
      `[email] RESEND_API_KEY not set. Verification link:\n${APP_URL}/api/auth/verify-email?token=${token}`
    );
    return;
  }

  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;
  const resend = getResend();

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#2563eb;padding:32px;text-align:center">
            <h1 style="margin:0;color:white;font-size:28px;font-weight:800;letter-spacing:-0.5px">
              Sorte<span style="color:#93c5fd">.</span>ar
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px">
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700">Confirme seu e-mail</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
              Olá, <strong>${displayName}</strong>!<br/>
              Clique no botão abaixo para confirmar seu e-mail e ativar sua conta no Sorte.ar.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#2563eb;border-radius:10px">
                  <a href="${verifyUrl}"
                     style="display:inline-block;padding:14px 32px;color:white;font-size:15px;font-weight:700;text-decoration:none">
                    ✅ Confirmar e-mail
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#9ca3af;font-size:13px">Este link expira em <strong>24 horas</strong>.</p>
            <p style="margin:0;color:#9ca3af;font-size:13px">Se você não criou uma conta no Sorte.ar, pode ignorar este e-mail.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;color:#d1d5db;font-size:12px">Sorte.ar · Sorteio de times e campeonatos de EAFC</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [toEmail],
    subject: "Confirme seu e-mail — Sorte.ar",
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  displayName: string,
  token: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn(
      `[email] RESEND_API_KEY not set. Reset link:\n${APP_URL}/login?reset_token=${token}`
    );
    return;
  }

  const resetUrl = `${APP_URL}/login?reset_token=${token}`;
  const resend = getResend();

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#2563eb;padding:32px;text-align:center">
            <h1 style="margin:0;color:white;font-size:28px;font-weight:800;letter-spacing:-0.5px">
              Sorte<span style="color:#93c5fd">.</span>ar
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px">
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700">Redefinir senha</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
              Olá, <strong>${displayName}</strong>!<br/>
              Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="background:#2563eb;border-radius:10px">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:14px 32px;color:white;font-size:15px;font-weight:700;text-decoration:none">
                    🔑 Redefinir minha senha
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#9ca3af;font-size:13px">Este link expira em <strong>1 hora</strong>.</p>
            <p style="margin:0;color:#9ca3af;font-size:13px">Se você não solicitou a redefinição, pode ignorar este e-mail. Sua senha permanece a mesma.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;color:#d1d5db;font-size:12px">Sorte.ar · Sorteio de times e campeonatos de EAFC</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [toEmail],
    subject: "Redefinir senha — Sorte.ar",
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
