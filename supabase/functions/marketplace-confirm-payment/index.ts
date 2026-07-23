/**
 * Marketplace payment confirmation webhook / stub.
 * Call after M-Pesa (or other rail) succeeds to complete a pending transfer.
 *
 * Body: { transfer_id: number, payment_reference?: string }
 * Auth: Bearer SUPABASE_SERVICE_ROLE_KEY or CRON_SECRET (same as worker).
 *
 * Note: marketplace_purchase_listing currently completes atomically for the stub
 * payment path. Use this when purchase creates pending_payment and waits on webhook.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTransactionalToUser } from "../_shared/resend.ts";

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

  try {
    const body = await req.json();
    const transferId = Number(body?.transfer_id);
    const paymentReference =
      typeof body?.payment_reference === "string" ? body.payment_reference : null;

    if (!Number.isFinite(transferId) || transferId <= 0) {
      return new Response(JSON.stringify({ error: "transfer_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin.rpc("marketplace_confirm_payment", {
      p_transfer_id: transferId,
      p_payment_reference: paymentReference,
    });

    if (error) throw error;

    // Notify buyer + seller when transfer row is available
    try {
      const { data: transfer } = await admin
        .from("marketplace_transfers")
        .select("id, buyer_id, seller_id, listing_id, status")
        .eq("id", transferId)
        .maybeSingle();

      if (transfer?.buyer_id) {
        await admin.from("notifications").insert({
          user_id: transfer.buyer_id,
          type: "marketplace_buyer",
          title: "Purchase confirmed",
          message: "Your marketplace ticket transfer is complete.",
          link: "/tickets",
          read: false,
          data: { transfer_id: transferId },
        });
        await sendTransactionalToUser({
          admin,
          userId: transfer.buyer_id,
          templateId: "marketplace-buyer-receipt",
          notificationType: "marketplace_buyer",
          vars: { message: "Your marketplace ticket transfer is complete.", link: "/tickets" },
        });
      }
      if (transfer?.seller_id) {
        await admin.from("notifications").insert({
          user_id: transfer.seller_id,
          type: "marketplace_seller",
          title: "Listing sold",
          message: "Your marketplace listing sold successfully.",
          link: "/marketplace",
          read: false,
          data: { transfer_id: transferId },
        });
        await sendTransactionalToUser({
          admin,
          userId: transfer.seller_id,
          templateId: "marketplace-seller-sold",
          notificationType: "marketplace_seller",
          vars: { message: "Your marketplace listing sold successfully.", link: "/marketplace" },
        });
      }
    } catch (notifyErr) {
      console.warn("marketplace notify failed", notifyErr);
    }

    return new Response(JSON.stringify({ ok: true, result: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Confirm payment failed";
    console.error("marketplace-confirm-payment:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
