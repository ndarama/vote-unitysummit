import { getLeaderboard } from '@/services/voteService';

export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    return Response.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
