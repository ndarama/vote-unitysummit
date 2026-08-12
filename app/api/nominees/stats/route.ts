import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { findByReadableSlug } from '@/lib/slug';
import { db } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const nomineeSlug =
      request.nextUrl.searchParams.get('deltager') ??
      request.nextUrl.searchParams.get('nominee') ??
      request.nextUrl.searchParams.get('slug');
    const categorySlug = request.nextUrl.searchParams.get('category');

    if (!nomineeSlug) {
      return Response.json({ error: 'Missing deltager slug' }, { status: 400 });
    }

    const hiddenCategoryIds = await db.getHiddenCategories();
    const visibleCategoryWhere = hiddenCategoryIds.length
      ? { id: { notIn: hiddenCategoryIds } }
      : undefined;
    const visibleCategories = await prisma.category.findMany({
      where: visibleCategoryWhere,
      orderBy: { title: 'asc' },
    });
    const category = categorySlug
      ? findByReadableSlug(visibleCategories, categorySlug, (item) => item.title)
      : null;

    if (categorySlug && !category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    const candidateNominees = await prisma.nominee.findMany({
      where: {
        withdrawn: false,
        ...(category
          ? { categoryId: category.id }
          : hiddenCategoryIds.length
            ? { categoryId: { notIn: hiddenCategoryIds } }
            : {}),
      },
      orderBy: { name: 'asc' },
    });
    const nominee = findByReadableSlug(candidateNominees, nomineeSlug, (item) => item.name);

    if (!nominee) {
      return Response.json({ error: 'Deltager not found' }, { status: 404 });
    }

    const categoryNominees = await prisma.nominee.findMany({
      where: {
        categoryId: nominee.categoryId,
        withdrawn: false,
      },
      include: {
        votes: {
          where: { invalid: false },
        },
      },
    });
    const nomineesWithVotes = categoryNominees
      .map((item) => ({
        id: item.id,
        votes: item.votes.length,
      }))
      .sort((a, b) => b.votes - a.votes);
    const currentNomineeVotes =
      nomineesWithVotes.find((item) => item.id === nominee.id)?.votes ?? 0;
    const totalVotes = nomineesWithVotes.reduce((sum, item) => sum + item.votes, 0);
    const percentage = totalVotes > 0 ? Math.round((currentNomineeVotes / totalVotes) * 100) : 0;

    return Response.json({
      deltagerSlug: nomineeSlug,
      nomineeSlug,
      categorySlug,
      votes: currentNomineeVotes,
      totalVotes,
      percentage,
      rank: nomineesWithVotes.findIndex((item) => item.id === nominee.id) + 1,
      totalNominees: categoryNominees.length,
    });
  } catch (error) {
    console.error('Error fetching nominee stats by slug:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
