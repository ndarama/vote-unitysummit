import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { deleteVote } from '@/services/voteService';

export async function DELETE(request: NextRequest) {
  try {
    const role = await requireRole(['admin']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const voteId = searchParams.get('voteId');

    if (!voteId) {
      return Response.json({ error: 'Mangler voteId' }, { status: 400 });
    }

    await deleteVote(voteId);
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting vote:', error);
    
    if (error.message === 'Stemme ikke funnet') {
      return Response.json({ error: error.message }, { status: 404 });
    }
    
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
