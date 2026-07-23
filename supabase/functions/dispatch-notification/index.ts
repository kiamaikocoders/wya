/**
 * Creates in-app notifications (service role) and optionally sends OneSignal push.
 * Use this instead of direct client inserts so cross-user notifications work even when
 * RLS INSERT policy is restrictive.
 *
 * Caller must send Authorization: Bearer <user JWT>.
 *
 * Body: CreateNotificationData fields + optional send_push (default true)
 * Test mode: { "seed_test": true, "target_user_id": "<uuid>" } — admin only, inserts sample types.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendNotificationEmail } from "../_shared/resend.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

interface NotificationPayload {
  user_id?: string;
  type?: string;
  title?: string;
  message?: string;
  resource_id?: number;
  resource_type?: string;
  resource_uuid?: string;
  link?: string;
  data?: Record<string, unknown> | null;
  send_push?: boolean;
  /** Default true for transactional types; social types need prefs opt-in or explicit true */
  send_email?: boolean;
  seed_test?: boolean;
  target_user_id?: string;
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

async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Missing authorization" };
  }

  const jwt = authHeader.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await authClient.auth.getUser(jwt);
  if (error || !data.user) {
    return { user: null, error: error?.message ?? "Invalid session" };
  }
  return { user: data.user, error: null };
}

async function isAdminUser(userId: string, serviceClient: ReturnType<typeof createClient>): Promise<boolean> {
  const { data } = await serviceClient
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  return data?.username === "admin";
}

async function sendOneSignalPush(params: {
  user_id: string;
  title: string;
  message: string;
  link?: string;
  notification_id?: number;
  type?: string;
  siteOrigin: string | null;
  serviceClient: ReturnType<typeof createClient>;
}): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  if (!oneSignalAppId || !oneSignalApiKey) {
    return { sent: false, skipped: "onesignal_not_configured" };
  }

  const { data: profile } = await params.serviceClient
    .from("profiles")
    .select("push_notifications")
    .eq("id", params.user_id)
    .maybeSingle();

  if (profile?.push_notifications === false) {
    return { sent: false, skipped: "push_disabled" };
  }

  const launchUrl = resolveLaunchUrl(params.link, params.siteOrigin);
  const pushRes = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Key ${oneSignalApiKey}`,
    },
    body: JSON.stringify({
      app_id: oneSignalAppId,
      target_channel: "push",
      headings: { en: params.title },
      contents: { en: params.message },
      include_aliases: { external_id: [params.user_id] },
      url: launchUrl,
      data: {
        link: params.link ?? "/notifications",
        notification_id: params.notification_id,
        type: params.type,
      },
    }),
  });

  const pushData = await pushRes.json().catch(() => ({}));
  if (!pushRes.ok) {
    console.error("dispatch-notification: OneSignal error", pushRes.status, pushData);
    return { sent: false, error: "push_failed" };
  }

  return { sent: true };
}

const TEST_NOTIFICATIONS: Array<Omit<NotificationPayload, "user_id">> = [
  {
    type: "follow",
    title: "New Follower",
    message: "Someone started following you",
    link: "/notifications",
    resource_type: "user",
  },
  {
    type: "new_event",
    title: "New Event Near You",
    message: "A new event was posted in Nairobi",
    link: "/events",
    resource_type: "event",
  },
  {
    type: "announcement",
    title: "Platform Announcement",
    message: "WYA has new features — check them out!",
    link: "/home",
  },
  {
    type: "system",
    title: "System Notice",
    message: "This is a test system notification",
    link: "/notifications",
  },
  {
    type: "message",
    title: "New Message",
    message: "You have a new chat message",
    link: "/chat",
    resource_type: "conversation",
  },
  {
    type: "ticket",
    title: "Ticket Update",
    message: "Your event ticket is ready",
    link: "/tickets",
    resource_type: "ticket",
  },
];

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: "Server misconfigured" }, 503);
  }

  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return jsonResponse({ error: authError ?? "Unauthorized" }, 401);
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const body = (await req.json().catch(() => ({}))) as NotificationPayload;
  const siteOrigin = req.headers.get("Origin");
  const sendPush = body.send_push !== false;
  const sendEmail = body.send_email !== false;

  try {
    if (body.seed_test) {
      const admin = await isAdminUser(user.id, serviceClient);
      if (!admin) {
        return jsonResponse({ error: "Admin only" }, 403);
      }

      const targetUserId = body.target_user_id ?? user.id;
      const created: number[] = [];

      for (const sample of TEST_NOTIFICATIONS) {
        const { data: inserted, error: insertError } = await serviceClient
          .from("notifications")
          .insert({
            user_id: targetUserId,
            type: sample.type,
            title: sample.title,
            message: sample.message,
            link: sample.link,
            resource_type: sample.resource_type,
            read: false,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("dispatch-notification seed insert failed:", insertError.message);
          continue;
        }

        if (inserted?.id != null) {
          created.push(inserted.id);
          if (sendPush) {
            await sendOneSignalPush({
              user_id: targetUserId,
              title: sample.title!,
              message: sample.message!,
              link: sample.link,
              notification_id: inserted.id,
              type: sample.type,
              siteOrigin,
              serviceClient,
            });
          }
        }
      }

      return jsonResponse({
        success: true,
        seeded: created.length,
        notification_ids: created,
        target_user_id: targetUserId,
      });
    }

    const { user_id, type, title, message, resource_id, resource_type, resource_uuid, link, data } =
      body;

    if (!user_id || !type || !title || !message) {
      return jsonResponse(
        { error: "Missing required fields: user_id, type, title, message" },
        400
      );
    }

    const { data: inserted, error: insertError } = await serviceClient
      .from("notifications")
      .insert({
        user_id,
        type,
        title,
        message,
        resource_id,
        resource_type,
        resource_uuid,
        link,
        data,
        read: false,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("dispatch-notification insert failed:", insertError.message);
      return jsonResponse({ error: insertError.message }, 500);
    }

    let pushResult: Record<string, unknown> | null = null;
    if (sendPush && inserted?.id != null) {
      const result = await sendOneSignalPush({
        user_id,
        title,
        message,
        link,
        notification_id: inserted.id,
        type,
        siteOrigin,
        serviceClient,
      });
      pushResult = result;
    }

    let emailResult: Record<string, unknown> | null = null;
    if (sendEmail && inserted?.id != null) {
      const result = await sendNotificationEmail({
        admin: serviceClient,
        userId: user_id,
        type,
        title,
        message,
        link,
        data,
        sendEmail: body.send_email,
      });
      emailResult = result;
    }

    return jsonResponse({
      success: true,
      notification_id: inserted?.id ?? null,
      push: pushResult,
      email: emailResult,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("dispatch-notification:", err.message);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
