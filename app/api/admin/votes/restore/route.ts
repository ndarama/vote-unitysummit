import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { restoreVote } from '@/services/voteService';

export async function POST(request: NextRequest) {
  try {
    const role = await requireRole(['admin']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, categoryId } = body;

    if (!email || !categoryId) {
      return Response.json({ error: 'Mangler påkrevde felter' }, { status: 400 });
    }

    await restoreVote(email, categoryId);
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error restoring vote:', error);
    
    if (error.message === 'Ugyldig stemme ikke funnet') {
      return Response.json({ error: error.message }, { status: 404 });
    }
    
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
