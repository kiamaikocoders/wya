/**
 * Admin System ops — health probes + Resend test send.
 * Auth: Bearer JWT of profiles.username === 'admin'.
 *
 * POST body:
 *   { action: "health" }
 *   { action: "email_status" }
 *   { action: "test_email", to?: string }
 *
 * Secrets: RESEND_API_KEY (required for test send). Optional EMAIL_FROM / EMAIL_FROM_NAME overrides.
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

function unwrapSetting(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return { error: "Server configuration error", status: 500 as const };
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const authClient = createClient(supabaseUrl, anonKey);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.username !== "admin") {
    return { error: "Forbidden", status: 403 as const };
  }

  return { admin, user };
}

async function loadEmailSettings(admin: ReturnType<typeof createClient>) {
  const keys = [
    "email.provider",
    "email.smtp_host",
    "email.smtp_port",
    "email.smtp_user",
    "email.from_email",
    "email.from_name",
    "email.notifications_enabled",
    "platform.site_name",
    "platform.site_url",
  ];
  const { data } = await admin.from("system_settings").select("key, value").in("key", keys);
  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    map[row.key] = unwrapSetting(row.value);
  }
  return map;
}

function formatUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

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

  try {
    const gate = await requireAdmin(req);
    if ("error" in gate && gate.error) {
      return new Response(JSON.stringify({ error: gate.error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: gate.status,
      });
    }
    const { admin, user } = gate as {
      admin: ReturnType<typeof createClient>;
      user: { id: string; email?: string };
    };

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "health");

    if (action === "health") {
      const started = Date.now();
      const dbProbe = await admin.from("profiles").select("id", { count: "exact", head: true });
      const dbMs = Date.now() - started;
      const database = dbProbe.error ? "Error" : dbMs > 1500 ? "Degraded" : "Healthy";

      const authStarted = Date.now();
      const { data: userData, error: userErr } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      const authMs = Date.now() - authStarted;
      const authStatus = userErr ? "Error" : userData ? "Healthy" : "Degraded";

      let storage: "Healthy" | "Degraded" | "Error" = "Healthy";
      let storageMs = 0;
      try {
        const s0 = Date.now();
        const { error: storageErr } = await admin.storage.listBuckets();
        storageMs = Date.now() - s0;
        if (storageErr) storage = "Error";
        else if (storageMs > 1500) storage = "Degraded";
      } catch {
        storage = "Error";
      }

      const resendKey = (Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("EMAIL_API_KEY") ?? "").trim();
      // Auth uses Resend SMTP (configured in Supabase Auth). Edge key enables platform sends.
      const email = resendKey ? "Healthy" : "Auth SMTP only";

      const onesignal =
        Deno.env.get("ONESIGNAL_APP_ID") && Deno.env.get("ONESIGNAL_REST_API_KEY")
          ? "Healthy"
          : "Not configured";

      const marketplaceTables = await admin
        .from("marketplace_listings")
        .select("id", { count: "exact", head: true });
      const marketplace = marketplaceTables.error ? "Not migrated" : "Healthy";

      const uptimeSec = Math.floor(performance.now() / 1000);

      return new Response(
        JSON.stringify({
          health: {
            database,
            auth: authStatus,
            storage,
            email,
            push: onesignal,
            marketplace,
          },
          metrics: {
            dbLatencyMs: dbMs,
            authLatencyMs: authMs,
            storageLatencyMs: storageMs,
            uptimeLabel: formatUptime(uptimeSec),
            runtime: "deno-edge",
          },
          serverStatus: [database, authStatus, storage].every((s) => s === "Healthy")
            ? "All systems operational"
            : "Attention needed",
          resendConfigured: Boolean(resendKey),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "email_status") {
      const settings = await loadEmailSettings(admin);
      const resendKey = (Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("EMAIL_API_KEY") ?? "").trim();
      const source: "env" | "none" = resendKey ? "env" : "none";
      return new Response(
        JSON.stringify({
          provider: String(settings["email.provider"] ?? "resend"),
          smtpHost: String(settings["email.smtp_host"] ?? "smtp.resend.com"),
          smtpPort: Number(settings["email.smtp_port"] ?? 465),
          smtpUser: String(settings["email.smtp_user"] ?? "resend"),
          fromEmail: String(
            Deno.env.get("EMAIL_FROM")?.trim() ||
              settings["email.from_email"] ||
              "team@wya254.com"
          ),
          fromName: String(
            Deno.env.get("EMAIL_FROM_NAME")?.trim() ||
              settings["email.from_name"] ||
              settings["platform.site_name"] ||
              "WYA"
          ),
          notificationsEnabled: Boolean(settings["email.notifications_enabled"] ?? true),
          smtpPassSet: Boolean(resendKey),
          smtpPassSource: source,
          siteName: String(settings["platform.site_name"] ?? "WYA"),
          siteUrl: String(settings["platform.site_url"] ?? "https://whereyouat.ke"),
          note:
            source === "env"
              ? "RESEND_API_KEY is set on the Edge Function environment."
              : "Auth SMTP already uses Resend. Add RESEND_API_KEY as a Supabase secret for platform test/transactional sends, then redeploy admin-system.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "test_email") {
      const settings = await loadEmailSettings(admin);
      if (settings["email.notifications_enabled"] === false) {
        return new Response(
          JSON.stringify({ error: "Email notifications are disabled in System settings" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const resendKey = (Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("EMAIL_API_KEY") ?? "").trim();
      if (!resendKey) {
        return new Response(
          JSON.stringify({
            error:
              "RESEND_API_KEY is not set on this project. Auth already uses Resend SMTP — add the same API key as a Supabase secret, then redeploy admin-system.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const to = String(body?.to || user.email || "").trim();
      if (!to.includes("@")) {
        return new Response(JSON.stringify({ error: "Valid recipient email required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const fromEmail = String(
        Deno.env.get("EMAIL_FROM")?.trim() ||
          settings["email.from_email"] ||
          "team@wya254.com"
      );
      const fromName = String(
        Deno.env.get("EMAIL_FROM_NAME")?.trim() ||
          settings["email.from_name"] ||
          settings["platform.site_name"] ||
          "WYA"
      );

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [to],
          subject: `${fromName} — System test email`,
          html: `<p>This is a test email from the <strong>${fromName}</strong> admin System page via Resend.</p><p>From: ${fromEmail}<br/>Sent at ${new Date().toISOString()}</p>`,
          text: `This is a test email from ${fromName} admin System page via Resend.\nFrom: ${fromEmail}\nSent at ${new Date().toISOString()}`,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        return new Response(
          JSON.stringify({
            error: payload?.message || payload?.error || `Resend error (${res.status})`,
            details: payload,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
        );
      }

      try {
        await admin.rpc("admin_audit", {
          p_action: "system.email.test",
          p_entity_type: "email",
          p_entity_id: to,
          p_metadata: { from: fromEmail, provider: "resend", messageId: payload?.id },
        });
      } catch {
        // audit optional if RPC missing
      }

      return new Response(
        JSON.stringify({
          success: true,
          messageId: payload?.id ?? null,
          from: fromEmail,
          to,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "System request failed";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
