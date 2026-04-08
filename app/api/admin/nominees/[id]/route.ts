import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const nominee = await prisma.nominee.findUnique({
      where: { id },
      include: { category: { select: { id: true, title: true } } },
    });

    if (!nominee) return Response.json({ error: 'Nominee not found' }, { status: 404 });
    return Response.json(nominee);
  } catch (err) {
    console.error('GET /api/admin/nominees/[id]:', err);
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
    const { categoryId, name, title, description, imageUrl } = body;

    const existing = await prisma.nominee.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Nominee not found' }, { status: 404 });

    const updated = await prisma.nominee.update({
      where: { id },
      data: {
        ...(categoryId !== undefined && { categoryId }),
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: { category: { select: { id: true, title: true } } },
    });

    return Response.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/nominees/[id]:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    await prisma.nominee.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/nominees/[id]:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
