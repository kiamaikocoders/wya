/**
 * Password reset with rate limiting (e.g. max 3 requests per email per hour).
 * Call this instead of supabase.auth.resetPasswordForEmail from the client.
 * Set ALLOWED_ORIGINS (CORS), SUPABASE_ANON_KEY (to call Auth recover), and optionally
 * REDIRECT_URL for the reset link (must be in Supabase Auth redirect allowlist).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const maxAttemptsPerHour = 3;

const getAllowedOrigin = (requestOrigin: string | null): string | null => {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  if (allowed.length === 0) return null;
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] ?? null;
};

const corsHeadersFor = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = corsHeadersFor(getAllowedOrigin(requestOrigin));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email;

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("password_reset_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("attempted_at", windowStart);

    if (countError) {
      console.error("request-password-reset: count error", countError.message);
      return new Response(
        JSON.stringify({ error: "Request failed. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if ((count ?? 0) >= maxAttemptsPerHour) {
      return new Response(
        JSON.stringify({ error: "Too many reset attempts. Please try again in an hour." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const { error: insertError } = await supabase.from("password_reset_attempts").insert({
      email: normalizedEmail,
      attempted_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("request-password-reset: insert error", insertError.message);
      return new Response(
        JSON.stringify({ error: "Request failed. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!supabaseAnonKey) {
      console.error("request-password-reset: SUPABASE_ANON_KEY not set");
      return new Response(
        JSON.stringify({ error: "Request failed. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const redirectUrl = Deno.env.get("REDIRECT_URL") ?? "";
    const recoverBody: { email: string; redirect_to?: string } = { email: normalizedEmail };
    if (redirectUrl) recoverBody.redirect_to = redirectUrl;

    const authRes = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify(recoverBody),
    });

    const authData = await authRes.json().catch(() => ({}));
    if (!authRes.ok) {
      console.error("request-password-reset: auth recover failed", authRes.status, authData?.msg ?? authData?.message ?? "");
      return new Response(
        JSON.stringify({ error: "Request failed. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "If an account exists, you will receive a reset link." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("request-password-reset:", err.message);
    return new Response(
      JSON.stringify({ error: "Request failed. Please try again later." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
