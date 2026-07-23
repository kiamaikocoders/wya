/**
 * Cron: event reminders at ~24h and ~2h before start.
 * Auth: Bearer CRON_SECRET or service role.
 *
 * Schedule every 15–30 minutes via external cron / Supabase scheduled functions.
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

  const now = Date.now();
  const windows = [
    { label: "24h", minMs: 23 * 3600_000, maxMs: 25 * 3600_000, whenLabel: "is tomorrow" },
    { label: "2h", minMs: 1.5 * 3600_000, maxMs: 2.5 * 3600_000, whenLabel: "starts in about 2 hours" },
  ];

  let sent = 0;
  let skipped = 0;

  const { data: events, error } = await admin
    .from("events")
    .select("id, title, date, time")
    .gte("date", new Date(now - 86400_000).toISOString().slice(0, 10))
    .lte("date", new Date(now + 2 * 86400_000).toISOString().slice(0, 10))
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  for (const event of events ?? []) {
    const timePart = (event.time as string | null)?.slice(0, 8) || "12:00:00";
    const startMs = Date.parse(`${event.date}T${timePart}`);
    if (!Number.isFinite(startMs)) continue;
    const delta = startMs - now;

    for (const w of windows) {
      if (delta < w.minMs || delta > w.maxMs) continue;

      const { data: tickets } = await admin
        .from("tickets")
        .select("user_id")
        .eq("event_id", event.id)
        .in("status", ["confirmed", "active"])
        .limit(500);

      const userIds = [...new Set((tickets ?? []).map((t) => t.user_id))];
      for (const userId of userIds) {
        const { error: logErr } = await admin.from("email_reminder_log").insert({
          user_id: userId,
          event_id: event.id,
          window_label: w.label,
        });
        if (logErr) {
          skipped += 1;
          continue; // already sent (unique violation) or other error
        }

        await admin.from("notifications").insert({
          user_id: userId,
          type: "event_update",
          title: "Event reminder",
          message: `${event.title} ${w.whenLabel}.`,
          link: `/events/${event.id}`,
          read: false,
          data: { eventTitle: event.title, whenLabel: w.whenLabel },
        });

        const result = await sendTransactionalToUser({
          admin,
          userId,
          templateId: "event-reminder",
          notificationType: "event_update",
          vars: {
            eventTitle: event.title,
            whenLabel: w.whenLabel,
            link: `/events/${event.id}`,
            message: `${event.title} ${w.whenLabel}.`,
          },
        });
        if (result.sent) sent += 1;
        else skipped += 1;
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, skipped }), {
    headers: { "Content-Type": "application/json" },
  });
});
