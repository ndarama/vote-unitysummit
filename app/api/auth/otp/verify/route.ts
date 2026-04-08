import { NextRequest } from 'next/server';
import { signIn } from '@/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, code } = body;

  if (!email || !code) {
    return Response.json({ error: 'Mangler e-post eller kode' }, { status: 400 });
  }

  try {
    await signIn('otp', { email, code, redirect: false });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Ugyldig eller utløpt kode' }, { status: 401 });
  }
}
