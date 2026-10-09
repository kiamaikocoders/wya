/**
 * Creates in-app notifications (service role) and optionally sends OneSignal push.
 * Use this instead of direct client inserts so cross-user notifications work even when
 * RLS INSERT policy is restrictive.
 *
 * Caller must send Authorization: Bearer <user JWT>.
 * Admins may notify anyone. Other callers may notify themselves, or another user only when
 * the relationship behind the notification type exists (see authorizeRecipient).
 *
 * Body: CreateNotificationData fields + optional send_push (default true)
 * Admin inbox: { "to_admins": true, ... } fans out to every platform admin (ops types only).
 * Test mode: { "seed_test": true, "target_user_id": "<uuid>" } — admin only, inserts sample types.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendNotificationEmail } from "../_shared/resend.ts";
import { sendFcmToTokens } from "../_shared/fcm.ts";
import { isPlatformAdmin, listPlatformAdminIds } from "../_shared/admin.ts";

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
  to_admins?: boolean;
}

/** Types a user may send to someone else, each backed by a relationship check. */
const CROSS_USER_TYPES = new Set([
  "follow",
  "marketplace_buyer",
  "marketplace_seller",
  "event_update",
  "event_cancelled",
  "survey_invite",
]);

/** Types a user may send to the admin inbox. */
const ADMIN_INBOX_TYPES = new Set(["proposal_submitted", "admin_action"]);

function isInternalLink(link: string | undefined): boolean {
  if (!link) return true;
  return link.startsWith("/") && !link.startsWith("//") && !link.startsWith("/\\");
}

async function callerOrganizesEventWithTicketHolder(
  serviceClient: ReturnType<typeof createClient>,
  callerId: string,
  eventId: number,
  recipientId: string
): Promise<boolean> {
  const { data: event } = await serviceClient
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event || event.organizer_id !== callerId) return false;

  const { count } = await serviceClient
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("user_id", recipientId);
  return (count ?? 0) > 0;
}

