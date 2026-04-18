import nodemailer from 'nodemailer';

/**
 * Creates SMTP transporter
 */
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  
  console.log('[SMTP Config] Creating transporter with:');
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Secure: ${secure}`);
  console.log(`  User: ${user}`);
  console.log(`  Password: ${pass ? '***SET***' : 'NOT SET'}`);
  
  if (!host || !user || !pass) {
    console.error('[SMTP Config] Missing required SMTP configuration');
    return null;
  }
  
  return nodemailer.createTransport({ 
    host, 
    port, 
    secure, 
    auth: { user, pass } 
  });
}

/**
 * Sends an email using SMTP Gmail
 */
async function sendEmail(to: string, subject: string, html: string) {
  console.log(`[Email] Attempting to send email to ${to}`);
  console.log(`[Email] Subject: ${subject}`);
  console.log('[Email] Using SMTP provider');
  
  const transporter = getSmtpTransporter();
  if (!transporter) {
    console.error('[Email] No email provider configured - check environment variables');
    console.error('[Email] Required variables: SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
    return false;
  }
  
  try {
    console.log('[SMTP] Transporter configured, sending email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log('[SMTP] Email sent successfully! Message ID:', info.messageId);
    console.log('[SMTP] Response:', info.response);
    return true;
  } catch (err: any) {
    console.error('[SMTP] Failed to send email:', err);
    console.error('[SMTP] Error details:', {
      message: err.message,
      code: err.code,
      command: err.command,
    });
    return false;
  }
}

/**
 * Email template for vote OTP
 */
function voteOTPEmailHtml(code: string, nomineeName: string, categoryTitle: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f5f5f5">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#ffffff">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #001f2b 0%, #003d52 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700">Unity Awards 2026</h1>
          <p style="color:#a0d5e8;margin:8px 0 0 0;font-size:14px">Bekreft din stemme</p>
        </div>

        <!-- Content -->
        <div style="padding:40px 32px">
          <h2 style="color:#001f2b;margin:0 0 16px 0;font-size:22px;font-weight:600">Bekreft din stemme</h2>
          
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px 0">
            Du har bedt om å stemme på:
          </p>

          <div style="background-color:#f8f9fa;border-left:4px solid #001f2b;padding:16px 20px;margin:0 0 24px 0">
            <div style="font-weight:600;color:#001f2b;font-size:16px;margin-bottom:4px">${nomineeName}</div>
            <div style="color:#666;font-size:14px">${categoryTitle}</div>
          </div>

          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px 0">
            For å fullføre stemmen din, vennligst bruk følgende engangskode:
          </p>

          <!-- OTP Code -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);border-radius:12px;padding:32px;text-align:center;margin:0 0 24px 0;border:2px solid #bae6fd">
            <div style="font-size:32px;font-weight:700;letter-spacing:12px;color:#001f2b;font-family:'Courier New',monospace">${code}</div>
          </div>

          <!-- Instructions -->
          <div style="background-color:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:0 0 24px 0">
            <p style="margin:0;color:#856404;font-size:14px;line-height:1.5">
              <strong>⏱️ Viktig informasjon:</strong><br>
              • Koden er gyldig i 15 minutter<br>
              • Del aldri denne koden med andre<br>
              • Hver kode kan kun brukes én gang
            </p>
          </div>

          <p style="color:#666;font-size:14px;line-height:1.6;margin:0">
            Dersom du ikke har bedt om denne koden, kan du trygt ignorere denne e-posten.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color:#f8f9fa;padding:24px 32px;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#888;font-size:13px;text-align:center">
            Unity Awards 2026 • Powered by Vote Unity Summit
          </p>
          <p style="margin:8px 0 0 0;color:#888;font-size:12px;text-align:center">
            Denne e-posten ble sendt automatisk. Vennligst ikke svar.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Email template for vote confirmation (after successful vote)
 */
function voteConfirmationEmailHtml(nomineeName: string, categoryTitle: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f5f5f5">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#ffffff">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);padding:40px 32px;text-align:center">
          <div style="width:64px;height:64px;background-color:rgba(255,255,255,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
            <div style="color:#ffffff;font-size:32px">✓</div>
          </div>
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700">Stemme Registrert!</h1>
          <p style="color:#d1fae5;margin:8px 0 0 0;font-size:14px">Unity Awards 2026</p>
        </div>

        <!-- Content -->
        <div style="padding:40px 32px">
          <h2 style="color:#001f2b;margin:0 0 16px 0;font-size:22px;font-weight:600">Takk for din stemme!</h2>
          
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px 0">
            Din stemme har blitt registrert og teller med i avstemningen.
          </p>

          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);border-left:4px solid #059669;padding:20px 24px;margin:0 0 24px 0;border-radius:8px">
            <div style="font-weight:600;color:#001f2b;font-size:18px;margin-bottom:8px">${nomineeName}</div>
            <div style="color:#666;font-size:14px;margin-bottom:4px">${categoryTitle}</div>
            <div style="color:#059669;font-size:13px;margin-top:12px">🗳️ Stemme bekreftet</div>
          </div>

          <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:0 0 24px 0">
            <p style="margin:0;color:#166534;font-size:14px;line-height:1.5">
              <strong>✨ Hva skjer videre?</strong><br>
              • Stemmen din er registrert og kan ikke endres<br>
              • Du vil motta oppdateringer om avstemningen<br>
              • Vinnerne annonseres på Unity Summit 2026
            </p>
          </div>

          <p style="color:#666;font-size:14px;line-height:1.6;margin:0">
            Du kan stemme i andre kategorier ved å gå tilbake til stemmeportalen.
          </p>

          <div style="text-align:center;margin:32px 0 0 0">
            <a href="${process.env.AUTH_URL || 'http://localhost:3000'}" 
               style="display:inline-block;background: linear-gradient(135deg, #001f2b 0%, #003d52 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px">
              Tilbake til Stemmeportalen
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color:#f8f9fa;padding:24px 32px;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#888;font-size:13px;text-align:center">
            Unity Awards 2026 • Powered by Vote Unity Summit
          </p>
          <p style="margin:8px 0 0 0;color:#888;font-size:12px;text-align:center">
            Denne e-posten ble sendt automatisk. Vennligst ikke svar.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Sends vote OTP email
 */
export async function sendVoteOTPEmail(
  email: string,
  code: string,
  nomineeName: string,
  categoryTitle: string
) {
  const subject = `Bekreft din stemme – Unity Awards 2026`;
  const html = voteOTPEmailHtml(code, nomineeName, categoryTitle);
  return await sendEmail(email, subject, html);
}

/**
 * Sends vote confirmation email
 */
export async function sendVoteConfirmationEmail(
  email: string,
  nomineeName: string,
  categoryTitle: string
) {
  const subject = `Stemme registrert – Unity Awards 2026`;
  const html = voteConfirmationEmailHtml(nomineeName, categoryTitle);
  return await sendEmail(email, subject, html);
}

/**
 * Email template for voter invitation
 */
function voterInvitationEmailHtml(name: string) {
  const votingUrl = process.env.AUTH_URL || 'http://localhost:3000';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f5f5f5">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#ffffff">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #001f2b 0%, #003d52 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700">Unity Awards 2026</h1>
          <p style="color:#a0d5e8;margin:8px 0 0 0;font-size:14px">Du er invitert til å stemme!</p>
        </div>

        <!-- Content -->
        <div style="padding:40px 32px">
          <h2 style="color:#001f2b;margin:0 0 16px 0;font-size:22px;font-weight:600">Hei ${name}! 👋</h2>
          
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px 0">
            Du har blitt invitert til å delta i stemmegivningen for <strong>Unity Awards 2026</strong> – en feiring av fremragende innsats innen mangfold, inkludering og brobygging i arbeidslivet.
          </p>

          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);border-left:4px solid #f59e0b;padding:20px 24px;margin:0 0 24px 0;border-radius:8px">
            <p style="margin:0 0 8px 0;color:#92400e;font-weight:600;font-size:16px">✨ Hvorfor din stemme betyr noe</p>
            <p style="margin:0;color:#78350f;font-size:14px;line-height:1.5">
              Unity Awards feirer de som skaper positive endringer og bygger broer i arbeidslivet. Din stemme bidrar til å anerkjenne disse viktige bidragene.
            </p>
          </div>

          <div style="background-color:#f0f9ff;border:1px solid #7dd3fc;border-radius:8px;padding:20px;margin:0 0 24px 0">
            <p style="margin:0 0 12px 0;color:#001f2b;font-weight:600;font-size:15px">📋 Kategorier du kan stemme i:</p>
            <ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.8">
              <li><strong>Brobyggerprisen 2026</strong> – Ledere som skaper rom for forskjellighet</li>
              <li><strong>Inkluderingsprisen 2026</strong> – Virksomheter med inkluderende kultur</li>
            </ul>
          </div>

          <div style="text-align:center;margin:32px 0">
            <a href="${votingUrl}" 
               style="display:inline-block;background: linear-gradient(135deg, #059669 0%, #10b981 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700;font-size:18px;box-shadow:0 4px 14px rgba(16,185,129,0.4)">
              🗳️ Stem Nå
            </a>
          </div>

          <div style="background-color:#fef2f2;border:1px solid#fecaca;border-radius:8px;padding:16px;margin:24px 0">
            <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.5">
              <strong>⏱️ Viktig informasjon:</strong><br>
              • Du kan stemme i flere kategorier<br>
              • Én stemme per kategori<br>
              • Alle stemmer er anonyme og sikre<br>
              • Vinnerne annonseres på Unity Summit 2026
            </p>
          </div>

          <p style="color:#666;font-size:14px;line-height:1.6;margin:24px 0 0 0">
            Takk for at du deltar i å feire excellence innen mangfold og inkludering!
          </p>

          <p style="color:#888;font-size:13px;margin:16px 0 0 0;font-style:italic">
            Med vennlig hilsen,<br>
            <strong style="color:#001f2b">Unity Summit Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color:#f8f9fa;padding:24px 32px;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#888;font-size:13px;text-align:center">
            Unity Awards 2026 • Powered by Vote Unity Summit
          </p>
          <p style="margin:8px 0 0 0;color:#888;font-size:12px;text-align:center">
            Du mottar denne e-posten fordi du er invitert til å stemme i Unity Awards 2026.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Sends voter invitation email
 */
export async function sendVoterInvitationEmail(email: string, name: string) {
  const subject = `Du er invitert til å stemme – Unity Awards 2026 🎉`;
  const html = voterInvitationEmailHtml(name);
  return await sendEmail(email, subject, html);
}

/**
 * Email template for admin user invitation
 */
function adminInvitationEmailHtml(name: string, username: string, password: string, role: string) {
  const loginUrl = process.env.AUTH_URL || 'http://localhost:3000';
  const roleText = role === 'admin' ? 'Administrator' : 'Manager';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f5f5f5">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#ffffff">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #001f2b 0%, #003d52 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700">Unity Awards 2026</h1>
          <p style="color:#a0d5e8;margin:8px 0 0 0;font-size:14px">Admin Portal Tilgang</p>
        </div>

        <!-- Content -->
        <div style="padding:40px 32px">
          <h2 style="color:#001f2b;margin:0 0 16px 0;font-size:22px;font-weight:600">Hei ${name}! 👋</h2>
          
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px 0">
            Du har fått tilgang til <strong>Unity Awards 2026</strong> administrasjonsportalen som <strong>${roleText}</strong>.
          </p>

          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);border-left:4px solid #f59e0b;padding:20px 24px;margin:0 0 24px 0;border-radius:8px">
            <p style="margin:0 0 8px 0;color:#92400e;font-weight:600;font-size:16px">🔐 Dine påloggingsdetaljer</p>
            <div style="background-color:rgba(255,255,255,0.6);padding:12px;border-radius:6px;margin-top:12px">
              <p style="margin:0 0 8px 0;color:#78350f;font-size:14px;line-height:1.5">
                <strong>Brukernavn:</strong> <span style="font-family:'Courier New',monospace;background-color:rgba(0,0,0,0.05);padding:2px 6px;border-radius:3px">${username}</span>
              </p>
              <p style="margin:0;color:#78350f;font-size:14px;line-height:1.5">
                <strong>Passord:</strong> <span style="font-family:'Courier New',monospace;background-color:rgba(0,0,0,0.05);padding:2px 6px;border-radius:3px">${password}</span>
              </p>
            </div>
          </div>

          <div style="background-color:#f0f9ff;border:1px solid #7dd3fc;border-radius:8px;padding:20px;margin:0 0 24px 0">
            <p style="margin:0 0 12px 0;color:#001f2b;font-weight:600;font-size:15px">📋 Som ${roleText} kan du:</p>
            <ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.8">
              ${role === 'admin' ? `
              <li>Administrere kategorier og nominerte</li>
              <li>Overvåke stemmegivning i sanntid</li>
              <li>Behandle stemmeintegritet</li>
              <li>Administrere brukere</li>
              <li>Se rapporter og statistikk</li>
              ` : `
              <li>Overvåke stemmegivning</li>
              <li>Se rapporter og statistikk</li>
              `}
            </ul>
          </div>

          <div style="text-align:center;margin:32px 0">
            <a href="${loginUrl}/login" 
               style="display:inline-block;background: linear-gradient(135deg, #059669 0%, #10b981 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700;font-size:18px;box-shadow:0 4px 14px rgba(16,185,129,0.4)">
              🔓 Logg inn nå
            </a>
          </div>

          <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:24px 0">
            <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.5">
              <strong>🔒 Viktig sikkerhetsinformasjon:</strong><br>
              • Ikke del dine påloggingsdetaljer med andre<br>
              • Endre passordet ditt ved første pålogging<br>
              • Logg ut når du er ferdig med å jobbe i portalen
            </p>
          </div>

          <p style="color:#666;font-size:14px;line-height:1.6;margin:24px 0 0 0">
            Hvis du har spørsmål eller trenger hjelp, vennligst kontakt systemadministratoren.
          </p>

          <p style="color:#888;font-size:13px;margin:16px 0 0 0;font-style:italic">
            Med vennlig hilsen,<br>
            <strong style="color:#001f2b">Unity Summit Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color:#f8f9fa;padding:24px 32px;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#888;font-size:13px;text-align:center">
            Unity Awards 2026 • Powered by Vote Unity Summit
          </p>
          <p style="margin:8px 0 0 0;color:#888;font-size:12px;text-align:center">
            Du mottar denne e-posten fordi du har fått administratortilgang til Unity Awards 2026.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Sends admin user invitation email
 */
export async function sendAdminInvitationEmail(
  email: string,
  name: string,
  username: string,
  password: string,
  role: 'admin' | 'manager'
) {
  const subject = `Tilgang til Unity Awards 2026 Admin Portal`;
  const html = adminInvitationEmailHtml(name, username, password, role);
  return await sendEmail(email, subject, html);
}

/**
 * Email template for password reset
 */
function passwordResetEmailHtml(resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f5f5f5">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#ffffff">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #001f2b 0%, #003d52 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700">Unity Awards 2026</h1>
          <p style="color:#a0d5e8;margin:8px 0 0 0;font-size:14px">Tilbakestill passord</p>
        </div>

        <!-- Content -->
        <div style="padding:40px 32px">
          <h2 style="color:#001f2b;margin:0 0 16px 0;font-size:22px;font-weight:600">Tilbakestill passord</h2>

          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px 0">
            Vi mottok en forespørsel om å tilbakestille passordet for din admin-konto.
            Klikk på knappen nedenfor for å velge et nytt passord.
          </p>

          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}"
               style="display:inline-block;background: linear-gradient(135deg, #001f2b 0%, #003d52 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700;font-size:16px">
              Tilbakestill passord
            </a>
          </div>

          <div style="background-color:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:0 0 24px 0">
            <p style="margin:0;color:#856404;font-size:14px;line-height:1.5">
              <strong>⏱️ Viktig informasjon:</strong><br>
              • Lenken er gyldig i 1 time<br>
              • Lenken kan kun brukes én gang<br>
              • Del aldri denne lenken med andre
            </p>
          </div>

          <p style="color:#666;font-size:14px;line-height:1.6;margin:0">
            Dersom du ikke har bedt om å tilbakestille passordet ditt, kan du trygt ignorere denne e-posten.
            Passordet ditt vil ikke endres.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color:#f8f9fa;padding:24px 32px;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#888;font-size:13px;text-align:center">
            Unity Awards 2026 • Powered by Vote Unity Summit
          </p>
          <p style="margin:8px 0 0 0;color:#888;font-size:12px;text-align:center">
            Denne e-posten ble sendt automatisk. Vennligst ikke svar.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Sends password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const subject = `Tilbakestill passord – Unity Awards 2026`;
  const html = passwordResetEmailHtml(resetUrl);
  return await sendEmail(email, subject, html);
}
