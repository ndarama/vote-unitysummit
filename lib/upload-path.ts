import path from 'path';

// In production, set UPLOAD_DIR to an absolute path (e.g. /var/www/app/public/uploads)
// so uploads don't depend on the process working directory.
// Falls back to <cwd>/public/uploads which works when `next start` runs from the project root.
export const PUBLIC_UPLOADS_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads');
export const PUBLIC_UPLOADS_URL_PREFIX = '/uploads';
