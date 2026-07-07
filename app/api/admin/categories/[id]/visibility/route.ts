import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const hidden = await db.isCategoryHidden(id);
    return Response.json({ id, hidden });
  } catch (err) {
    console.error('GET /api/admin/categories/[id]/visibility:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const { hidden } = body;
    if (typeof hidden !== 'boolean') {
      return Response.json({ error: 'Missing or invalid "hidden" boolean' }, { status: 400 });
    }
    await db.setCategoryHidden(id, hidden);
    return Response.json({ success: true, id, hidden });
  } catch (err) {
    console.error('PUT /api/admin/categories/[id]/visibility:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
