/**
 * Admin-only: create (or rotate) a shareable link for the event media gallery.
 * Optionally emails the media-share template with the gallery CTA embedded.
 *
 * CORS: set project secret ALLOWED_ORIGINS (comma-separated) to match every SPA origin
 * that loads the admin app — same value as other Edge Functions (see docs/SECURITY.md).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  loadEmailSettings,
  sendRawEmail,
  logEmailSend,
  getResendApiKey,
} from "../_shared/resend.ts";
import { renderTransactionalTemplate } from "../_shared/email-templates.ts";

const getAllowedOrigin = (requestOrigin: string | null): string | null => {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (allowed.length === 0) return null;
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] ?? null;
};

const corsHeadersFor = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

function isValidEmail(email: string): boolean {
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith("@wya.local")
  );
}

async function sha256Hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(message)
  );
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

function collectRecipientEmails(body: Record<string, unknown>): string[] {
  const out = new Set<string>();
  const single = String(body.recipient_email ?? "").trim().toLowerCase();
  if (single) out.add(single);

  const list = body.recipient_emails;
  if (Array.isArray(list)) {
    for (const item of list) {
      const e = String(item ?? "").trim().toLowerCase();
      if (e) out.add(e);
    }
  } else if (typeof list === "string") {
    for (const part of list.split(/[,;\s]+/)) {
      const e = part.trim().toLowerCase();
      if (e) out.add(e);
    }
  }
  return [...out].filter(isValidEmail);
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
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(jwt);
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

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
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

    const emailOrganizer = Boolean(body?.email_organizer);
    const mediaSummary = String(body?.media_summary ?? "").trim();
    const note = String(body?.message ?? "").trim();

    const { data: eventRow, error: eventErr } = await supabaseAdmin
      .from("events")
      .select("id, title, organizer_id")
      .eq("id", eventId)
      .maybeSingle();
    if (eventErr || !eventRow) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipients = collectRecipientEmails(body);
    let organizerEmail: string | null = null;
    let organizerName: string | null = null;

    if (eventRow.organizer_id) {
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(
          String(eventRow.organizer_id)
        );
        const email = authData.user?.email?.trim().toLowerCase() ?? "";
        if (isValidEmail(email)) {
          organizerEmail = email;
          if (emailOrganizer && !recipients.includes(email)) {
            recipients.push(email);
          }
        }
        const { data: orgProfile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, username")
          .eq("id", eventRow.organizer_id)
          .maybeSingle();
        organizerName =
          orgProfile?.full_name?.trim() ||
          orgProfile?.username?.trim() ||
          null;
      } catch (e) {
        console.warn("organizer email lookup failed", e);
      }
    }

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
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: insErr } = await supabaseAdmin
      .from("event_media_share_links")
      .insert({
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
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const settings = await loadEmailSettings(supabaseAdmin);
    // Prefer configured public site URL so email CTAs work even when admin runs on localhost.
    const siteBase = String(settings.siteUrl || Deno.env.get("PUBLIC_SITE_URL") || "https://www.wya254.com")
      .replace(/\/$/, "");
    const galleryUrl = `${siteBase}/share/event-media/${encodeURIComponent(token)}`;
    const expiresLabel = expiresAt.toISOString().slice(0, 10);
    const eventTitle = (eventRow as { title?: string }).title ?? "Event";

    const emailsSent: string[] = [];
    const emailErrors: string[] = [];

    if (recipients.length && getResendApiKey() && settings.notificationsEnabled) {
      const message =
        note ||
        `An admin shared the media gallery for "${eventTitle}". Open the link below to review photos and clips. This link expires on ${expiresLabel}.`;

      for (const to of recipients) {
        try {
          const rendered = renderTransactionalTemplate("media-share", {
            siteUrl: settings.siteUrl,
            eventTitle,
            link: galleryUrl,
            message,
            mediaSummary: mediaSummary || undefined,
          });
          const result = await sendRawEmail({
            to,
            subject: rendered.subject,
            html: rendered.html,
            fromEmail: settings.fromEmail,
            fromName: settings.fromName,
            tags: [{ name: "template", value: "media-share" }],
          });
          await logEmailSend(supabaseAdmin, {
            to_email: to,
            template_id: "media-share",
            subject: rendered.subject,
            status: result.sent ? "sent" : result.skipped ? "skipped" : "error",
            provider_id: result.messageId,
            error: result.error ?? result.skipped ?? null,
            metadata: { event_id: eventId, gallery_url: galleryUrl },
          });
          if (result.sent) emailsSent.push(to);
          else {
            emailErrors.push(
              `${to}: ${result.error || result.skipped || "not sent"}`
            );
          }
        } catch (mailErr) {
          const msg =
            mailErr instanceof Error ? mailErr.message : "email failed";
          console.warn("media share email failed", mailErr);
          emailErrors.push(`${to}: ${msg}`);
        }
      }
    } else if (recipients.length && !getResendApiKey()) {
      emailErrors.push("Resend is not configured");
    } else if (recipients.length && !settings.notificationsEnabled) {
      emailErrors.push("Platform email notifications are disabled");
    }

    // In-app notification for registered organizer when emailed
    if (
      eventRow.organizer_id &&
      organizerEmail &&
      emailsSent.includes(organizerEmail)
    ) {
      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: eventRow.organizer_id,
          type: "media_share",
          title: "Event media shared with you",
          message: `Open the media gallery for "${eventTitle}".`,
          resource_id: eventId,
          resource_type: "event",
          link: `/share/event-media/${token}`,
          data: { event_id: eventId, gallery_url: galleryUrl },
          read: false,
        });
      } catch (e) {
        console.warn("media share in-app notify failed", e);
      }
    }

    return new Response(
      JSON.stringify({
        token,
        expires_at: expiresAt.toISOString(),
        gallery_url: galleryUrl,
        emailed: emailsSent.length > 0,
        emails_sent: emailsSent,
        email_errors: emailErrors,
        organizer: organizerEmail
          ? { email: organizerEmail, name: organizerName }
          : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("create-event-media-share", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
