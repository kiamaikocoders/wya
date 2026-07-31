/**
 * Broadcast delivery fan-out: email (Resend) + push (OneSignal).
 * verify_jwt = false — custom admin JWT check (username === 'admin').
 *
 * POST body:
 *   {
 *     title, message, link?,
 *     channel: 'email' | 'in_app' | 'both',
 *     audience: 'all' | 'attendees' | 'organizers' | 'admins' | 'location',
 *     locations?: string[],
 *     limit?: number
 *   }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function locationMatches(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack || !needle) return false;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  return h.includes(n) || n.includes(h);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getResendApiKey(): string {
  return (Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("EMAIL_API_KEY") ?? "").trim();
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: "Unauthorized", status: 401 as const };

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return { error: "Server configuration error", status: 500 as const };
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const authClient = createClient(supabaseUrl, anonKey);
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);
  if (userError || !user) return { error: "Unauthorized", status: 401 as const };

  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.username !== "admin") {
    return { error: "Forbidden", status: 403 as const };
  }

  return { admin };
}

async function loadSiteSettings(admin: ReturnType<typeof createClient>) {
  const { data } = await admin
    .from("system_settings")
    .select("key, value")
    .in("key", [
      "email.notifications_enabled",
      "email.from_email",
      "email.from_name",
      "platform.site_url",
      "platform.site_name",
    ]);
  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    let v = row.value;
    if (typeof v === "string") {
      try {
        v = JSON.parse(v);
      } catch {
        /* keep */
      }
    }
    map[row.key] = v;
  }
  return {
    notificationsEnabled: map["email.notifications_enabled"] !== false,
    fromEmail: String(
      Deno.env.get("EMAIL_FROM")?.trim() || map["email.from_email"] || "team@wya254.com"
    ),
    fromName: String(
      Deno.env.get("EMAIL_FROM_NAME")?.trim() ||
        map["email.from_name"] ||
        map["platform.site_name"] ||
        "WYA"
    ),
    siteUrl: String(map["platform.site_url"] || "https://www.wya254.com"),
  };
}

