import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await requireRole(['admin', 'manager']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  db.deleteVoter(id);
  return Response.json({ success: true });
}
