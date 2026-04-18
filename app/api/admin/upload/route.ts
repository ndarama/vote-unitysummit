import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { PUBLIC_UPLOADS_DIR, PUBLIC_UPLOADS_URL_PREFIX } from '@/lib/upload-path';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  const role = await requireRole(['admin', 'manager']);
  if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file || file.size === 0) {
    return Response.json({ error: 'Ingen fil mottatt' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Ugyldig filtype. Kun JPEG, PNG, WEBP og GIF er tillatt.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Filen er for stor. Maks 5 MB.' }, { status: 400 });
  }

  // Sanitize original filename for display; UUID subdirectory ensures uniqueness
  const nameParts = file.name.split('.');
  const ext = (nameParts.pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = nameParts.join('.')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'image';
  const filename = `${base}.${ext}`;
  const uuid = uuidv4();

  const subdir = join(PUBLIC_UPLOADS_DIR, uuid);
  await mkdir(subdir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(subdir, filename), Buffer.from(bytes));

  return Response.json({ url: `${PUBLIC_UPLOADS_URL_PREFIX}/${uuid}/${filename}` });
}