/** Whether a non-admin caller may send this notification to recipientId. */
async function authorizeRecipient(
  serviceClient: ReturnType<typeof createClient>,
  callerId: string,
  recipientId: string,
  body: NotificationPayload
): Promise<boolean> {
  if (recipientId === callerId) return true;
  const type = body.type ?? "";
  if (!CROSS_USER_TYPES.has(type)) return false;

  if (type === "follow") {
    const { count } = await serviceClient
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", callerId)
      .eq("following_id", recipientId);
    return (count ?? 0) > 0;
  }

  if (type === "marketplace_buyer" || type === "marketplace_seller") {
    const transferId = Number(body.data?.transfer_id);
    if (!Number.isFinite(transferId)) return false;
    const { data: transfer } = await serviceClient
      .from("marketplace_transfers")
      .select("buyer_id, seller_id")
      .eq("id", transferId)
      .maybeSingle();
    if (!transfer) return false;
    const parties = [transfer.buyer_id, transfer.seller_id];
    return parties.includes(callerId) && parties.includes(recipientId);
  }

  if (type === "event_update" || type === "event_cancelled") {
    const eventId = Number(body.resource_id);
    if (!Number.isFinite(eventId)) return false;
    return callerOrganizesEventWithTicketHolder(serviceClient, callerId, eventId, recipientId);
  }

  if (type === "survey_invite") {
    const surveyId = Number(body.resource_id);
    if (!Number.isFinite(surveyId)) return false;
    const { data: survey } = await serviceClient
      .from("surveys")
      .select("event_id")
      .eq("id", surveyId)
      .maybeSingle();
    if (!survey?.event_id) return false;
    return callerOrganizesEventWithTicketHolder(serviceClient, callerId, survey.event_id, recipientId);
  }

  return false;
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

async function sendFcmPush(params: {
  user_id: string;
  title: string;
  message: string;
  link?: string;
  notification_id?: number;
  type?: string;
  siteOrigin: string | null;
  serviceClient: ReturnType<typeof createClient>;
}): Promise<{ sent: boolean; skipped?: string; error?: string; recipients?: number }> {
  const { data: profile } = await params.serviceClient
    .from("profiles")
    .select("push_notifications")
    .eq("id", params.user_id)
    .maybeSingle();

  if (profile?.push_notifications === false) {
    return { sent: false, skipped: "push_disabled" };
  }

  const { data: rows } = await params.serviceClient
    .from("push_tokens")
    .select("token")
    .eq("user_id", params.user_id);

  const tokens = (rows || []).map((row: { token: string }) => row.token).filter(Boolean);
  const result = await sendFcmToTokens({
    tokens,
    title: params.title,
    message: params.message,
    link: resolveLaunchUrl(params.link, params.siteOrigin),
    type: params.type,
    notificationId: params.notification_id,
  });

  if (result.removed.length) {
    await params.serviceClient.from("push_tokens").delete().in("token", result.removed);
  }

  if (result.skipped) return { sent: false, skipped: result.skipped };
  if (result.error) return { sent: false, error: result.error };
  return { sent: result.sent > 0, recipients: result.sent };
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
    const callerIsAdmin = await isPlatformAdmin(serviceClient, user.id);

    if (body.seed_test) {
      if (!callerIsAdmin) {
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
            const pushArgs = {
              user_id: targetUserId,
              title: sample.title!,
              message: sample.message!,
              link: sample.link,
              notification_id: inserted.id,
              type: sample.type,
              siteOrigin,
              serviceClient,
            };
            await sendOneSignalPush(pushArgs);
            await sendFcmPush(pushArgs);
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

    if ((!user_id && !body.to_admins) || !type || !title || !message) {
      return jsonResponse(
        { error: "Missing required fields: user_id, type, title, message" },
        400
      );
    }

    let recipients: string[];
    if (body.to_admins) {
      if (!callerIsAdmin && !ADMIN_INBOX_TYPES.has(type)) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      recipients = await listPlatformAdminIds(serviceClient);
    } else {
      recipients = [user_id!];
    }

    if (!callerIsAdmin) {
      if (!isInternalLink(link)) {
        return jsonResponse({ error: "Link must be a path on this site" }, 400);
      }
      if (!body.to_admins && !(await authorizeRecipient(serviceClient, user.id, user_id!, body))) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
    }

    const deliver = async (recipientId: string) => {
      const { data: inserted, error: insertError } = await serviceClient
        .from("notifications")
        .insert({
          user_id: recipientId,
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
        throw new Error(insertError.message);
      }

      let pushResult: Record<string, unknown> | null = null;
      if (sendPush && inserted?.id != null) {
        const pushArgs = {
          user_id: recipientId,
          title,
          message,
          link,
          notification_id: inserted.id,
          type,
          siteOrigin,
          serviceClient,
        };
        const [onesignal, fcm] = await Promise.all([
          sendOneSignalPush(pushArgs),
          sendFcmPush(pushArgs),
        ]);
        pushResult = { onesignal, fcm };
      }

      let emailResult: Record<string, unknown> | null = null;
      if (sendEmail && inserted?.id != null) {
        emailResult = await sendNotificationEmail({
          admin: serviceClient,
          userId: recipientId,
          type,
          title,
          message,
          link,
          data,
          sendEmail: body.send_email,
        });
      }

      return { notification_id: inserted?.id ?? null, push: pushResult, email: emailResult };
    };

    if (body.to_admins) {
      const results = await Promise.allSettled(recipients.map(deliver));
      const delivered = results.filter((r) => r.status === "fulfilled").length;
      return jsonResponse({ success: true, delivered });
    }

    let result: Awaited<ReturnType<typeof deliver>>;
    try {
      result = await deliver(recipients[0]);
    } catch (insertError) {
      const msg = insertError instanceof Error ? insertError.message : "insert failed";
      console.error("dispatch-notification insert failed:", msg);
      return jsonResponse({ error: msg }, 500);
    }

    return jsonResponse({ success: true, ...result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("dispatch-notification:", err.message);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
