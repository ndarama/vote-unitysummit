import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

// POST /api/admin/nominees/[id]/withdraw — withdraw a nominee with a note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { note } = body;

    if (!note || !note.trim()) {
      return Response.json({ error: 'A withdrawal note is required' }, { status: 400 });
    }

    const existing = await prisma.nominee.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Nominee not found' }, { status: 404 });

    const nominee = await prisma.nominee.update({
      where: { id },
      data: { withdrawn: true, withdrawalNote: note.trim() },
    });
    return Response.json(nominee);
  } catch (err) {
    console.error('POST /api/admin/nominees/[id]/withdraw:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/nominees/[id]/withdraw — restore a withdrawn nominee
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const existing = await prisma.nominee.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Nominee not found' }, { status: 404 });

    const nominee = await prisma.nominee.update({
      where: { id },
      data: { withdrawn: false, withdrawalNote: null },
    });
    return Response.json(nominee);
  } catch (err) {
    console.error('DELETE /api/admin/nominees/[id]/withdraw:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
