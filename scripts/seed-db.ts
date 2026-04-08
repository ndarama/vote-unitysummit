import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL_UNPOOLED or DATABASE_URL in environment');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const DATA_FILE = path.join(process.cwd(), 'data.json');

interface RawCategory {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageFocalPoint?: string;
}

interface RawNominee {
  id: string;
  categoryId: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  imageFocalPoint?: string;
  withdrawn?: boolean;
  withdrawalNote?: string;
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const rawCategories: RawCategory[] = raw.categories ?? [];
  const rawNominees: RawNominee[] = raw.nominees ?? [];

  // --- Upsert categories ---
  // Maps old data.json ID → DB UUID
  const categoryIdMap = new Map<string, string>();

  let catCreated = 0;
  let catUpdated = 0;

  for (const cat of rawCategories) {
    const existing = await prisma.category.findFirst({ where: { title: cat.title } });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          description: cat.description,
          imageUrl: cat.imageUrl,
        },
      });
      categoryIdMap.set(cat.id, existing.id);
      catUpdated++;
    } else {
      const created = await prisma.category.create({
        data: {
          title: cat.title,
          description: cat.description,
          imageUrl: cat.imageUrl,
        },
      });
      categoryIdMap.set(cat.id, created.id);
      catCreated++;
    }
  }

  console.log(`Categories — created: ${catCreated}, updated: ${catUpdated}`);

  // --- Upsert nominees ---
  let nomCreated = 0;
  let nomUpdated = 0;
  let nomSkipped = 0;

  for (const nom of rawNominees) {
    const dbCategoryId = categoryIdMap.get(nom.categoryId);
    if (!dbCategoryId) {
      console.warn(`  Skipping nominee "${nom.name}" — unknown categoryId "${nom.categoryId}"`);
      nomSkipped++;
      continue;
    }

    const existing = await prisma.nominee.findFirst({
      where: { name: nom.name, categoryId: dbCategoryId },
    });

    if (existing) {
      await prisma.nominee.update({
        where: { id: existing.id },
        data: {
          title: nom.title,
          description: nom.description,
          imageUrl: nom.imageUrl,
        },
      });
      nomUpdated++;
    } else {
      await prisma.nominee.create({
        data: {
          categoryId: dbCategoryId,
          name: nom.name,
          title: nom.title,
          description: nom.description,
          imageUrl: nom.imageUrl,
        },
      });
      nomCreated++;
    }
  }

  console.log(`Nominees  — created: ${nomCreated}, updated: ${nomUpdated}, skipped: ${nomSkipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
