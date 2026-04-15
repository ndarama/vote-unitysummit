import { prisma } from '@/lib/prisma';
import { withNormalizedImageUrl } from '@/lib/image-url';

export async function GET() {
  try {
    const [categories, nominees] = await Promise.all([
      prisma.category.findMany({ orderBy: { title: 'asc' } }),
      prisma.nominee.findMany({
        where: { withdrawn: false },
        orderBy: { name: 'asc' },
      }),
    ]);
    return Response.json({
      categories: categories.map(withNormalizedImageUrl),
      nominees: nominees.map(withNormalizedImageUrl),
    });
  } catch (error) {
    console.error('Error fetching categories and nominees:', error);
    return Response.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
