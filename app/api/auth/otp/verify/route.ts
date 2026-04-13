import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Validates an OTP code without creating a session.
 * The client should call signIn('otp', ...) via next-auth/react to establish
 * the browser session after this check.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, code } = body;

  if (!email || !code) {
    return Response.json({ error: 'Mangler e-post eller kode' }, { status: 400 });
  }

  const otp = await prisma.oTP.findUnique({ where: { email } });
  if (!otp) {
    return Response.json({ error: 'Ugyldig eller utløpt kode' }, { status: 401 });
  }
  if (BigInt(Date.now()) > otp.expires) {
    return Response.json({ error: 'Koden har utløpt' }, { status: 401 });
  }
  if (otp.code !== code) {
    return Response.json({ error: 'Feil kode' }, { status: 401 });
  }

  return Response.json({ success: true });
}
