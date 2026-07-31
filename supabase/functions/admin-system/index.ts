/**
 * Admin System ops — health probes + Resend test send.
 * Auth: Bearer JWT of profiles.username === 'admin'.
 *
 * POST body:
 *   { action: "health" }
 *   { action: "email_status" }
 *   { action: "test_email", to?: string }
 *
 * Secrets: RESEND_API_KEY (required for test send). Optional EMAIL_FROM / EMAIL_FROM_NAME overrides.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getResendApiKey, loadEmailSettings as loadSharedEmailSettings, sendRawEmail, logEmailSend } from "../_shared/resend.ts";
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

function unwrapSetting(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return { error: "Server configuration error", status: 500 as const };
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const authClient = createClient(supabaseUrl, anonKey);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.username !== "admin") {
    return { error: "Forbidden", status: 403 as const };
  }

  return { admin, user };
}

async function loadEmailSettings(admin: ReturnType<typeof createClient>) {
  const keys = [
    "email.provider",
    "email.smtp_host",
    "email.smtp_port",
    "email.smtp_user",
    "email.from_email",
    "email.from_name",
    "email.notifications_enabled",
    "platform.site_name",
    "platform.site_url",
  ];
  const { data } = await admin.from("system_settings").select("key, value").in("key", keys);
  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    map[row.key] = unwrapSetting(row.value);
  }
  return map;
}

function formatUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function locationMatches(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack || !needle) return false;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  return h.includes(n) || n.includes(h);
}

/**
 * Resolve broadcast recipients with the same audience rules as admin_publish_announcement.
 */
