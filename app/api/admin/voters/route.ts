import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';
import { sendVoterInvitationEmail } from '@/services/emailService';

export async function GET() {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
  return Response.json(await db.getVoters());
}

export async function POST(request: NextRequest) {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  console.log('[API /api/admin/voters POST] Received body:', body);
  
  const { email, name } = body;
  if (!email || !name) {
    console.log('[API /api/admin/voters POST] Missing fields - email:', email, 'name:', name);
    return Response.json({ error: 'Missing fields: email and name are required' }, { status: 400 });
  }

  try {
    const voter = await db.addVoter({ email, name });
    console.log(`[API /api/admin/voters POST] Voter invited successfully:`, voter);
    
    // Send real invitation email
    console.log(`[Email] Sending invitation email to ${name} <${email}>`);
    sendVoterInvitationEmail(email, name).catch((err) => {
      console.error('[Email] Failed to send invitation email:', err);
      // Don't fail the voter creation if email fails
    });
    
    return Response.json(voter);
  } catch (e: any) {
    console.error('[API /api/admin/voters POST] Error:', e.message);
    return Response.json({ error: e.message }, { status: 400 });
  }
}
