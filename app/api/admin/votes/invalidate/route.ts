import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function POST(request: NextRequest) {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { email, categoryId, reason } = body;
  const success = db.invalidateVote(email, categoryId, reason);
  if (success) {
    return Response.json({ success: true });
  } else {
    return Response.json({ error: 'Vote not found' }, { status: 404 });
  }
}
