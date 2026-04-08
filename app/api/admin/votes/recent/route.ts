import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function GET(request: NextRequest) {
  const role = await requireRole(['admin', 'manager']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') ?? '50');
  return Response.json(db.getRecentVotes(limit));
}
