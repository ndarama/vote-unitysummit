export function toSlug(input: string) {
  const slug = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return slug || 'item';
}

export function maybeIdFromSlug(slug: string) {
  // Simple check: UUIDs include dashes and hex; if slug looks like UUID, return it as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    return slug;
  }
  return null;
}

export function uniqueReadableSlug(baseSlug: string, usedSlugs: Set<string>) {
  let slug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

export function withReadableSlugs<T extends object>(items: T[], getLabel: (item: T) => string) {
  const usedSlugs = new Set<string>();

  return items.map((item) => {
    const baseSlug = toSlug(getLabel(item));

    return {
      ...item,
      slug: uniqueReadableSlug(baseSlug, usedSlugs),
    };
  });
}

export function findByReadableSlug<T extends object>(
  items: T[],
  slug: string,
  getLabel: (item: T) => string
) {
  const decodedSlug = decodeURIComponent(slug);

  return withReadableSlugs(items, getLabel).find((item) => item.slug === decodedSlug) ?? null;
}
