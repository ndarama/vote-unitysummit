import { requireRole } from '@/lib/require-role';
import { getLeaderboard } from '@/services/voteService';

export async function GET() {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const leaderboard = await getLeaderboard();
    return Response.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
