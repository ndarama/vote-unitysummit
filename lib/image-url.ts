function extractLocalUploadsPath(value: string): string | null {
  const normalized = value.replace(/\\/g, '/');
  const lowerCased = normalized.toLowerCase();

  const publicUploadsIndex = lowerCased.lastIndexOf('public/uploads/');
  if (publicUploadsIndex >= 0) {
    return normalized.slice(publicUploadsIndex + 'public/uploads/'.length);
  }

  const uploadsIndex = lowerCased.lastIndexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex + '/uploads/'.length);
  }

  if (lowerCased.startsWith('uploads/')) {
    return normalized.slice('uploads/'.length);
  }

  return null;
}

function isBareFilename(value: string): boolean {
  return !value.includes('/') && !value.includes('\\');
}

export function normalizeImageUrl(imageUrl: string | null | undefined): string {
  if (typeof imageUrl !== 'string') {
    return '';
  }

  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return '';
  }

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const uploadsPath = extractLocalUploadsPath(trimmed);
  if (uploadsPath) {
    return `/uploads/${uploadsPath.replace(/^\/+/, '')}`;
  }

  if (trimmed.startsWith('/')) {
    return trimmed.replace(/\\/g, '/');
  }

  if (isBareFilename(trimmed)) {
    return `/uploads/${trimmed}`;
  }

  return trimmed.replace(/\\/g, '/');
}

/** Returns just the filename portion of an imageUrl for display (e.g. "kari-nordmann.jpg"). */
export function getImageDisplayName(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  const normalized = imageUrl.replace(/\\/g, '/').split('?')[0];
  return normalized.split('/').filter(Boolean).pop() ?? '';
}

export function withNormalizedImageUrl<T extends { imageUrl: string | null }>(item: T): T {
  return {
    ...item,
    imageUrl: normalizeImageUrl(item.imageUrl),
  };
}