import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { getCategoryResults } from '@/services/voteService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { categoryId } = await params;
    const results = await getCategoryResults(categoryId);
    
    return Response.json(results);
  } catch (error: any) {
    console.error('Error fetching category results:', error);
    
    if (error.message === 'Kategori ikke funnet') {
      return Response.json({ error: error.message }, { status: 404 });
    }
    
    return Response.json({ error: 'En feil oppstod' }, { status: 500 });
  }
}
