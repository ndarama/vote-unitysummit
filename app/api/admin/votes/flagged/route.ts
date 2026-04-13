import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { getAllVotes } from '@/services/voteService';

export async function GET(request: NextRequest) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const votes = await getAllVotes({ flagged: true });
    return Response.json(votes);
  } catch (error) {
    console.error('Error fetching flagged votes:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
