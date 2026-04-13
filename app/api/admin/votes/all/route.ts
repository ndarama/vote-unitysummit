import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { getAllVotes } from '@/services/voteService';

export async function GET(request: NextRequest) {
  try {
    const role = await requireRole(['manager', 'admin']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const nomineeId = searchParams.get('nomineeId') || undefined;
    const email = searchParams.get('email') || undefined;
    const flagged = searchParams.get('flagged') === 'true' ? true : undefined;
    const invalid = searchParams.get('invalid') === 'true' ? true : undefined;

    const votes = await getAllVotes({
      categoryId,
      nomineeId,
      email,
      flagged,
      invalid,
    });

    return Response.json(votes);
  } catch (error) {
    console.error('Error fetching all votes:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
