/**
 * Base URL for Supabase Edge Functions (e.g. https://xxx.supabase.co).
 * Set VITE_SUPABASE_URL so the app can call rate-limited request-password-reset.
 * If unset, password reset uses supabase.auth.resetPasswordForEmail (no rate limit).
 */
export function getSupabaseFunctionsBaseUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return typeof base === "string" && base.trim() ? base.trim().replace(/\/$/, "") : "";
}

export function getRequestPasswordResetUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/request-password-reset` : "";
}
