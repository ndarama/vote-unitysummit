import { auth } from '@/auth';
import { getUserVotes } from '@/services/voteService';

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    
    if (!email) {
      return Response.json([]);
    }

    const votes = await getUserVotes(email);
    return Response.json(votes);
  } catch (error) {
    console.error('Error fetching user votes:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
