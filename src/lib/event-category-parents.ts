/** Parent browse chips — Food and Nightlife are separate (no combined subgroup). */
export const EVENT_PARENT_CATEGORIES = [
  'Music & Entertainment',
  'Food',
  'Nightlife',
  'Arts & Culture',
  'Business & Networking',
  'Health & Wellness',
  'Sports & Outdoor',
  'Fashion & Lifestyle',
  'Gaming & Tech',
] as const;

export type EventParentCategory = (typeof EVENT_PARENT_CATEGORIES)[number];

const SUBCATEGORY_TO_PARENT: Record<string, EventParentCategory> = {
  concerts: 'Music & Entertainment',
  'dj nights / club events': 'Nightlife',
  'music festivals': 'Music & Entertainment',
  'live band performances': 'Music & Entertainment',
  'listening parties': 'Music & Entertainment',
  'karaoke nights': 'Music & Entertainment',
  'food festivals': 'Food',
  'wine / whiskey tastings': 'Food',
  'brunches & pop-ups': 'Food',
  'restaurant events': 'Food',
  'pub crawls': 'Nightlife',
  'mixology / cocktail nights': 'Nightlife',
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

function isLegacyFoodNightlife(normalized: string): boolean {
  return (
    normalized === 'food & nightlife' ||
    normalized === 'food and nightlife' ||
    normalized.includes('food & nightlife')
  );
}

/** Resolve an event's stored category label to a parent browse chip. */
export function resolveEventParentCategory(
  category?: string | null,
): EventParentCategory | null {
  if (!category?.trim()) return null;
  const normalized = category.trim().toLowerCase();

  if (isLegacyFoodNightlife(normalized)) {
    if (/night|club|pub|cocktail|dj/.test(normalized)) return 'Nightlife';
    return 'Food';
  }

  const exactParent = EVENT_PARENT_CATEGORIES.find(
    (p) => p.toLowerCase() === normalized,
  );
  if (exactParent) return exactParent;

  const mapped = SUBCATEGORY_TO_PARENT[normalized];
  if (mapped) return mapped;

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
  const needle = parentChip.toLowerCase();
  const cat = (eventCategory || '').toLowerCase();

  if (isLegacyFoodNightlife(cat)) {
    return needle === 'food' || needle === 'nightlife';
  }

  const parent = resolveEventParentCategory(eventCategory);
  if (parent) return parent.toLowerCase() === needle;

  return cat === needle || cat.includes(needle) || needle.includes(cat);
}
