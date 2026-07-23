/**
 * Service-role transactional email sender for cron jobs, newsletter, and
 * paths that cannot go through JWT dispatch-notification.
 *
 * Auth: Bearer SUPABASE_SERVICE_ROLE_KEY or CRON_SECRET
 *
 * Body:
 *   { action: "send", user_id, template, vars?, require_marketing? }
 *   { action: "send_raw", to, template, vars? }
 *   { action: "waitlist_or_newsletter", email, user_id?, template? }
 *   { action: "announce_email", title, message, link? }  // batch email for recent system notifs — prefer announce_fanout
 *   { action: "announce_fanout", title, message, link? }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  loadEmailSettings,
  sendRawEmail,
  sendTransactionalToUser,
  logEmailSend,
  getResendApiKey,
} from "../_shared/resend.ts";
import {
  renderTransactionalTemplate,
  type EmailTemplateId,
} from "../_shared/email-templates.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cronSecret = (Deno.env.get("CRON_SECRET") ?? "").trim();

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return token === serviceKey || (cronSecret.length > 0 && token === cronSecret);
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401);
  if (!supabaseUrl || !serviceKey) return json({ error: "Misconfigured" }, 503);

  const admin = createClient(supabaseUrl, serviceKey);
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "send");

  try {
    if (action === "send") {
      const userId = String(body.user_id ?? "");
      const template = String(body.template ?? "generic") as EmailTemplateId;
      if (!userId) return json({ error: "user_id required" }, 400);
      const result = await sendTransactionalToUser({
        admin,
        userId,
        templateId: template,
        vars: body.vars ?? {},
        requireMarketing: Boolean(body.require_marketing),
        forceEmail: Boolean(body.force_email),
        notificationType: body.notification_type,
      });
      return json({ ok: true, ...result });
    }

    if (action === "send_raw" || action === "waitlist_or_newsletter") {
      const to = String(body.to || body.email || "").trim().toLowerCase();
      if (!to.includes("@") || to.endsWith("@wya.local")) {
        return json({ error: "Valid recipient required" }, 400);
      }
      if (!getResendApiKey()) return json({ error: "Resend not configured" }, 400);

      const settings = await loadEmailSettings(admin);
      if (!settings.notificationsEnabled) {
        return json({ error: "Email disabled" }, 400);
      }

      const template = String(body.template ?? "waitlist-confirmation") as EmailTemplateId;
      const rendered = renderTransactionalTemplate(template, {
        siteUrl: settings.siteUrl,
        userName: "there",
        ...(body.vars ?? {}),
        message: body.message,
        title: body.title,
      });

      const result = await sendRawEmail({
        to,
        subject: rendered.subject,
        html: rendered.html,
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        tags: [{ name: "template", value: template.slice(0, 40) }],
      });

      await logEmailSend(admin, {
        user_id: body.user_id ?? null,
        to_email: to,
        template_id: template,
        subject: rendered.subject,
        status: result.sent ? "sent" : "error",
        provider_id: result.messageId,
        error: result.error ?? null,
      });

      return json({ ok: result.sent, ...result });
    }

    if (action === "announce_fanout") {
      const title = String(body.title ?? "Announcement");
      const message = String(body.message ?? "");
      const link = body.link ? String(body.link) : "/home";
      const limit = Math.min(Number(body.limit ?? 500), 2000);

      const { data: profiles, error } = await admin
        .from("profiles")
        .select("id")
        .eq("email_notifications", true)
        .or("is_ghost.is.null,is_ghost.eq.false")
        .limit(limit);

      if (error) throw error;

      let sent = 0;
      let skipped = 0;
      for (const row of profiles ?? []) {
        const result = await sendTransactionalToUser({
          admin,
          userId: row.id,
          templateId: "announcement",
          notificationType: "announcement",
          vars: { title, message, link },
        });
        if (result.sent) sent += 1;
        else skipped += 1;
      }
      return json({ ok: true, sent, skipped, candidates: profiles?.length ?? 0 });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("send-transactional-email:", message);
    return json({ error: message }, 500);
  }
});
