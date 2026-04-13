import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email } = body;

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Ugyldig e-post' }, { status: 400 });
  }

  // Rate limit: only allow one OTP request per 60 seconds
  const lastOtp = await prisma.oTP.findUnique({ where: { email } });
  if (lastOtp && BigInt(Date.now()) < lastOtp.expires - BigInt(14 * 60 * 1000)) {
    return Response.json({ error: 'Vent 60 sekunder før du ber om en ny kode.' }, { status: 429 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = BigInt(Date.now() + 15 * 60 * 1000);

  await prisma.oTP.upsert({
    where: { email },
    update: { code, expires },
    create: { email, code, expires },
  });

  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: email,
        subject: 'Din engangskode – Unity Awards 2026',
        html: otpEmailHtml(code),
      });
    } catch (err) {
      console.error('[SMTP] Failed to send OTP email:', err);
    }
  } else {
    console.log(`[OTP] No email provider configured — code for ${email}: ${code}`);
  }

  return Response.json({ message: 'OTP sendt' });
}

  return Response.json({ message: 'OTP sendt' });
}

function otpEmailHtml(code: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#001f2b;margin-bottom:8px">Unity Awards 2026</h2>
      <p style="color:#555;margin-bottom:24px">Din engangskode for å stemme:</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
        <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#001f2b;font-family:monospace">${code}</span>
      </div>
      <p style="color:#888;font-size:13px">Koden er gyldig i 15 minutter. Del den ikke med andre.</p>
    </div>
  `;
}
