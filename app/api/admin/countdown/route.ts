import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function GET() {
  const role = await requireRole(['admin', 'manager']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const config = await db.getCountdown();
  if (!config) return Response.json(null, { status: 200 });
  return Response.json(config);
}

export async function PUT(request: NextRequest) {
  const role = await requireRole(['admin', 'manager']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { targetDate, enabled } = body;

  if (typeof targetDate !== 'string' || !targetDate.trim()) {
    return Response.json({ error: 'targetDate is required' }, { status: 400 });
  }
  if (isNaN(Date.parse(targetDate))) {
    return Response.json({ error: 'targetDate must be a valid ISO date string' }, { status: 400 });
  }

  const config = await db.updateCountdown({
    targetDate: targetDate.trim(),
    enabled: typeof enabled === 'boolean' ? enabled : true,
  });
  return Response.json(config);
}

export async function DELETE() {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
  await db.deleteCountdown();
  return new Response(null, { status: 204 });
}
