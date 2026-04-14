import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const updated = await db.updateUser(id, body);
  if (updated) return Response.json(updated);
  return Response.json({ error: 'User not found' }, { status: 404 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await db.deleteUser(id);
  return Response.json({ success: true });
}
