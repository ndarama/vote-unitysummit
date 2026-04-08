import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

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
    const newUser = db.addUser(body);
    return Response.json(newUser);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