async function resolveRecipients(
  admin: ReturnType<typeof createClient>,
  opts: { audience: string; locations: string[]; limit: number }
): Promise<string[]> {
  const { audience, locations, limit } = opts;

  if (audience === "admins") {
    const { data } = await admin.from("profiles").select("id").eq("username", "admin");
    return (data ?? []).map((r) => r.id).slice(0, limit);
  }

  if (audience === "organizers") {
    const { data } = await admin
      .from("events")
      .select("organizer_id")
      .not("organizer_id", "is", null)
      .limit(5000);
    const ids = [
      ...new Set(
        (data ?? [])
          .map((r) => r.organizer_id as string | null)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    return ids.slice(0, limit);
  }

  if (audience === "location") {
    const [{ data: profiles }, { data: onboarding }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, location")
        .or("is_ghost.is.null,is_ghost.eq.false")
        .limit(5000),
      admin
        .from("user_onboarding_preferences")
        .select("user_id, home_base, preferred_cities")
        .limit(5000),
    ]);
    const byUser = new Map(
      (onboarding ?? []).map((o) => [
        o.user_id as string,
        o as { home_base: string | null; preferred_cities: string[] | null },
      ])
    );
    const matched: string[] = [];
    for (const p of profiles ?? []) {
      const pref = byUser.get(p.id);
      const cities = Array.isArray(pref?.preferred_cities) ? pref!.preferred_cities! : [];
      const hit = locations.some(
        (loc) =>
          locationMatches(p.location, loc) ||
          locationMatches(pref?.home_base, loc) ||
          cities.some((c) => locationMatches(c, loc))
      );
      if (hit) matched.push(p.id);
      if (matched.length >= limit) break;
    }
    return matched;
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id, username")
    .or("is_ghost.is.null,is_ghost.eq.false")
    .limit(limit * 2);
  if (error) throw error;
  return (data ?? [])
    .filter((r) => (audience === "attendees" ? r.username !== "admin" : true))
    .map((r) => r.id)
    .slice(0, limit);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const gate = await requireAdmin(req);
  if ("error" in gate && gate.error) {
    return json({ error: gate.error }, gate.status);
  }
  const { admin } = gate as { admin: ReturnType<typeof createClient> };

  try {
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title ?? "Announcement").trim() || "Announcement";
    const message = String(body?.message ?? "").trim();
    const link = String(body?.link ?? "/home");
    const channel = String(body?.channel ?? "both");
    const audience = String(body?.audience ?? "all");
    const locations = Array.isArray(body?.locations)
      ? body.locations.map((l: unknown) => String(l).trim()).filter(Boolean)
      : [];
    const sendEmail = channel === "email" || channel === "both";
    const sendPush = channel === "in_app" || channel === "both";
    const limit = Math.min(Number(body?.limit ?? 500), 2000);

    if (audience === "location" && locations.length === 0) {
      return json({ error: "locations required for location audience" }, 400);
    }

    const recipientIds = await resolveRecipients(admin, { audience, locations, limit });
    const settings = await loadSiteSettings(admin);
    const resendKey = getResendApiKey();
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
    const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

    let emailed = 0;
    let emailSkipped = 0;
    let pushed = 0;
    let pushSkipped = 0;
    const errors: string[] = [];

    for (const userId of recipientIds) {
      if (sendEmail) {
        if (!settings.notificationsEnabled || !resendKey) {
          emailSkipped += 1;
        } else {
          try {
            const { data: profile } = await admin
              .from("profiles")
              .select("email_notifications, is_ghost, notification_email_prefs, full_name, username")
              .eq("id", userId)
              .maybeSingle();
            if (profile?.is_ghost || profile?.email_notifications === false) {
              emailSkipped += 1;
            } else {
              const prefs = (profile?.notification_email_prefs ?? {}) as Record<string, boolean>;
              if (prefs.announcement === false) {
                emailSkipped += 1;
              } else {
                const { data: authData } = await admin.auth.admin.getUserById(userId);
                const to = authData.user?.email?.trim() ?? "";
                if (!to.includes("@") || to.endsWith("@wya.local")) {
                  emailSkipped += 1;
                } else {
                  const launch = link.startsWith("http")
                    ? link
                    : `${settings.siteUrl}${link.startsWith("/") ? link : `/${link}`}`;
                  const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#f6f8fa;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#ff6b35;">ANNOUNCEMENT</p>
    <h1 style="margin:0 0 12px;font-size:26px;color:#1f2328;">${escapeHtml(title)}</h1>
    <p style="color:#656d76;line-height:1.5;white-space:pre-wrap;">${escapeHtml(message)}</p>
    <p style="margin-top:20px;"><a href="${escapeHtml(launch)}" style="background:#ff6b35;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700;">Open WYA</a></p>
  </div></body></html>`;
                  const res = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${resendKey}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      from: `${settings.fromName} <${settings.fromEmail}>`,
                      to: [to],
                      subject: title,
                      html,
                    }),
                  });
                  const payload = await res.json().catch(() => ({}));
                  if (res.ok) {
                    emailed += 1;
                    try {
                      await admin.from("email_send_log").insert({
                        user_id: userId,
                        to_email: to,
                        template_id: "announcement",
                        subject: title,
                        status: "sent",
                        provider_id: payload?.id ?? null,
                      });
                    } catch {
                      /* optional */
                    }
                  } else {
                    emailSkipped += 1;
                    errors.push(`email:${userId}:${payload?.message || res.status}`);
                  }
                }
              }
            }
          } catch (e) {
            emailSkipped += 1;
            errors.push(`email:${userId}:${e instanceof Error ? e.message : "failed"}`);
          }
        }
      }

      if (sendPush) {
        if (!oneSignalAppId || !oneSignalApiKey) {
          pushSkipped += 1;
        } else {
          try {
            const { data: profile } = await admin
              .from("profiles")
              .select("push_notifications")
              .eq("id", userId)
              .maybeSingle();
            if (profile?.push_notifications === false) {
              pushSkipped += 1;
            } else {
              const launch = link.startsWith("http")
                ? link
                : `${settings.siteUrl}${link.startsWith("/") ? link : `/${link}`}`;
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
                  contents: { en: message.slice(0, 240) || title },
                  include_aliases: { external_id: [userId] },
                  url: launch,
                  data: { link, type: "announcement" },
                }),
              });
              if (pushRes.ok) pushed += 1;
              else {
                pushSkipped += 1;
                const details = await pushRes.json().catch(() => ({}));
                errors.push(
                  `push:${userId}:${JSON.stringify(details?.errors ?? pushRes.status)}`
                );
              }
            }
          } catch (e) {
            pushSkipped += 1;
            errors.push(`push:${userId}:${e instanceof Error ? e.message : "failed"}`);
          }
        }
      }
    }

    return json({
      success: true,
      recipients: recipientIds.length,
      emailed,
      email_skipped: emailSkipped,
      pushed,
      push_skipped: pushSkipped,
      send_email: sendEmail,
      send_push: sendPush,
      audience,
      locations,
      errors: errors.slice(0, 20),
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error("Unknown error");
    console.error("announce-delivery:", err.message);
    return json({ error: "Internal server error" }, 500);
  }
});
