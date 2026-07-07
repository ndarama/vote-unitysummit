import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';
import { db } from '@/server/db';
import { normalizeImageUrl, withNormalizedImageUrl } from '@/lib/image-url';

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
    return Response.json(withNormalizedImageUrl(nominee));
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
    const { categoryId, name, title, description, imageUrl, force } = body;

    const existing = await prisma.nominee.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Nominee not found' }, { status: 404 });

    // If transferring to a different category, ensure target category has no votes unless forced
    if (categoryId !== undefined && categoryId !== existing.categoryId) {
      const targetVoteCount = await prisma.vote.count({ where: { categoryId, invalid: false } });
      if (targetVoteCount > 0 && !force) {
        return Response.json({ error: 'Mål-kategori har allerede stemmer. Bruk "force": true for å tvinge overføring.' }, { status: 409 });
      }
      if (targetVoteCount > 0 && force) {
        await db.logAudit('manual_action', 'medium', `Forced transfer of nominee ${id} from ${existing.categoryId} to ${categoryId} by admin`);
      }
    }

    const updated = await prisma.nominee.update({
      where: { id },
      data: {
        ...(categoryId !== undefined && { categoryId }),
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl: normalizeImageUrl(imageUrl) }),
      },
      include: { category: { select: { id: true, title: true } } },
    });

    return Response.json(withNormalizedImageUrl(updated));
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

    const voteCount = await prisma.vote.count({ where: { nomineeId: id } });
    if (voteCount > 0) {
      return Response.json(
        { error: `Cannot delete "${existing.name}" — they have ${voteCount} vote${voteCount === 1 ? '' : 's'}. Withdraw them instead.` },
        { status: 409 }
      );
    }

    await prisma.nominee.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/nominees/[id]:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
