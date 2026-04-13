import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { invalidateVote } from '@/services/voteService';

export async function POST(request: NextRequest) {
  try {
    const role = await requireRole(['admin']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, categoryId, reason } = body;

    if (!email || !categoryId || !reason) {
      return Response.json({ error: 'Mangler påkrevde felter' }, { status: 400 });
    }

    await invalidateVote(email, categoryId, reason);
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error invalidating vote:', error);
    
    if (error.message === 'Stemme ikke funnet') {
      return Response.json({ error: error.message }, { status: 404 });
    }
    
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
