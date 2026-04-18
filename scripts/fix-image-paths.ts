import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readdirSync } from 'fs';
import { join } from 'path';
import { normalizeImageUrl } from '../lib/image-url';

const prisma = new PrismaClient();
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

async function main() {
  // ── 1. Normalize all imageUrl values in DB ──────────────────────────────
  const nominees = await prisma.nominee.findMany({ select: { id: true, name: true, imageUrl: true } });
  let nomFixed = 0;
  for (const nom of nominees) {
    const fixed = normalizeImageUrl(nom.imageUrl);
    if (fixed !== nom.imageUrl) {
      console.log(`FIX nominee [${nom.name}]: "${nom.imageUrl}" → "${fixed}"`);
      await prisma.nominee.update({ where: { id: nom.id }, data: { imageUrl: fixed } });
      nomFixed++;
    }
  }

  const categories = await prisma.category.findMany({ select: { id: true, title: true, imageUrl: true } });
  let catFixed = 0;
  for (const cat of categories) {
    const fixed = normalizeImageUrl(cat.imageUrl);
    if (fixed !== cat.imageUrl) {
      console.log(`FIX category [${cat.title}]: "${cat.imageUrl}" → "${fixed}"`);
      await prisma.category.update({ where: { id: cat.id }, data: { imageUrl: fixed } });
      catFixed++;
    }
  }

  console.log(`\nNormalized: nominees ${nomFixed}/${nominees.length}, categories ${catFixed}/${categories.length}`);

  // ── 2. Check for broken DB refs (DB points to file that doesn't exist) ──
  // Collect all upload files recursively (supports both flat and uuid/filename layouts)
  function collectFiles(dir: string, base = ''): Set<string> {
    const result = new Set<string>();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const rel = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        for (const f of collectFiles(join(dir, entry.name), rel)) result.add(f);
      } else {
        result.add(rel);
      }
    }
    return result;
  }
  const allUploads = collectFiles(UPLOADS_DIR);

  const dbLocalRefs: { type: string; name: string; file: string }[] = [];

  const allNominees = await prisma.nominee.findMany({ select: { name: true, imageUrl: true } });
  for (const n of allNominees) {
    if (n.imageUrl?.startsWith('/uploads/')) {
      dbLocalRefs.push({ type: 'nominee', name: n.name, file: n.imageUrl.replace('/uploads/', '') });
    }
  }
  const allCats = await prisma.category.findMany({ select: { title: true, imageUrl: true } });
  for (const c of allCats) {
    if (c.imageUrl?.startsWith('/uploads/')) {
      dbLocalRefs.push({ type: 'category', name: c.title, file: c.imageUrl.replace('/uploads/', '') });
    }
  }

  const referencedFiles = new Set(dbLocalRefs.map(r => r.file));
  const broken = dbLocalRefs.filter(r => !allUploads.has(r.file));
  const orphaned = [...allUploads].filter(f => f !== '.gitkeep' && !referencedFiles.has(f));

  if (broken.length) {
    console.log('\n⚠️  BROKEN refs (DB points to missing file):');
    broken.forEach(r => console.log(`   [${r.type}] ${r.name} → /uploads/${r.file}`));
  } else {
    console.log('\n✓ No broken DB refs');
  }

  if (orphaned.length) {
    console.log('\nOrphaned files (uploaded but not in DB):');
    orphaned.forEach(f => console.log(`   /uploads/${f}`));
  } else {
    console.log('✓ No orphaned files');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
