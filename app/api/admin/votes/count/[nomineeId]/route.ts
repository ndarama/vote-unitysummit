import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { getNomineeVoteCount } from '@/services/voteService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nomineeId: string }> }
) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { nomineeId } = await params;
    const count = await getNomineeVoteCount(nomineeId);
    
    return Response.json({ nomineeId, count });
  } catch (error) {
    console.error('Error fetching nominee vote count:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
