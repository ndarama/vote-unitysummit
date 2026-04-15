import 'dotenv/config';
import path from 'path';
import { access } from 'fs/promises';
import { constants } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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

async function main() {
  const [categories, nominees] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, title: true, imageUrl: true },
    }),
    prisma.nominee.findMany({
      select: { id: true, name: true, categoryId: true, imageUrl: true },
    }),
  ]);

  const missingCategories = [] as Array<{ id: string; title: string; imageUrl: string; expectedPath: string }>;
  const missingNominees = [] as Array<{ id: string; name: string; categoryId: string; imageUrl: string; expectedPath: string }>;

  for (const category of categories) {
    if (!isLocalUpload(category.imageUrl)) continue;
    const expectedPath = path.join(PUBLIC_UPLOADS_DIR, getUploadFilename(category.imageUrl));
    if (!(await fileExists(expectedPath))) {
      missingCategories.push({
        id: category.id,
        title: category.title,
        imageUrl: category.imageUrl,
        expectedPath,
      });
    }
  }

  for (const nominee of nominees) {
    if (!isLocalUpload(nominee.imageUrl)) continue;
    const expectedPath = path.join(PUBLIC_UPLOADS_DIR, getUploadFilename(nominee.imageUrl));
    if (!(await fileExists(expectedPath))) {
      missingNominees.push({
        id: nominee.id,
        name: nominee.name,
        categoryId: nominee.categoryId,
        imageUrl: nominee.imageUrl,
        expectedPath,
      });
    }
  }

  const report = {
    uploadDir: PUBLIC_UPLOADS_DIR,
    totalCategories: categories.length,
    totalNominees: nominees.length,
    missingCategories,
    missingNominees,
  };

  console.log(JSON.stringify(report, null, 2));

  await prisma.$disconnect();

  if (missingCategories.length > 0 || missingNominees.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});