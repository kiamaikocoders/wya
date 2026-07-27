/**
 * Admin-only: create (or rotate) a shareable link for the event media gallery.
 * Revokes any previous active links for the same event. Returns the raw token once.
 *
 * CORS: set project secret ALLOWED_ORIGINS (comma-separated) to match every SPA origin
 * that loads the admin app — same value as other Edge Functions (see docs/SECURITY.md).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadEmailSettings, sendRawEmail, logEmailSend, getResendApiKey } from "../_shared/resend.ts";
import { renderTransactionalTemplate } from "../_shared/email-templates.ts";

const getAllowedOrigin = (requestOrigin: string | null): string | null => {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  if (allowed.length === 0) return null;
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] ?? null;
};

const corsHeadersFor = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

async function sha256Hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomTokenUrlSafe(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = corsHeadersFor(getAllowedOrigin(requestOrigin));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(jwt);
    if (userError || !user) {
      const hint =
        userError?.message ||
        (!user ? "Session invalid; sign out and sign in again." : "");
      return new Response(JSON.stringify({ error: "Unauthorized", hint }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (!profile || profile.username !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const eventId = Number(body?.event_id);
    if (!Number.isFinite(eventId) || eventId <= 0) {
      return new Response(JSON.stringify({ error: "Invalid event_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let days = Number(body?.expires_in_days);
    if (!Number.isFinite(days)) days = 30;
    days = Math.min(365, Math.max(1, Math.floor(days)));

    const { data: eventRow, error: eventErr } = await supabaseAdmin
      .from("events")
      .select("id, title")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !eventRow) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientEmail = String(body?.recipient_email ?? "").trim().toLowerCase();
    const siteOrigin =
      requestOrigin ||
      Deno.env.get("PUBLIC_SITE_URL") ||
      "https://www.wya254.com";

    const token = randomTokenUrlSafe();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + days);

    const { error: revokeErr } = await supabaseAdmin
      .from("event_media_share_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .is("revoked_at", null);

    if (revokeErr) {
      console.error("create-event-media-share revoke previous", revokeErr);
      const hint = revokeErr.message || String(revokeErr.code || "");
      return new Response(
        JSON.stringify({
          error: "Could not create share link",
          hint:
            hint ||
            "Database error updating event_media_share_links — run migration 20260409120000_event_media_share_links.sql on this project.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insErr } = await supabaseAdmin.from("event_media_share_links").insert({
      event_id: eventId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    });

    if (insErr) {
      console.error("create-event-media-share insert", insErr);
      const hint = insErr.message || String(insErr.code || "");
      return new Response(
        JSON.stringify({
          error: "Could not create share link",
          hint:
            hint ||
            "If the table is missing, apply migration event_media_share_links in Supabase (SQL editor or migrations).",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const galleryUrl = `${String(siteOrigin).replace(/\/$/, "")}/media-gallery/${token}`;

    if (recipientEmail.includes("@") && !recipientEmail.endsWith("@wya.local") && getResendApiKey()) {
      try {
        const settings = await loadEmailSettings(supabaseAdmin);
        if (settings.notificationsEnabled) {
          const rendered = renderTransactionalTemplate("media-share", {
            siteUrl: settings.siteUrl,
            eventTitle: (eventRow as { title?: string }).title ?? "Event",
            link: galleryUrl,
            message: `A media gallery was shared with you. Link expires ${expiresAt.toISOString().slice(0, 10)}.`,
          });
          const result = await sendRawEmail({
            to: recipientEmail,
            subject: rendered.subject,
            html: rendered.html,
            fromEmail: settings.fromEmail,
            fromName: settings.fromName,
            tags: [{ name: "template", value: "media-share" }],
          });
          await logEmailSend(supabaseAdmin, {
            to_email: recipientEmail,
            template_id: "media-share",
            subject: rendered.subject,
            status: result.sent ? "sent" : "error",
            provider_id: result.messageId,
            error: result.error ?? null,
            metadata: { event_id: eventId },
          });
        }
      } catch (mailErr) {
        console.warn("media share email failed", mailErr);
      }
    }

    return new Response(
      JSON.stringify({
        token,
        expires_at: expiresAt.toISOString(),
        emailed: Boolean(recipientEmail.includes("@")),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("create-event-media-share", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
