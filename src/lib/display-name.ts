/** Public-facing name: never show a raw email as a display name. */
export function publicDisplayName(
  profile?: { full_name?: string | null; username?: string | null } | null,
  fallback = 'WYA member',
): string {
  const full = profile?.full_name?.trim();
  if (full && !full.includes('@')) return full;

  const raw = (profile?.username || '').trim();
  if (!raw) return fallback;

  const handle = raw.startsWith('@') ? raw.slice(1) : raw;
  if (handle.includes('@')) return handle.split('@')[0] || fallback;
  return handle || fallback;
}

/** Venue / host shown on event cards. Internal owner can stay WYA. */
export function publicHostLabel(location?: string | null, fallback = 'WYA'): string {
  const loc = location?.trim();
  if (!loc) return fallback;
  const venue = loc.split(',')[0]?.trim();
  return venue || fallback;
}
