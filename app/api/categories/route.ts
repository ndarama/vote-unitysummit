import { prisma } from '@/lib/prisma';

export async function GET() {
  const [categories, nominees] = await Promise.all([
    prisma.category.findMany({ orderBy: { title: 'asc' } }),
    prisma.nominee.findMany({
      where: { withdrawn: false },
      orderBy: { name: 'asc' },
    }),
  ]);
  return Response.json({ categories, nominees });
}
