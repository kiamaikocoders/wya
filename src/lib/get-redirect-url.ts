/**
 * Allowed redirect origins for auth (e.g. password reset).
 * Set VITE_ALLOWED_REDIRECT_ORIGINS to a comma-separated list of origins, e.g.:
 * https://app.example.com,https://www.example.com,http://localhost:5173
 * Only these origins will be used as redirectTo to prevent Open Redirects.
 */
const ALLOWED_ORIGINS = (import.meta.env.VITE_ALLOWED_REDIRECT_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * Returns the redirect URL for password reset only if the current origin
 * is in the allowlist. Otherwise returns undefined (Supabase will use dashboard default).
 */
export function getAllowedPasswordResetRedirectUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const origin = window.location.origin;
  if (ALLOWED_ORIGINS.length === 0) return undefined;
  if (!ALLOWED_ORIGINS.includes(origin)) return undefined;
  return `${origin}/reset-password`;
}
