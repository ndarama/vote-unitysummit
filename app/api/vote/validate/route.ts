import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { validateVote } from '@/services/voteService';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    
    if (!email) {
      return Response.json({ error: 'Ikke logget inn' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, nomineeId } = body;

    if (!categoryId || !nomineeId) {
      return Response.json({ error: 'Mangler data' }, { status: 400 });
    }

    const validation = await validateVote({
      email,
      categoryId,
      nomineeId,
    });

    return Response.json(validation);
  } catch (error) {
    console.error('Error validating vote:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
