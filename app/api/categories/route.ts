import { prisma } from '@/lib/prisma';
import { withNormalizedImageUrl } from '@/lib/image-url';
import { db } from '@/server/db';

export async function GET() {
  try {
    const [categories, nominees] = await Promise.all([
      prisma.category.findMany({ orderBy: { title: 'asc' } }),
      prisma.nominee.findMany({
        where: { withdrawn: false },
        orderBy: { name: 'asc' },
      }),
    ]);

    const hidden = new Set(await db.getHiddenCategories());

    const visibleCategories = categories.filter((c) => !hidden.has(c.id));
    const visibleNominees = nominees.filter((n) => !hidden.has(n.categoryId));

    return Response.json({
      categories: visibleCategories.map(withNormalizedImageUrl),
      nominees: visibleNominees.map(withNormalizedImageUrl),
    });
  } catch (error) {
    console.error('Error fetching categories and nominees:', error);
    return Response.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
