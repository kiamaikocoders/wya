import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Optional: set MPESA_CALLBACK_SECRET and add ?secret=<value> to your callback URL when registering with Safaricom
const callbackSecret = Deno.env.get("MPESA_CALLBACK_SECRET") || "";

function isValidMpesaPayload(body: unknown): body is { Body: { stkCallback: { MerchantRequestID: string; CheckoutRequestID: string; ResultCode: number; ResultDesc?: string; CallbackMetadata?: { Item: Array<{ Name: string; Value: unknown }> } } } } {
  if (!body || typeof body !== "object" || !("Body" in body)) return false;
  const b = (body as { Body?: unknown }).Body;
  if (!b || typeof b !== "object" || !("stkCallback" in b)) return false;
  const stk = (b as { stkCallback?: unknown }).stkCallback;
  if (!stk || typeof stk !== "object") return false;
  const s = stk as Record<string, unknown>;
  return typeof s.MerchantRequestID === "string" && typeof s.CheckoutRequestID === "string" && typeof s.ResultCode === "number";
}

serve(async (req) => {
  try {
    // Optional: verify callback URL secret (query param ?secret=...)
    if (callbackSecret) {
      const url = new URL(req.url);
      const secret = url.searchParams.get("secret");
      if (secret !== callbackSecret) {
        console.error("M-Pesa callback: invalid or missing secret");
        return new Response(JSON.stringify({ ResultCode: 401, ResultDesc: "Unauthorized" }), {
          headers: { "Content-Type": "application/json" },
          status: 401,
        });
      }
    }

    const callbackData = await req.json();

    if (!isValidMpesaPayload(callbackData)) {
      console.error("M-Pesa callback: invalid payload structure");
      return new Response(JSON.stringify({ ResultCode: 400, ResultDesc: "Bad request" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const {
      Body: {
        stkCallback: {
          MerchantRequestID: _MerchantRequestID,
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          CallbackMetadata,
        },
      },
    } = callbackData;

    if (ResultCode === 0) {
      const metadataItems = CallbackMetadata?.Item ?? [];
      const amount = metadataItems.find((item: { Name: string }) => item.Name === "Amount")?.Value;
      const mpesaReceiptNumber = metadataItems.find((item: { Name: string }) => item.Name === "MpesaReceiptNumber")?.Value;
      const transactionDate = metadataItems.find((item: { Name: string }) => item.Name === "TransactionDate")?.Value;

      const { data: transactionData, error: transactionError } = await supabase
        .from("mpesa_transactions")
        .select("reference_code")
        .eq("checkout_request_id", CheckoutRequestID)
        .single();

      if (transactionError) {
        console.error("M-Pesa callback: transaction lookup failed");
        return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }

      await supabase
        .from("mpesa_transactions")
        .update({
          status: "completed",
          mpesa_receipt: mpesaReceiptNumber,
          transaction_date: transactionDate,
          payment_details: CallbackMetadata,
        })
        .eq("checkout_request_id", CheckoutRequestID);

      await supabase
        .from("tickets")
        .update({ status: "confirmed", payment_id: mpesaReceiptNumber })
        .eq("reference_code", transactionData.reference_code);

      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("user_id, event_title")
        .eq("reference_code", transactionData.reference_code)
        .single();

      if (!ticketError && ticketData) {
        await supabase.from("notifications").insert({
          user_id: ticketData.user_id,
          title: "Payment Confirmed",
          message: `Your payment for ${ticketData.event_title} has been confirmed.`,
          type: "payment",
          resource_type: "ticket",
          read: false,
        });
      }
    } else {
      await supabase
        .from("mpesa_transactions")
        .update({ status: "failed", failure_reason: ResultDesc })
        .eq("checkout_request_id", CheckoutRequestID);

      const { data: transactionData, error: transactionError } = await supabase
        .from("mpesa_transactions")
        .select("reference_code")
        .eq("checkout_request_id", CheckoutRequestID)
        .single();

      if (!transactionError && transactionData) {
        await supabase.from("tickets").update({ status: "cancelled" }).eq("reference_code", transactionData.reference_code);

        const { data: ticketData, error: ticketError } = await supabase
          .from("tickets")
          .select("user_id, event_title")
          .eq("reference_code", transactionData.reference_code)
          .single();

        if (!ticketError && ticketData) {
          await supabase.from("notifications").insert({
            user_id: ticketData.user_id,
            title: "Payment Failed",
            message: `Your payment for ${ticketData.event_title} failed.`,
            type: "payment",
            resource_type: "ticket",
            read: false,
          });
        }
      }
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("M-Pesa callback error:", err.message);
    return new Response(
      JSON.stringify({ ResultCode: 500, ResultDesc: "Internal error" }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
