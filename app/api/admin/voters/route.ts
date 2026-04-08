import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function GET() {
  const role = await requireRole(['admin', 'manager']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
  return Response.json(db.getVoters());
}

export async function POST(request: NextRequest) {
  const role = await requireRole(['admin', 'manager']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { email, name } = body;
  if (!email || !name) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const voter = db.addVoter({ email, name });
    console.log(`[SIMULATION] Sending invitation email to ${name} <${email}>`);
    return Response.json(voter);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
