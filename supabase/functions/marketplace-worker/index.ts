/**
 * Marketplace worker — expire due listings + process pending seller payouts.
 * Intended for cron (e.g. every 1–5 minutes). Uses service role.
 *
 * Auth: Authorization Bearer must match SUPABASE_SERVICE_ROLE_KEY or CRON_SECRET.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getAllowedOrigin = (requestOrigin: string | null): string | null => {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  if (allowed.length === 0) return "*";
  return allowed[0] ?? null;
};

const corsHeadersFor = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  return token === serviceKey || (cronSecret.length > 0 && token === cronSecret);
}

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = corsHeadersFor(getAllowedOrigin(requestOrigin));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  try {
    let body: { expire?: boolean; payouts?: boolean; payout_limit?: number } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const runExpire = body.expire !== false;
    const runPayouts = body.payouts !== false;
    const payoutLimit = typeof body.payout_limit === "number" ? body.payout_limit : 50;

    const result: Record<string, unknown> = {};

    if (runExpire) {
      const { data, error } = await admin.rpc("marketplace_expire_due_listings");
      if (error) throw error;
      result.expire = data;
    }

    if (runPayouts) {
      const { data, error } = await admin.rpc("marketplace_process_pending_payouts", {
        p_limit: payoutLimit,
      });
      if (error) throw error;
      result.payouts = data;
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Marketplace worker failed";
    console.error("marketplace-worker:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