async function resolveAnnouncementRecipients(
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
        o as {
          home_base: string | null;
          preferred_cities: string[] | null;
        },
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

  // all | attendees (attendees ≈ everyone except username admin)
  let q = admin
    .from("profiles")
    .select("id, username")
    .or("is_ghost.is.null,is_ghost.eq.false")
    .limit(limit * 2);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []).filter((r) =>
    audience === "attendees" ? r.username !== "admin" : true
  );
  return rows.map((r) => r.id).slice(0, limit);
}

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = corsHeadersFor(getAllowedOrigin(requestOrigin));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const gate = await requireAdmin(req);
    if ("error" in gate && gate.error) {
      return new Response(JSON.stringify({ error: gate.error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: gate.status,
      });
    }
    const { admin, user } = gate as {
      admin: ReturnType<typeof createClient>;
      user: { id: string; email?: string };
    };

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "health");

    if (action === "health") {
      const started = Date.now();
      const dbProbe = await admin.from("profiles").select("id", { count: "exact", head: true });
      const dbMs = Date.now() - started;
      const database = dbProbe.error ? "Error" : dbMs > 1500 ? "Degraded" : "Healthy";

      const authStarted = Date.now();
      const { data: userData, error: userErr } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      const authMs = Date.now() - authStarted;
      const authStatus = userErr ? "Error" : userData ? "Healthy" : "Degraded";

      let storage: "Healthy" | "Degraded" | "Error" = "Healthy";
      let storageMs = 0;
      try {
        const s0 = Date.now();
        const { error: storageErr } = await admin.storage.listBuckets();
        storageMs = Date.now() - s0;
        if (storageErr) storage = "Error";
        else if (storageMs > 1500) storage = "Degraded";
      } catch {
        storage = "Error";
      }

      const resendKey = (Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("EMAIL_API_KEY") ?? "").trim();
      // Auth uses Resend SMTP (configured in Supabase Auth). Edge key enables platform sends.
      const email = resendKey ? "Healthy" : "Auth SMTP only";

      const onesignal =
        Deno.env.get("ONESIGNAL_APP_ID") && Deno.env.get("ONESIGNAL_REST_API_KEY")
          ? "Healthy"
          : "Not configured";

      const marketplaceTables = await admin
        .from("marketplace_listings")
        .select("id", { count: "exact", head: true });
      const marketplace = marketplaceTables.error ? "Not migrated" : "Healthy";

      const uptimeSec = Math.floor(performance.now() / 1000);

      return new Response(
        JSON.stringify({
          health: {
            database,
            auth: authStatus,
            storage,
            email,
            push: onesignal,
            marketplace,
          },
          metrics: {
            dbLatencyMs: dbMs,
            authLatencyMs: authMs,
            storageLatencyMs: storageMs,
            uptimeLabel: formatUptime(uptimeSec),
            runtime: "deno-edge",
          },
          serverStatus: [database, authStatus, storage].every((s) => s === "Healthy")
            ? "All systems operational"
            : "Attention needed",
          resendConfigured: Boolean(resendKey),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "email_status") {
      const settings = await loadEmailSettings(admin);
      const resendKey = (Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("EMAIL_API_KEY") ?? "").trim();
      const source: "env" | "none" = resendKey ? "env" : "none";
      return new Response(
        JSON.stringify({
          provider: String(settings["email.provider"] ?? "resend"),
          smtpHost: String(settings["email.smtp_host"] ?? "smtp.resend.com"),
          smtpPort: Number(settings["email.smtp_port"] ?? 465),
          smtpUser: String(settings["email.smtp_user"] ?? "resend"),
          fromEmail: String(
            Deno.env.get("EMAIL_FROM")?.trim() ||
              settings["email.from_email"] ||
              "team@wya254.com"
          ),
          fromName: String(
            Deno.env.get("EMAIL_FROM_NAME")?.trim() ||
              settings["email.from_name"] ||
              settings["platform.site_name"] ||
              "WYA"
          ),
          notificationsEnabled: Boolean(settings["email.notifications_enabled"] ?? true),
          smtpPassSet: Boolean(resendKey),
          smtpPassSource: source,
          siteName: String(settings["platform.site_name"] ?? "WYA"),
          siteUrl: String(settings["platform.site_url"] ?? "https://www.wya254.com"),
          note:
            source === "env"
              ? "RESEND_API_KEY is set on the Edge Function environment."
              : "Auth SMTP already uses Resend. Add RESEND_API_KEY as a Supabase secret for platform test/transactional sends, then redeploy admin-system.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "test_email") {
      const shared = await loadSharedEmailSettings(admin);
      if (!shared.notificationsEnabled) {
        return new Response(
          JSON.stringify({ error: "Email notifications are disabled in System settings" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (!getResendApiKey()) {
        return new Response(
          JSON.stringify({
            error:
              "RESEND_API_KEY is not set on this project. Auth already uses Resend SMTP — add the same API key as a Supabase secret, then redeploy admin-system.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const to = String(body?.to || user.email || "").trim();
      if (!to.includes("@")) {
        return new Response(JSON.stringify({ error: "Valid recipient email required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const rendered = renderTransactionalTemplate("admin-system-test", {
        siteUrl: shared.siteUrl,
        link: `${shared.siteUrl}/admin/communications`,
        title: `${shared.fromName} — System test email`,
        message: `This is a test email from ${shared.fromName}. If you received it, email delivery is working. Sent at ${new Date().toISOString()}.`,
        userName: "there",
      });

      const result = await sendRawEmail({
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: `This is a test email from ${shared.fromName} admin System page via Resend.\nFrom: ${shared.fromEmail}\nSent at ${new Date().toISOString()}`,
        fromEmail: shared.fromEmail,
        fromName: shared.fromName,
        tags: [{ name: "template", value: "admin-system-test" }],
      });

      if (!result.sent) {
        return new Response(
          JSON.stringify({ error: result.error || result.skipped || "Send failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
        );
      }

      await logEmailSend(admin, {
        user_id: user.id,
        to_email: to,
        template_id: "admin-system-test",
        subject: rendered.subject,
        status: "sent",
        provider_id: result.messageId,
      });

      try {
        await admin.rpc("admin_audit", {
          p_action: "system.email.test",
          p_entity_type: "email",
          p_entity_id: to,
          p_metadata: { from: shared.fromEmail, provider: "resend", messageId: result.messageId },
        });
      } catch {
        // audit optional if RPC missing
      }

      return new Response(
        JSON.stringify({
          success: true,
          messageId: result.messageId ?? null,
          from: shared.fromEmail,
          to,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "announce_email_fanout" || action === "announce_delivery_fanout") {
      const title = String(body?.title ?? "Announcement");
      const message = String(body?.message ?? "");
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
        return new Response(
          JSON.stringify({ error: "locations required for location audience" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const recipientIds = await resolveAnnouncementRecipients(admin, {
        audience,
        locations,
        limit,
      });

      const { sendTransactionalToUser } = await import("../_shared/resend.ts");
      let emailed = 0;
      let emailSkipped = 0;
      let pushed = 0;
      let pushSkipped = 0;
      const errors: string[] = [];

      const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
      const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";
      const siteUrl =
        (await loadSharedEmailSettings(admin)).siteUrl || "https://www.wya254.com";

      for (const userId of recipientIds) {
        if (sendEmail) {
          try {
            const result = await sendTransactionalToUser({
              admin,
              userId,
              templateId: "announcement",
              notificationType: "announcement",
              vars: { title, message, link },
            });
            if (result.sent) emailed += 1;
            else emailSkipped += 1;
          } catch (e) {
            emailSkipped += 1;
            errors.push(`email:${userId}:${e instanceof Error ? e.message : "failed"}`);
          }
        }

        if (sendPush) {
          if (!oneSignalAppId || !oneSignalApiKey) {
            pushSkipped += 1;
            continue;
          }
          try {
            const { data: profile } = await admin
              .from("profiles")
              .select("push_notifications")
              .eq("id", userId)
              .maybeSingle();
            if (profile?.push_notifications === false) {
              pushSkipped += 1;
              continue;
            }
            const launch = link.startsWith("http")
              ? link
              : `${siteUrl}${link.startsWith("/") ? link : `/${link}`}`;
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
                contents: { en: message.slice(0, 240) },
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
          } catch (e) {
            pushSkipped += 1;
            errors.push(`push:${userId}:${e instanceof Error ? e.message : "failed"}`);
          }
        }
      }

      return new Response(
        JSON.stringify({
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
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "test_template") {
      const templateId = String(body?.template_id ?? "").trim();
      const to = String(body?.to || user.email || "").trim();
      if (!templateId) {
        return new Response(JSON.stringify({ error: "template_id required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      if (!to.includes("@")) {
        return new Response(JSON.stringify({ error: "Valid recipient email required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const { data: tpl, error: tplErr } = await admin
        .from("communication_templates")
        .select("id, subject, html, name")
        .eq("id", templateId)
        .maybeSingle();

      if (tplErr || !tpl) {
        return new Response(JSON.stringify({ error: "Template not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      const shared = await loadSharedEmailSettings(admin);
      if (!shared.notificationsEnabled) {
        return new Response(JSON.stringify({ error: "Email notifications disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      if (!getResendApiKey()) {
        return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const site = shared.siteUrl;
      const sampleUrl = `${site}/auth/confirm?token=preview`;
      let html = String(tpl.html);
      const replacements: Array<[RegExp, string]> = [
        [/\{\{\s*\.ConfirmationURL\s*\}\}/g, sampleUrl],
        [/\{\{\s*\.SiteURL\s*\}\}/g, site],
        [/\{\{\s*\.Email\s*\}\}/g, to],
        [/\{\{\s*siteUrl\s*\}\}/g, site],
        [/\{\{\s*link\s*\}\}/g, `${site}/events`],
        [/\{\{\s*eventTitle\s*\}\}/g, "Sample Event"],
        [/\{\{\s*userName\s*\}\}/g, "there"],
        [/\{\{\s*whenLabel\s*\}\}/g, "is tomorrow"],
        [/\{\{\s*eventWhen\s*\}\}/g, "Sat · 9:00 PM"],
        [/\{\{\s*eventWhere\s*\}\}/g, "Nairobi"],
        [/\{\{\s*eventArea\s*\}\}/g, "Westlands"],
        [/\{\{\s*ticketSummary\s*\}\}/g, "2 × General Admission"],
        [/\{\{\s*amountPaid\s*\}\}/g, "KES 3,000"],
        [/\{\{\s*orderId\s*\}\}/g, "WYA-TEST"],
        [/\{\{\s*title\s*\}\}/g, String(tpl.subject)],
        [/\{\{\s*message\s*\}\}/g, "This is a WYA template test send."],
        [/\{\{\s*topicLabel\s*\}\}/g, "Platform update"],
        [/\{\{\s*wasLabel\s*\}\}/g, "Fri 8:00 PM"],
        [/\{\{\s*nowLabel\s*\}\}/g, "Sat 7:30 PM"],
        [/\{\{\s*refundLabel\s*\}\}/g, "M-Pesa · 3–5 business days"],
        [/\{\{\s*reasonLabel\s*\}\}/g, "Needs more detail"],
        [/\{\{\s*transferType\s*\}\}/g, "Gift claim"],
        [/\{\{\s*listingLabel\s*\}\}/g, "2× GA"],
        [/\{\{\s*payoutLabel\s*\}\}/g, "Pending · M-Pesa"],
        [/\{\{\s*unreadLabel\s*\}\}/g, "3 conversations"],
        [/\{\{\s*latestLabel\s*\}\}/g, "New message"],
        [/\{\{\s*mediaSummary\s*\}\}/g, "24 photos"],
        [/\{\{\s*requestId\s*\}\}/g, "DSAR-TEST"],
        [/\{\{\s*expiresLabel\s*\}\}/g, "7 days"],
        [/\{\{\s*completedAt\s*\}\}/g, new Date().toISOString()],
        [/\{\{\s*nearbyLabel\s*\}\}/g, "3 events this weekend"],
        [/\{\{\s*trendingLabel\s*\}\}/g, "Rooftop parties"],
        [/\{\{\s*hotLabel\s*\}\}/g, "Club Lights Saturday"],
        [/\{\{\s*newLabel\s*\}\}/g, "Food Night Market"],
      ];
      html = replacements.reduce((acc, [re, v]) => acc.replace(re, v), html);

      const result = await sendRawEmail({
        to,
        subject: `[TEST] ${tpl.subject}`,
        html,
        fromEmail: shared.fromEmail,
        fromName: shared.fromName,
        tags: [
          { name: "template", value: templateId.slice(0, 40) },
          { name: "type", value: "template-test" },
        ],
      });

      if (!result.sent) {
        return new Response(
          JSON.stringify({ error: result.error || result.skipped || "Send failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
        );
      }

      await logEmailSend(admin, {
        user_id: user.id,
        to_email: to,
        template_id: templateId,
        subject: `[TEST] ${tpl.subject}`,
        status: "sent",
        provider_id: result.messageId,
        metadata: { test: true },
      });

      return new Response(
        JSON.stringify({ success: true, messageId: result.messageId, to }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "System request failed";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
