import { NextRequest } from 'next/server';

import { withNormalizedImageUrl } from '@/lib/image-url';
import { maybeIdFromSlug, withReadableSlugs } from '@/lib/slug';
import { prisma } from '@/lib/prisma';
import { db } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const categoryParam = request.nextUrl.searchParams.get('category');
    const deltagerParam =
      request.nextUrl.searchParams.get('deltager') ?? request.nextUrl.searchParams.get('nominee');

    if (!categoryParam) {
      return Response.json({ error: 'Missing category slug' }, { status: 400 });
    }

    const hiddenCategoryIds = await db.getHiddenCategories();
    const categories = await prisma.category.findMany({
      orderBy: { title: 'asc' },
    });
    const visibleCategories = categories.filter(
      (category) => !hiddenCategoryIds.includes(category.id)
    );
    const categoriesWithSlugs = withReadableSlugs(
      visibleCategories.map(withNormalizedImageUrl),
      (category) => category.title
    );
    const decodedCategory = decodeURIComponent(categoryParam);
    const legacyCategoryId = maybeIdFromSlug(decodedCategory);
    const category =
      categoriesWithSlugs.find((item) => item.slug === decodedCategory) ??
      (legacyCategoryId ? categoriesWithSlugs.find((item) => item.id === legacyCategoryId) : null);

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    const nominees = await prisma.nominee.findMany({
      where: {
        categoryId: category.id,
        withdrawn: false,
      },
      orderBy: { name: 'asc' },
    });
    const nomineesWithSlugs = withReadableSlugs(
      nominees.map(withNormalizedImageUrl),
      (nominee) => nominee.name
    );
    const decodedNominee = deltagerParam ? decodeURIComponent(deltagerParam) : null;
    const legacyNomineeId = decodedNominee ? maybeIdFromSlug(decodedNominee) : null;
    const nominee = decodedNominee
      ? (nomineesWithSlugs.find((item) => item.slug === decodedNominee) ??
        (legacyNomineeId ? nomineesWithSlugs.find((item) => item.id === legacyNomineeId) : null))
      : null;

    if (deltagerParam && !nominee) {
      return Response.json({ error: 'Deltager not found' }, { status: 404 });
    }

    const canonicalPath = nominee
      ? `/category/${category.slug}?deltager=${encodeURIComponent(nominee.slug)}`
      : `/category/${category.slug}`;

    return Response.json({
      canonicalPath,
      category,
      nominee,
    });
  } catch (error) {
    console.error('Error resolving public slugs:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
