import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';
import { db } from '@/server/db';
import { normalizeImageUrl, withNormalizedImageUrl } from '@/lib/image-url';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { categoryId, name, title, description, imageUrl } = body;

    if (!categoryId) return Response.json({ error: 'Missing target categoryId' }, { status: 400 });

    const existing = await prisma.nominee.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Nominee not found' }, { status: 404 });

    const created = await prisma.nominee.create({
      data: {
        categoryId,
        name: name ?? existing.name,
        title: title ?? existing.title,
        description: description ?? existing.description,
        imageUrl: normalizeImageUrl(imageUrl ?? existing.imageUrl),
        withdrawn: false,
        imageFocalPoint: (existing as any).imageFocalPoint ?? undefined,
        clonedFromId: existing.id,
      },
      include: { category: { select: { id: true, title: true } } },
    });

    await db.logAudit('manual_action', 'low', `Cloned nominee ${existing.id} to new nominee ${created.id} in category ${categoryId} by admin`);

    return Response.json(withNormalizedImageUrl(created));
  } catch (err) {
    console.error('POST /api/admin/nominees/[id]/clone:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
