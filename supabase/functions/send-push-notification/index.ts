/**
 * Supabase Edge Function: send a OneSignal web push when an in-app notification is created.
 *
 * Secrets (Supabase Dashboard → Edge Functions):
 * - ONESIGNAL_APP_ID
 * - ONESIGNAL_REST_API_KEY
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

interface PushPayload {
  user_id?: string;
  title?: string;
  message?: string;
  link?: string;
  notification_id?: number;
  type?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function resolveLaunchUrl(link: string | undefined, siteOrigin: string | null): string {
  if (!link) {
    return siteOrigin ? `${siteOrigin}/notifications` : "/notifications";
  }
  if (link.startsWith("http://") || link.startsWith("https://")) {
    return link;
  }
  const path = link.startsWith("/") ? link : `/${link}`;
  return siteOrigin ? `${siteOrigin}${path}` : path;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!oneSignalAppId || !oneSignalApiKey) {
    console.error("send-push-notification: OneSignal secrets not configured");
    return jsonResponse({ error: "Push service not configured" }, 503);
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("send-push-notification: Supabase service role not configured");
    return jsonResponse({ error: "Server misconfigured" }, 503);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as PushPayload;
    const { user_id, title, message, link, notification_id, type } = body;

    if (!user_id || !title || !message) {
      return jsonResponse({ error: "Missing required fields: user_id, title, message" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (notification_id != null) {
      const { data: row, error: rowError } = await supabase
        .from("notifications")
        .select("id, user_id, title, message, link")
        .eq("id", notification_id)
        .maybeSingle();

      if (rowError || !row) {
        return jsonResponse({ error: "Notification not found" }, 404);
      }

      if (row.user_id !== user_id) {
        return jsonResponse({ error: "Notification user mismatch" }, 403);
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("push_notifications")
      .eq("id", user_id)
      .maybeSingle();

    if (profileError) {
      console.error("send-push-notification: profile lookup failed", profileError.message);
      return jsonResponse({ error: "Failed to load user preferences" }, 500);
    }

    if (profile?.push_notifications === false) {
      return jsonResponse({ skipped: true, reason: "push_disabled" });
    }

    const siteOrigin = req.headers.get("Origin");
    const launchUrl = resolveLaunchUrl(link, siteOrigin);

    const oneSignalBody = {
      app_id: oneSignalAppId,
      target_channel: "push",
      headings: { en: title },
      contents: { en: message },
      include_aliases: {
        external_id: [user_id],
      },
      url: launchUrl,
      data: {
        link: link ?? "/notifications",
        notification_id,
        type,
      },
    };

    const pushRes = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Key ${oneSignalApiKey}`,
      },
      body: JSON.stringify(oneSignalBody),
    });

    const pushData = await pushRes.json().catch(() => ({}));

    if (!pushRes.ok) {
      console.error("send-push-notification: OneSignal API error", pushRes.status, pushData);
      return jsonResponse(
        {
          error: "Failed to send push notification",
          details: pushData?.errors ?? pushData,
        },
        502
      );
    }

    return jsonResponse({
      success: true,
      id: pushData?.id ?? null,
      recipients: pushData?.recipients ?? null,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("send-push-notification:", err.message);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
