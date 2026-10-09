/**
 * Supabase Edge Function: send a push for an existing in-app notification.
 *
 * Auth: Bearer user JWT (recipient of the notification, or a platform admin) or service role key.
 * Body: { notification_id } — title, message, and link are taken from the stored notification.
 *
 * Secrets (Supabase Dashboard → Edge Functions):
 * - ONESIGNAL_APP_ID
 * - ONESIGNAL_REST_API_KEY
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isFcmConfigured, sendFcmToTokens } from "../_shared/fcm.ts";
import { isPlatformAdmin } from "../_shared/admin.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
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

  const fcmReady = isFcmConfigured();
  if ((!oneSignalAppId || !oneSignalApiKey) && !fcmReady) {
    console.error("send-push-notification: no push provider configured");
    return jsonResponse({ error: "Push service not configured" }, 503);
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("send-push-notification: Supabase service role not configured");
    return jsonResponse({ error: "Server misconfigured" }, 503);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!bearer) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as PushPayload;
    const { notification_id, type } = body;

    if (notification_id == null) {
      return jsonResponse({ error: "Missing required field: notification_id" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let callerId: string | null = null;
    if (bearer !== supabaseServiceKey) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey);
      const { data: authData, error: authError } = await authClient.auth.getUser(bearer);
      if (authError || !authData.user) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      callerId = authData.user.id;
    }

    const { data: row, error: rowError } = await supabase
      .from("notifications")
      .select("id, user_id, title, message, link")
      .eq("id", notification_id)
      .maybeSingle();

    if (rowError || !row) {
      return jsonResponse({ error: "Notification not found" }, 404);
    }

    if (callerId && row.user_id !== callerId && !(await isPlatformAdmin(supabase, callerId))) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const user_id: string = row.user_id;
    const title: string = row.title;
    const message: string = row.message;
    const link: string | undefined = row.link ?? undefined;

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

    let onesignal: Record<string, unknown> | null = null;
    if (oneSignalAppId && oneSignalApiKey) {
      const pushRes = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Key ${oneSignalApiKey}`,
        },
        body: JSON.stringify({
          app_id: oneSignalAppId,
          target_channel: "push",
          headings: { en: title },
          contents: { en: message },
          include_aliases: { external_id: [user_id] },
          url: launchUrl,
          data: {
            link: link ?? "/notifications",
            notification_id,
            type,
          },
        }),
      });
      const pushData = await pushRes.json().catch(() => ({}));
      if (!pushRes.ok) {
        console.error("send-push-notification: OneSignal API error", pushRes.status, pushData);
        onesignal = { sent: false, error: "push_failed", details: pushData?.errors ?? pushData };
      } else {
        onesignal = { sent: true, id: pushData?.id ?? null, recipients: pushData?.recipients ?? null };
      }
    }

    let fcm: Record<string, unknown> | null = null;
    if (fcmReady) {
      const { data: tokenRows } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", user_id);
      const tokens = (tokenRows || []).map((row: { token: string }) => row.token).filter(Boolean);
      const fcmResult = await sendFcmToTokens({
        tokens,
        title,
        message,
        link: launchUrl,
        type,
        notificationId: notification_id,
      });
      if (fcmResult.removed.length) {
        await supabase.from("push_tokens").delete().in("token", fcmResult.removed);
      }
      fcm = fcmResult;
    }

    const delivered = Boolean(
      (onesignal && onesignal.sent) || (fcm && typeof fcm.sent === "number" && fcm.sent > 0),
    );
    if (!delivered && onesignal?.error && !fcmReady) {
      return jsonResponse({ error: "Failed to send push notification", details: onesignal }, 502);
    }

    return jsonResponse({
      success: delivered || Boolean(fcm?.skipped === "no_tokens"),
      onesignal,
      fcm,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("send-push-notification:", err.message);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
