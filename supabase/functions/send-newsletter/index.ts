/**
 * Cron / admin: newsletter to marketing_consent users + newsletter_subscribers.
 * Auth: Bearer CRON_SECRET or service role.
 * Body optional: { title?, message?, link? }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  loadEmailSettings,
  sendRawEmail,
  logEmailSend,
  sendTransactionalToUser,
} from "../_shared/resend.ts";
import { renderTransactionalTemplate } from "../_shared/email-templates.ts";

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = (Deno.env.get("CRON_SECRET") ?? "").trim();
  return token === serviceKey || (cronSecret.length > 0 && token === cronSecret);
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  const body = await req.json().catch(() => ({}));
  const settings = await loadEmailSettings(admin);

  const { data: upcoming } = await admin
    .from("events")
    .select("id, title, date, location")
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: true })
    .limit(10);

  const listHtml = (upcoming ?? [])
    .map((e) => `<li style="margin:0 0 8px 0;"><strong style="color:#fff;">${e.title}</strong> — ${e.date}</li>`)
    .join("");

  const title = String(body.title ?? "This week on WYA");
  const message =
    String(body.message ?? "") ||
    (listHtml
      ? `Fresh events across Kenya:<ul style="color:#BCAB9A;padding-left:18px;">${listHtml}</ul>`
      : "Discover events happening near you on WYA.");
  const link = String(body.link ?? `${settings.siteUrl}/events`);

  let sent = 0;

  const { data: consented } = await admin
    .from("profiles")
    .select("id")
    .eq("marketing_consent", true)
    .eq("email_notifications", true)
    .or("is_ghost.is.null,is_ghost.eq.false")
    .limit(1000);

  for (const row of consented ?? []) {
    const result = await sendTransactionalToUser({
      admin,
      userId: row.id,
      templateId: "newsletter",
      notificationType: "newsletter",
      requireMarketing: true,
      vars: { title, message, link },
    });
    if (result.sent) sent += 1;
  }

  const { data: subscribers } = await admin
    .from("newsletter_subscribers")
    .select("email, user_id")
    .is("unsubscribed_at", null)
    .limit(1000);

  const rendered = renderTransactionalTemplate("newsletter", {
    siteUrl: settings.siteUrl,
    title,
    message,
    link,
  });

  for (const sub of subscribers ?? []) {
    if (sub.user_id) continue; // already covered via profiles
    if (!sub.email || sub.email.endsWith("@wya.local")) continue;
    const result = await sendRawEmail({
      to: sub.email,
      subject: rendered.subject,
      html: rendered.html,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      tags: [{ name: "template", value: "newsletter" }],
    });
    await logEmailSend(admin, {
      to_email: sub.email,
      template_id: "newsletter",
      subject: rendered.subject,
      status: result.sent ? "sent" : "error",
      provider_id: result.messageId,
      error: result.error ?? null,
    });
    if (result.sent) sent += 1;
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
