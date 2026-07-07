import { NextRequest } from 'next/server';
import { createVote } from '@/services/voteService';
import { db } from '@/server/db';

export async function POST(request: NextRequest) {
  try {
    // Check countdown expiration
    const countdown = await db.getCountdown();
    if (countdown?.targetDate) {
      const target = new Date(countdown.targetDate).getTime();
      if (Date.now() > target) {
        return Response.json({ error: 'Stemmegivning er avsluttet' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { name, email, categoryId, nomineeId } = body;

    if (!email || !categoryId || !nomineeId) {
      return Response.json({ error: 'Mangler data' }, { status: 400 });
    }

    // Disallow voting into hidden categories
    const hidden = await db.isCategoryHidden(categoryId);
    if (hidden) {
      return Response.json({ error: 'Stemmegivning er avsluttet for denne kategorien' }, { status: 403 });
    }

    const ip =
      request.headers.get('x-forwarded-for') ?? 
      request.headers.get('x-real-ip') ?? 
      'unknown';
    const userAgent = request.headers.get('user-agent') ?? undefined;

    const vote = await createVote({
      name,
      email,
      categoryId,
      nomineeId,
      ip,
      userAgent,
    });

    return Response.json({ 
      success: true, 
      vote: {
        id: vote.id,
        categoryId: vote.categoryId,
        nomineeId: vote.nomineeId,
        timestamp: Number(vote.timestamp),
      }
    });
  } catch (error: any) {
    console.error('Vote creation error:', error);
    
    if (error.message) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    
    return Response.json({ error: 'En feil oppstod ved stemmegivning' }, { status: 500 });
  }
}
