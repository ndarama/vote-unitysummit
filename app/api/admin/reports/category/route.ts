import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const includeInvalid = searchParams.get('includeInvalid') === 'true';
    const includeFlagged = searchParams.get('includeFlagged') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};
    
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    // Filter by invalid status
    if (!includeInvalid) {
      where.invalid = false;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = BigInt(new Date(startDate).getTime());
      }
      if (endDate) {
        where.timestamp.lte = BigInt(new Date(endDate).getTime());
      }
    }

    // Get all categories for the report
    const categories = await prisma.category.findMany({
      where: categoryId && categoryId !== 'all' ? { id: categoryId } : undefined,
      include: {
        nominees: {
          where: { withdrawn: false },
        },
      },
      orderBy: { title: 'asc' },
    });

    // Get votes based on filters
    const votes = await prisma.vote.findMany({
      where,
      include: {
        nominee: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
        category: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Build report data
    const reportData = categories.map(category => {
      const categoryVotes = votes.filter(v => v.categoryId === category.id);
      
      // Count votes per nominee
      const voteCounts = new Map<string, { count: number; flagged: number; invalid: number }>();
      
      categoryVotes.forEach(vote => {
        const current = voteCounts.get(vote.nomineeId) || { count: 0, flagged: 0, invalid: 0 };
        current.count++;
        if (vote.flagged) current.flagged++;
        if (vote.invalid) current.invalid++;
        voteCounts.set(vote.nomineeId, current);
      });

      // Build nominee stats
      const nomineeStats = category.nominees.map(nominee => {
        const stats = voteCounts.get(nominee.id) || { count: 0, flagged: 0, invalid: 0 };
        const validVotes = includeInvalid ? stats.count : stats.count - stats.invalid;
        
        return {
          id: nominee.id,
          name: nominee.name,
          title: nominee.title,
          imageUrl: nominee.imageUrl,
          votes: validVotes,
          flaggedVotes: stats.flagged,
          invalidVotes: stats.invalid,
          totalVotes: stats.count,
          percentage: categoryVotes.length > 0 
            ? ((validVotes / categoryVotes.length) * 100).toFixed(2)
            : '0.00',
        };
      }).sort((a, b) => b.votes - a.votes);

      // Calculate category stats
      const totalVotes = categoryVotes.length;
      const validVotes = categoryVotes.filter(v => !v.invalid).length;
      const invalidVotes = categoryVotes.filter(v => v.invalid).length;
      const flaggedVotes = categoryVotes.filter(v => v.flagged).length;
      const uniqueVoters = new Set(categoryVotes.map(v => v.email)).size;

      return {
        category: {
          id: category.id,
          title: category.title,
          description: category.description,
        },
        stats: {
          totalVotes,
          validVotes,
          invalidVotes,
          flaggedVotes,
          uniqueVoters,
        },
        nominees: nomineeStats,
        recentVotes: categoryVotes.slice(0, 10).map(v => ({
          id: v.id,
          email: v.email,
          nomineeName: v.nominee.name,
          timestamp: Number(v.timestamp),
          flagged: v.flagged,
          invalid: v.invalid,
          anomalyScore: v.anomalyScore,
        })),
      };
    });

    // Overall summary
    const summary = {
      totalCategories: categories.length,
      totalVotes: votes.length,
      validVotes: votes.filter(v => !v.invalid).length,
      invalidVotes: votes.filter(v => v.invalid).length,
      flaggedVotes: votes.filter(v => v.flagged).length,
      uniqueVoters: new Set(votes.map(v => v.email)).size,
    };

    return Response.json({
      summary,
      categories: reportData,
      filters: {
        categoryId: categoryId || 'all',
        includeInvalid,
        includeFlagged,
        startDate: startDate || null,
        endDate: endDate || null,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating category report:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
