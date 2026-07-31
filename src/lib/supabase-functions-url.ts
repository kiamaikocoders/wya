import { supabase } from "@/integrations/supabase/client";

/**
 * Base URL for Supabase Edge Functions (e.g. https://xxx.supabase.co).
 *
 * Prefer `VITE_SUPABASE_URL` when set (build-time). If omitted, falls back to the same
 * project URL as `integrations/supabase/client` so features like the media share link work
 * without a local `.env` copy.
 */
export function getSupabaseFunctionsBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_SUPABASE_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  const fromClient = (supabase as unknown as { supabaseUrl?: string }).supabaseUrl;
  if (typeof fromClient === "string" && fromClient.trim()) {
    return fromClient.trim().replace(/\/$/, "");
  }
  return "";
}

export function getRequestPasswordResetUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/request-password-reset` : "";
}

/** Admin: fetch ghost user IDs (auth pattern) so stats can exclude them. Requires VITE_SUPABASE_URL. */
export function getAdminGhostUserIdsUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/admin-get-ghost-user-ids` : "";
}

/** Full account deletion (RPC + auth user removal). Requires deployed Edge Function. */
export function getDeleteMyAccountUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/delete-my-account` : "";
}

/** Admin JWT: create a time-limited share token for the event media gallery. */
export function getCreateEventMediaShareUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/create-event-media-share` : "";
}

/** Public GET ?token= — returns gallery JSON (no auth). */
export function getPublicEventMediaGalleryUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/public-event-media-gallery` : "";
}

/** Public GET ?token= — downloads a zip of shared event media (no auth). */
export function getPublicEventMediaZipUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/public-event-media-zip` : "";
}

/** Cron/service: expire marketplace listings + process seller payouts. */
export function getMarketplaceWorkerUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/marketplace-worker` : "";
}

/** Service webhook: confirm marketplace payment and complete transfer. */
export function getMarketplaceConfirmPaymentUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/marketplace-confirm-payment` : "";
}

/** Superadmin: system health + Resend test email. */
export function getAdminSystemUrl(): string {
  const base = getSupabaseFunctionsBaseUrl();
  return base ? `${base}/functions/v1/admin-system` : "";
}
