import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const role = await requireRole(['admin', 'manager']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const votes = await prisma.vote.findMany({ where: { invalid: false } });
  const stats: Record<string, number> = {};
  for (const vote of votes) {
    stats[vote.nomineeId] = (stats[vote.nomineeId] ?? 0) + 1;
  }
  return Response.json(stats);
}
