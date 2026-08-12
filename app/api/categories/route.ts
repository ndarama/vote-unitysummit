import { prisma } from '@/lib/prisma';
import { withNormalizedImageUrl } from '@/lib/image-url';
import { toSlug, uniqueReadableSlug, withReadableSlugs } from '@/lib/slug';
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
    const nomineeSlugsByCategory = new Map<string, Set<string>>();

    return Response.json({
      categories: withReadableSlugs(
        visibleCategories.map(withNormalizedImageUrl),
        (category) => category.title
      ),
      nominees: visibleNominees.map((nominee) => {
        const normalizedNominee = withNormalizedImageUrl(nominee);
        const categorySlugs = nomineeSlugsByCategory.get(nominee.categoryId) ?? new Set<string>();
        nomineeSlugsByCategory.set(nominee.categoryId, categorySlugs);

        return {
          ...normalizedNominee,
          slug: uniqueReadableSlug(toSlug(nominee.name), categorySlugs),
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching categories and nominees:', error);
    return Response.json(
      {
        error: 'Failed to fetch data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
