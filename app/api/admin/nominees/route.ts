import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';
import { normalizeImageUrl, withNormalizedImageUrl } from '@/lib/image-url';

export async function GET(request: NextRequest) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const nominees = await prisma.nominee.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: { select: { id: true, title: true } } },
      orderBy: { name: 'asc' },
    });

    return Response.json(nominees.map(withNormalizedImageUrl));
  } catch (err) {
    console.error('GET /api/admin/nominees:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { categoryId, name, title, description, imageUrl } = body;

    if (!categoryId || !name || !title || !description || !imageUrl) {
      return Response.json({ error: 'Missing required fields: categoryId, name, title, description, imageUrl' }, { status: 400 });
    }

    const nominee = await prisma.nominee.create({
      data: { categoryId, name, title, description, imageUrl: normalizeImageUrl(imageUrl) },
      include: { category: { select: { id: true, title: true } } },
    });

    return Response.json(withNormalizedImageUrl(nominee), { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/nominees:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
