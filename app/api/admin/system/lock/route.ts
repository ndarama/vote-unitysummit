import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function POST(request: NextRequest) {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { locked } = body;
  const config = await db.togglePollLock(locked);
  return Response.json(config);
}
