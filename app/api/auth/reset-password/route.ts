import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Ugyldig token' }, { status: 400 });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Passordet må være minst 8 tegn' },
      { status: 400 }
    );
  }

  const result = await db.resetPassword(token, password);

  if ('error' in result) {
    const messages: Record<string, string> = {
      invalid_token: 'Ugyldig eller utløpt lenke. Be om en ny tilbakestillings-e-post.',
      token_used: 'Denne lenken er allerede brukt. Be om en ny tilbakestillings-e-post.',
      token_expired: 'Lenken har utløpt. Be om en ny tilbakestillings-e-post.',
    };
    return NextResponse.json(
      { error: messages[result.error] ?? 'Noe gikk galt' },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: 'Passordet ditt er oppdatert. Du kan nå logge inn.' });
}
