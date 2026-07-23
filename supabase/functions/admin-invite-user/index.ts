/**
 * Admin invite user by email (Supabase Auth inviteUserByEmail).
 * Uses Auth invite template (emails/invite-user.html) via Resend SMTP.
 *
 * Auth: admin JWT (profiles.username === 'admin')
 * Body: { email: string, redirectTo?: string }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Misconfigured" }, 503);

  const admin = createClient(supabaseUrl, serviceKey);
  const authClient = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userErr } = await authClient.auth.getUser(authHeader.slice(7));
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profile?.username !== "admin") return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email.includes("@") || email.endsWith("@wya.local")) {
    return json({ error: "Valid email required" }, 400);
  }

  const redirectTo =
    typeof body.redirectTo === "string" && body.redirectTo.startsWith("http")
      ? body.redirectTo
      : undefined;

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (error) {
    return json({ error: error.message }, 400);
  }

  try {
    await admin.rpc("admin_audit", {
      p_action: "auth.invite_user",
      p_entity_type: "user",
      p_entity_id: data.user?.id ?? email,
      p_metadata: { email },
    });
  } catch {
    /* optional */
  }

  return json({ ok: true, user_id: data.user?.id ?? null, email });
});
