/**
 * Deletes the caller's application data (RPC) then removes the auth user (service role).
 * Requires a valid user JWT. Configure ALLOWED_ORIGINS for CORS.
 *
 * Optional body: { require_reauth?: boolean } — triggers auth.reauthenticate() first
 * so Supabase can send the reauthentication email template.
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
    const body = await req.json().catch(() => ({}));
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email ?? null;
    const displayName =
      (userData.user.user_metadata?.full_name as string) ||
      (userData.user.user_metadata?.username as string) ||
      "there";

    if (body?.require_reauth === true) {
      const { error: reauthErr } = await userClient.auth.reauthenticate();
      if (reauthErr) {
        return new Response(
          JSON.stringify({
            error: "Reauthentication required",
            hint: reauthErr.message,
            code: "reauth_required",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }
    }

    if (userEmail && !userEmail.endsWith("@wya.local") && getResendApiKey()) {
      try {
        const adminMail = createClient(supabaseUrl, supabaseServiceKey);
        const settings = await loadEmailSettings(adminMail);
        if (settings.notificationsEnabled) {
          const rendered = renderTransactionalTemplate("account-deleted", {
            siteUrl: settings.siteUrl,
            userName: displayName,
            message: "Your WYA account and data have been deleted as requested.",
          });
          const result = await sendRawEmail({
            to: userEmail,
            subject: rendered.subject,
            html: rendered.html,
            fromEmail: settings.fromEmail,
            fromName: settings.fromName,
            tags: [{ name: "template", value: "account-deleted" }],
          });
          await logEmailSend(adminMail, {
            user_id: userId,
            to_email: userEmail,
            template_id: "account-deleted",
            subject: rendered.subject,
            status: result.sent ? "sent" : "error",
            provider_id: result.messageId,
            error: result.error ?? null,
          });
        }
      } catch (mailErr) {
        console.warn("delete-my-account email failed", mailErr);
      }
    }

    const { error: rpcErr } = await userClient.rpc("delete_user_data", { user_uuid: userId });
    if (rpcErr) {
      console.error("delete-my-account: delete_user_data", rpcErr.message);
      return new Response(JSON.stringify({ error: rpcErr.message || "Failed to delete account data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("delete-my-account: admin.deleteUser", delErr.message);
      return new Response(JSON.stringify({ error: delErr.message || "Failed to remove auth user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("delete-my-account", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
