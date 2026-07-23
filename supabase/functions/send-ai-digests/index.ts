/**
 * Cron: weekly AI digest for users with notify_ai_digest in onboarding_preferences.
 * Auth: Bearer CRON_SECRET or service role.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTransactionalToUser } from "../_shared/resend.ts";

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

  const { data: upcoming } = await admin
    .from("events")
    .select("id, title, date, location")
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: true })
    .limit(8);

  const listHtml = (upcoming ?? [])
    .map(
      (e) =>
        `<li style="margin:0 0 8px 0;"><strong style="color:#fff;">${e.title}</strong> — ${e.date}${e.location ? ` · ${e.location}` : ""}</li>`
    )
    .join("");

  const digestBody =
    listHtml.length > 0
      ? `Here's what's coming up on WYA:<ul style="color:#BCAB9A;padding-left:18px;">${listHtml}</ul>`
      : "Check WYA for new events near you this week.";

  const { data: prefs, error } = await admin
    .from("onboarding_preferences")
    .select("user_id, notify_ai_digest")
    .eq("notify_ai_digest", true)
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  for (const row of prefs ?? []) {
    const result = await sendTransactionalToUser({
      admin,
      userId: row.user_id,
      templateId: "ai-digest",
      notificationType: "ai_digest",
      requireMarketing: true,
      vars: {
        title: "Your weekly WYA digest",
        message: digestBody,
        link: "/events",
      },
    });
    if (result.sent) sent += 1;
  }

  return new Response(JSON.stringify({ ok: true, sent, candidates: prefs?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
