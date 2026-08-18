/**
 * Admin: permanently delete a user (app data via delete_user_data + auth user removal).
 * Auth: Bearer JWT of profiles.username === 'admin'.
 * Body: { user_id: string }
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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = corsHeadersFor(getAllowedOrigin(requestOrigin));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: adminUserData, error: adminUserErr } = await authClient.auth.getUser();
    if (adminUserErr || !adminUserData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: adminProfile } = await adminClient
      .from("profiles")
      .select("username")
      .eq("id", adminUserData.user.id)
      .maybeSingle();

    if (!adminProfile || adminProfile.username !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.user_id ?? "").trim();
    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (userId === adminUserData.user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own admin account" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    if (targetProfile?.username === "admin") {
      return new Response(JSON.stringify({ error: "Cannot delete the admin account" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { error: rpcErr } = await authClient.rpc("delete_user_data", { user_uuid: userId });
    if (rpcErr) {
      console.error("admin-delete-user: delete_user_data", rpcErr.message);
      return new Response(JSON.stringify({ error: rpcErr.message || "Failed to delete user data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("admin-delete-user: admin.deleteUser", delErr.message);
      return new Response(JSON.stringify({ error: delErr.message || "Failed to remove auth user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    try {
      await adminClient.rpc("admin_audit", {
        p_action: "auth.hard_delete_user",
        p_entity_type: "user",
        p_entity_id: userId,
        p_metadata: { deleted_by: adminUserData.user.id },
      });
    } catch {
      /* optional */
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("admin-delete-user", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
