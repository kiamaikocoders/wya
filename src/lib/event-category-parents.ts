/** Parent browse chips — must match admin root categories. */
export const EVENT_PARENT_CATEGORIES = [
  'Music & Entertainment',
  'Food & Nightlife',
  'Arts & Culture',
  'Business & Networking',
  'Health & Wellness',
  'Sports & Outdoor',
  'Fashion & Lifestyle',
  'Gaming & Tech',
] as const;

export type EventParentCategory = (typeof EVENT_PARENT_CATEGORIES)[number];

/** Subcategory name → parent category (from hierarchical categories migration). */
const SUBCATEGORY_TO_PARENT: Record<string, EventParentCategory> = {
  concerts: 'Music & Entertainment',
  'dj nights / club events': 'Music & Entertainment',
  'music festivals': 'Music & Entertainment',
  'live band performances': 'Music & Entertainment',
  'listening parties': 'Music & Entertainment',
  'karaoke nights': 'Music & Entertainment',
  'food festivals': 'Food & Nightlife',
  'wine / whiskey tastings': 'Food & Nightlife',
  'brunches & pop-ups': 'Food & Nightlife',
  'restaurant events': 'Food & Nightlife',
  'pub crawls': 'Food & Nightlife',
  'mixology / cocktail nights': 'Food & Nightlife',
  'art exhibitions': 'Arts & Culture',
  'poetry / spoken word': 'Arts & Culture',
  'theatre & plays': 'Arts & Culture',
  'cultural festivals': 'Arts & Culture',
  'film screenings / movie nights': 'Arts & Culture',
  'yoga sessions': 'Health & Wellness',
  'dance classes': 'Health & Wellness',
  'outdoor fitness bootcamps': 'Health & Wellness',
  'mental health meetups': 'Health & Wellness',
  'nature walks / hikes': 'Health & Wellness',
  'conferences & summits': 'Business & Networking',
  'workshops / masterclasses': 'Business & Networking',
  'panel talks': 'Business & Networking',
};

/** Resolve an event's stored category label to a parent browse chip. */
export function resolveEventParentCategory(
  category?: string | null,
): EventParentCategory | null {
  if (!category?.trim()) return null;
  const normalized = category.trim().toLowerCase();

  const exactParent = EVENT_PARENT_CATEGORIES.find(
    (p) => p.toLowerCase() === normalized,
  );
  if (exactParent) return exactParent;

  const mapped = SUBCATEGORY_TO_PARENT[normalized];
  if (mapped) return mapped;

  // Fuzzy: parent name contained in stored label or vice versa
  const fuzzy = EVENT_PARENT_CATEGORIES.find(
    (p) => normalized.includes(p.toLowerCase()) || p.toLowerCase().includes(normalized),
  );
  return fuzzy ?? null;
}

/** True when an event belongs under the selected parent browse chip. */
export function eventMatchesParentCategory(
  eventCategory: string | null | undefined,
  parentChip: string,
): boolean {
  const parent = resolveEventParentCategory(eventCategory);
  if (parent) return parent.toLowerCase() === parentChip.toLowerCase();

  const cat = (eventCategory || '').toLowerCase();
  const needle = parentChip.toLowerCase();
  return cat === needle || cat.includes(needle) || needle.includes(cat);
}
