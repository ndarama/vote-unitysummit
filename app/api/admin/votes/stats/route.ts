import { requireRole } from '@/lib/require-role';
import { getVoteStats } from '@/services/voteService';

export async function GET() {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await getVoteStats();
    return Response.json(stats);
  } catch (error) {
    console.error('Error fetching vote stats:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
