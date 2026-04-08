import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

interface Category {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

const SEED_CATEGORIES: Category[] = [
  {
    id: '1',
    title: 'Brobyggerprisen 2026',
    description:
      'Til en leder som gjennom tydelig, inkluderende mangfoldsledelse har skapt endring og rom for forskjellighet.',
    imageUrl:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Inkluderingsprisen 2026',
    description:
      'Til en virksomhet som har vist ekstraordinær innsats i å skape en inkluderende arbeidskultur der ulikhet er en styrke.',
    imageUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Fremtidens stemme 2026',
    description:
      'Til en person under 30 år som gjennom media, kunst, samfunnsengasjement eller entreprenørskap har påvirket til mer inkludering, mangfold og forståelse.',
    imageUrl:
      'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '4',
    title: 'Kommunikasjonskraft 2026',
    description:
      'Til en aktør som gjennom kommunikasjon i det offentlige rom - digitalt, i media eller på scenen - har bidratt til å bygge broer, utfordre holdninger eller løfte underrepresenterte perspektiver.',
    imageUrl:
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '5',
    title: 'Gjennomslagskraft 2026',
    description:
      'Til en gründer eller innovatør som har brukt mangfold, en idé, bedrift eller plattform til å drive frem mer mangfold, inkludering eller annen endring som inspirerer.',
    imageUrl:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop',
  },
];

function seed() {
  let data: any = { categories: [] };

  if (fs.existsSync(DATA_FILE)) {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!Array.isArray(data.categories)) data.categories = [];
  }

  const existingIds = new Set<string>(data.categories.map((c: Category) => c.id));
  const added: string[] = [];
  const updated: string[] = [];

  for (const cat of SEED_CATEGORIES) {
    if (!existingIds.has(cat.id)) {
      data.categories.push(cat);
      added.push(cat.title);
    } else {
      // Update title/description/imageUrl if they differ
      const idx = data.categories.findIndex((c: Category) => c.id === cat.id);
      const existing = data.categories[idx];
      if (
        existing.title !== cat.title ||
        existing.description !== cat.description ||
        existing.imageUrl !== cat.imageUrl
      ) {
        data.categories[idx] = { ...existing, ...cat };
        updated.push(cat.title);
      }
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  if (added.length === 0 && updated.length === 0) {
    console.log('✓ All 5 categories already up to date — nothing changed.');
  } else {
    if (added.length) console.log(`✓ Added ${added.length} categor${added.length === 1 ? 'y' : 'ies'}:\n  - ${added.join('\n  - ')}`);
    if (updated.length) console.log(`✓ Updated ${updated.length} categor${updated.length === 1 ? 'y' : 'ies'}:\n  - ${updated.join('\n  - ')}`);
  }
}

seed();
