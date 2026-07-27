/**
 * Normalize profile/event image URLs for display.
 * Rejects ephemeral browser blobs that were incorrectly persisted to the DB.
 */
export function resolveAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^(blob:|data:)/i.test(trimmed)) return undefined;
  return trimmed;
}

export function isPersistableAvatarUrl(url?: string | null): boolean {
  return !!resolveAvatarUrl(url);
}
