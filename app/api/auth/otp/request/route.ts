import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

  if (resend) {
    try {
      await resend.emails.send({
        from: 'Unity Awards <noreply@unitysummit.no>',
        to: email,
        subject: 'Din engangskode – Unity Awards 2026',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#001f2b;margin-bottom:8px">Unity Awards 2026</h2>
            <p style="color:#555;margin-bottom:24px">Din engangskode for å stemme:</p>
            <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#001f2b;font-family:monospace">${code}</span>
            </div>
            <p style="color:#888;font-size:13px">Koden er gyldig i 15 minutter. Del den ikke med andre.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[Resend] Failed to send OTP email:', err);
      // Fall through — dev fallback below
    }
  } else {
    console.log(`[OTP] No RESEND_API_KEY — code for ${email}: ${code}`);
  }

  return Response.json({ message: 'OTP sendt' });
}

