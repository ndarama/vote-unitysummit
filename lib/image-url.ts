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

  return trimmed.replace(/\\/g, '/');
}

export function withNormalizedImageUrl<T extends { imageUrl: string | null }>(item: T): T {
  return {
    ...item,
    imageUrl: normalizeImageUrl(item.imageUrl),
  };
}