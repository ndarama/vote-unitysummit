import { NextRequest } from 'next/server';
import { createVote } from '@/services/voteService';
import { sendVoteConfirmationEmail } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, categoryId, nomineeId } = body;

    if (!email || !categoryId || !nomineeId) {
      return Response.json({ error: 'Mangler data' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-forwarded-for') ?? 
      request.headers.get('x-real-ip') ?? 
      'unknown';
    const userAgent = request.headers.get('user-agent') ?? undefined;

    const vote = await createVote({
      email,
      categoryId,
      nomineeId,
      ip,
      userAgent,
    });

    // Send confirmation email (don't wait for it, send in background)
    sendVoteConfirmationEmail(
      email,
      vote.nominee.name,
      vote.category.title
    ).catch((err) => {
      console.error('Failed to send confirmation email:', err);
      // Don't fail the vote if email fails
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
