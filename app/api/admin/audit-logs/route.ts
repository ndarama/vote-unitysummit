import { requireRole } from '@/lib/require-role';
import { db } from '@/server/db';

export async function GET() {
  const role = await requireRole(['admin']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });
  return Response.json(await db.getAuditLogs());
}
