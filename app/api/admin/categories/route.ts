import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';
import { normalizeImageUrl, withNormalizedImageUrl } from '@/lib/image-url';

export async function GET() {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const categories = await prisma.category.findMany({ orderBy: { title: 'asc' } });
    return Response.json(categories.map(withNormalizedImageUrl));
  } catch (err) {
    console.error('GET /api/admin/categories:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const { title, description, imageUrl } = body;
    if (!title || !description || !imageUrl) {
      return Response.json({ error: 'Missing required fields: title, description, imageUrl' }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { title, description, imageUrl: normalizeImageUrl(imageUrl) },
    });
    return Response.json(withNormalizedImageUrl(category), { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/categories:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
