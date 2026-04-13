import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { bulkInvalidateVotes } from '@/services/voteService';

export async function POST(request: NextRequest) {
  try {
    const role = await requireRole(['admin']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { criteria, reason } = body;

    if (!criteria || !reason) {
      return Response.json({ error: 'Mangler påkrevde felter' }, { status: 400 });
    }

    const count = await bulkInvalidateVotes(criteria, reason);
    return Response.json({ success: true, count });
  } catch (error) {
    console.error('Error bulk invalidating votes:', error);
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
