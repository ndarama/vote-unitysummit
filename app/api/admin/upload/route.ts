import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

  const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'jpg';
  const filename = `${uuidv4()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

  return Response.json({ url: `/uploads/${filename}` });
}
