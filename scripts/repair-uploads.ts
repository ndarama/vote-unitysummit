import 'dotenv/config';
import path from 'path';
import { access } from 'fs/promises';
import { constants } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const fallbackArg = process.argv.find((arg) => arg.startsWith('--fallback-url='));
const FALLBACK_URL = fallbackArg?.slice('--fallback-url='.length) || null;
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

function isLocalUpload(imageUrl: string) {
  return typeof imageUrl === 'string' && imageUrl.startsWith('/uploads/');
}

function getUploadFilename(imageUrl: string) {
  return imageUrl.replace(/^\/uploads\//, '').split('/').pop() ?? '';
}

async function fileExists(filePath: string) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function localUploadExists(imageUrl: string) {
  if (!isLocalUpload(imageUrl)) return true;
  return fileExists(path.join(PUBLIC_UPLOADS_DIR, getUploadFilename(imageUrl)));
}

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, title: true, imageUrl: true },
  });
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const nominees = await prisma.nominee.findMany({
    select: { id: true, name: true, categoryId: true, imageUrl: true },
  });

  const nomineeRepairs = [] as Array<{
    id: string;
    name: string;
    from: string;
    to: string;
    reason: string;
  }>;
  const unresolved = [] as Array<{
    type: 'nominee' | 'category';
    id: string;
    name: string;
    imageUrl: string;
    reason: string;
  }>;

  for (const nominee of nominees) {
    if (!isLocalUpload(nominee.imageUrl)) continue;
    if (await localUploadExists(nominee.imageUrl)) continue;

    const category = categoryMap.get(nominee.categoryId);
    if (category && category.imageUrl && await localUploadExists(category.imageUrl)) {
      nomineeRepairs.push({
        id: nominee.id,
        name: nominee.name,
        from: nominee.imageUrl,
        to: category.imageUrl,
        reason: `Using category image from ${category.title}`,
      });
      continue;
    }

    if (FALLBACK_URL) {
      nomineeRepairs.push({
        id: nominee.id,
        name: nominee.name,
        from: nominee.imageUrl,
        to: FALLBACK_URL,
        reason: 'Using fallback URL',
      });
      continue;
    }

    unresolved.push({
      type: 'nominee',
      id: nominee.id,
      name: nominee.name,
      imageUrl: nominee.imageUrl,
      reason: 'Missing upload and no usable category image or fallback URL',
    });
  }

  for (const category of categories) {
    if (!isLocalUpload(category.imageUrl)) continue;
    if (await localUploadExists(category.imageUrl)) continue;

    if (FALLBACK_URL) {
      unresolved.push({
        type: 'category',
        id: category.id,
        name: category.title,
        imageUrl: category.imageUrl,
        reason: `Category image missing; rerun with manual update or use fallback URL ${FALLBACK_URL}`,
      });
      continue;
    }

    unresolved.push({
      type: 'category',
      id: category.id,
      name: category.title,
      imageUrl: category.imageUrl,
      reason: 'Missing category upload and no fallback URL provided',
    });
  }

  if (APPLY && nomineeRepairs.length > 0) {
    for (const repair of nomineeRepairs) {
      await prisma.nominee.update({
        where: { id: repair.id },
        data: { imageUrl: repair.to },
      });
    }
  }

  console.log(JSON.stringify({
    uploadDir: PUBLIC_UPLOADS_DIR,
    apply: APPLY,
    fallbackUrl: FALLBACK_URL,
    repairedNominees: nomineeRepairs,
    unresolved,
  }, null, 2));

  await prisma.$disconnect();

  if (unresolved.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});