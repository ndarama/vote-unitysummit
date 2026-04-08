import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function GET() {
  const role = await requireRole(['manager', 'admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
  return Response.json(db.getSystemConfig());
}
