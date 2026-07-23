/**
 * Public newsletter / waitlist subscribe + confirmation email.
 * verify_jwt = false — validates email and sends confirmation via Resend.
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

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return json({ error: "Misconfigured" }, 503);

  const admin = createClient(supabaseUrl, serviceKey);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const source = String(body.source ?? "footer");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith("@wya.local")) {
    return json({ error: "Valid email required" }, 400);
  }

  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await anon.auth.getUser(authHeader.slice(7));
    userId = data.user?.id ?? null;
  }

  const { error: upsertError } = await admin.from("newsletter_subscribers").upsert(
    {
      email,
      user_id: userId,
      source,
      confirmed: true,
      unsubscribed_at: null,
    },
    { onConflict: "email" }
  );
  if (upsertError) {
    console.error(upsertError);
    return json({ error: "Could not subscribe" }, 500);
  }

  if (userId) {
    await admin
      .from("profiles")
      .update({
        marketing_consent: true,
        marketing_consent_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  if (getResendApiKey()) {
    const settings = await loadEmailSettings(admin);
    if (settings.notificationsEnabled) {
      const rendered = renderTransactionalTemplate("waitlist-confirmation", {
        siteUrl: settings.siteUrl,
        userName: "there",
        message: "You're subscribed to WYA updates. We'll share the best events in Kenya.",
      });
      const result = await sendRawEmail({
        to: email,
        subject: rendered.subject,
        html: rendered.html,
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        tags: [{ name: "template", value: "waitlist-confirmation" }],
      });
      await logEmailSend(admin, {
        user_id: userId,
        to_email: email,
        template_id: "waitlist-confirmation",
        subject: rendered.subject,
        status: result.sent ? "sent" : "error",
        provider_id: result.messageId,
        error: result.error ?? null,
      });
    }
  }

  return json({ ok: true, email });
});
