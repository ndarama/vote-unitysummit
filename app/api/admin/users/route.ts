import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';
import { sendAdminInvitationEmail } from '@/services/emailService';

export async function GET() {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
  return Response.json(db.getUsers());
}

export async function POST(request: NextRequest) {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    console.log('[API /api/admin/users POST] Received body:', body);
    
    const { email, username, password, role: userRole } = body;
    
    // Validate required fields
    if (!email || !username || !password || !userRole) {
      console.log('[API /api/admin/users POST] Missing required fields');
      return Response.json(
        { error: 'Missing required fields: email, username, password, and role are required' },
        { status: 400 }
      );
    }
    
    // Store the plain password for email before it gets hashed
    const plainPassword = password;
    
    // Create the user
    const newUser = db.addUser(body);
    console.log(`[API /api/admin/users POST] User created successfully:`, newUser.username);
    
    // Send invitation email
    console.log(`[Email] Sending admin invitation email to ${username} <${email}>`);
    sendAdminInvitationEmail(email, username, username, plainPassword, userRole).catch((err) => {
      console.error('[Email] Failed to send admin invitation email:', err);
      // Don't fail the user creation if email fails
    });
    
    return Response.json(newUser);
  } catch (e: any) {
    console.error('[API /api/admin/users POST] Error:', e.message);
    return Response.json({ error: e.message }, { status: 400 });
  }
}
