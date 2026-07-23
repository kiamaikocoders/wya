/**
 * Cron: unread DM digest for users with email prefs enabled.
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

  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  // Best-effort: messages table may vary — try common schema
  const { data: unread, error } = await admin
    .from("messages")
    .select("recipient_id, conversation_id, created_at")
    .eq("read", false)
    .gte("created_at", since)
    .limit(2000);

  if (error) {
    // Table/columns may differ — soft-fail
    return new Response(
      JSON.stringify({ ok: false, error: error.message, hint: "Check messages schema" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const counts = new Map<string, number>();
  for (const m of unread ?? []) {
    const uid = (m as { recipient_id?: string }).recipient_id;
    if (!uid) continue;
    counts.set(uid, (counts.get(uid) ?? 0) + 1);
  }

  let sent = 0;
  for (const [userId, count] of counts) {
    const result = await sendTransactionalToUser({
      admin,
      userId,
      templateId: "message-digest",
      notificationType: "message",
      vars: {
        title: "Unread messages",
        message: `You have ${count} unread message${count === 1 ? "" : "s"} on WYA.`,
        link: "/chat",
      },
    });
    if (result.sent) {
      sent += 1;
      await admin.from("notifications").insert({
        user_id: userId,
        type: "message",
        title: "Unread messages",
        message: `You have ${count} unread message${count === 1 ? "" : "s"}.`,
        link: "/chat",
        read: false,
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, users: counts.size }), {
    headers: { "Content-Type": "application/json" },
  });
});
