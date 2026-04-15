import path from 'path';

export const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
export const PUBLIC_UPLOADS_URL_PREFIX = '/uploads';

export function getPublicUploadPath(filename: string) {
  return path.join(PUBLIC_UPLOADS_DIR, filename);
}