import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { getRecentVotes } from '@/services/voteService';

export async function GET(request: NextRequest) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    const votes = await getRecentVotes(limit);
    return Response.json(votes);
  } catch (error) {
    console.error('Error fetching recent votes:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
