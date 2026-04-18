import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';
import { normalizeImageUrl, withNormalizedImageUrl } from '@/lib/image-url';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uniqueSlug(base: string, excludeId: string): Promise<string> {
  let slug = base;
  let i = 1;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const category = await prisma.category.findUnique({ where: { id } });
    if (category) return Response.json(withNormalizedImageUrl(category));
    return Response.json({ error: 'Category not found' }, { status: 404 });
  } catch (err) {
    console.error('GET /api/admin/categories/[id]:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const { title, description, imageUrl } = body;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Category not found' }, { status: 404 });
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(title !== undefined && { title, slug: await uniqueSlug(toSlug(title), id) }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl: normalizeImageUrl(imageUrl) }),
      },
    });
    return Response.json(withNormalizedImageUrl(updated));
  } catch (err) {
    console.error('PUT /api/admin/categories/[id]:', err);
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
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Category not found' }, { status: 404 });
    await prisma.category.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/categories/[id]:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
