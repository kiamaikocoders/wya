/**
 * Returns auth user IDs that match the ghost email pattern (ghost.*@wya.local).
 * Used by admin dashboard to exclude ghost users from stats. Requires admin role (JWT + profile check).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getAllowedOrigin = (requestOrigin: string | null): string | null => {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  if (allowed.length === 0) return null;
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] ?? null;
};

const corsHeadersFor = (origin: string | null) => ({
  ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
});

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = corsHeadersFor(getAllowedOrigin(requestOrigin));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (!profile || profile.username !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      console.error("admin-get-ghost-user-ids: listUsers failed", listError.message);
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const ghostUserIds = (authUsers ?? [])
      .filter((u) => u.email?.includes("ghost.") && u.email?.endsWith("@wya.local"))
      .map((u) => u.id);

    return new Response(JSON.stringify({ ghost_user_ids: ghostUserIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("admin-get-ghost-user-ids:", err.message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
