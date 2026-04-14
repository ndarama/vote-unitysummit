import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/server/db';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/services/emailService';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'E-post er påkrevd' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Always respond with success to prevent email enumeration
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  console.log(`[ForgotPassword] Request for: ${normalizedEmail} — user found: ${!!user}`);

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    await db.createPasswordResetToken(user.email, token);

    const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    console.log(`[ForgotPassword] Sending reset email to: ${user.email}`);
    const sent = await sendPasswordResetEmail(user.email, resetUrl);
    console.log(`[ForgotPassword] Email sent: ${sent} — reset URL: ${resetUrl}`);
  }

  return NextResponse.json({
    message:
      'Dersom e-postadressen er registrert, vil du motta en e-post med instruksjoner for å tilbakestille passordet ditt.',
  });
}
