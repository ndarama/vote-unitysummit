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

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

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
      data: { title, description, imageUrl: normalizeImageUrl(imageUrl), slug: await uniqueSlug(toSlug(title)) },
    });
    return Response.json(withNormalizedImageUrl(category), { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/categories:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
