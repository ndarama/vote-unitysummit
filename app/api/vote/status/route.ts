import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { hasVoted } from '@/services/voteService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    
    if (!email) {
      return Response.json({ error: 'Ikke logget inn' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return Response.json({ error: 'Mangler categoryId' }, { status: 400 });
    }

    const voted = await hasVoted(email, categoryId);
    return Response.json({ hasVoted: voted });
  } catch (error) {
    console.error('Error checking vote status:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
