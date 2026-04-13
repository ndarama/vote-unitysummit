import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nomineeId: string }> }
) {
  try {
    const { nomineeId } = await params;

    // Get nominee with category
    const nominee = await prisma.nominee.findUnique({
      where: { id: nomineeId },
      include: {
        category: true,
      },
    });

    if (!nominee) {
      return Response.json({ error: 'Nominee not found' }, { status: 404 });
    }

    // Get all nominees in the same category with their vote counts
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

    // Calculate stats
    const nomineesWithVotes = categoryNominees.map(n => ({
      id: n.id,
      votes: n.votes.length,
    }));

    // Sort by votes descending
    nomineesWithVotes.sort((a, b) => b.votes - a.votes);

    // Find current nominee's rank
    const rank = nomineesWithVotes.findIndex(n => n.id === nomineeId) + 1;
    const currentNomineeVotes = nomineesWithVotes.find(n => n.id === nomineeId)?.votes || 0;
    const totalVotes = nomineesWithVotes.reduce((sum, n) => sum + n.votes, 0);
    const percentage = totalVotes > 0 ? Math.round((currentNomineeVotes / totalVotes) * 100) : 0;

    return Response.json({
      nomineeId,
      categoryId: nominee.categoryId,
      votes: currentNomineeVotes,
      totalVotes,
      percentage,
      rank,
      totalNominees: categoryNominees.length,
    });
  } catch (error) {
    console.error('Error fetching nominee stats:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
