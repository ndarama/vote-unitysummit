import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

// GET /api/admin/nominees/list — returns ALL nominees including withdrawn (admin only)
export async function GET() {
  try {
    const role = await requireRole(['admin', 'manager']);
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const nominees = await prisma.nominee.findMany({
      include: { category: { select: { id: true, title: true } } },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    });
    return Response.json(nominees);
  } catch (err) {
    console.error('GET /api/admin/nominees/list:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
