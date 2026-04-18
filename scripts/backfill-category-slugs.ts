/**
 * Backfill slugs for categories that don't have one.
 * Run this AFTER `prisma db push` if you have existing categories.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const categories = await (prisma.category as any).findMany({ where: { slug: null } });
  console.log(`Found ${categories.length} categories without slug`);
  for (const cat of categories) {
    let slug = toSlug(cat.title);
    let i = 1;
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${toSlug(cat.title)}-${i++}`;
    }
    await prisma.category.update({ where: { id: cat.id }, data: { slug } });
    console.log(`  ${cat.title} → ${slug}`);
  }
  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
