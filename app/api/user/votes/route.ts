import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return Response.json([]);
  const votes = await prisma.vote.findMany({
    where: { email },
    select: { categoryId: true, nomineeId: true, timestamp: true, invalid: true },
    orderBy: { timestamp: 'desc' },
  });
  return Response.json(votes.map(v => ({ ...v, timestamp: Number(v.timestamp) })));
}
