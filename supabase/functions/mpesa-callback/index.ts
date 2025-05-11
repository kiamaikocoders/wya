
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Get callback data from M-Pesa
    const callbackData = await req.json();
    console.log("M-Pesa Callback Data:", JSON.stringify(callbackData));

    // Extract relevant information
    const {
      Body: {
        stkCallback: {
          MerchantRequestID,
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          CallbackMetadata,
        },
      },
    } = callbackData;

    // Process the response
    if (ResultCode === 0) { // Success
      // Extract payment details
      const metadataItems = CallbackMetadata.Item;
      const amount = metadataItems.find(item => item.Name === "Amount")?.Value;
      const mpesaReceiptNumber = metadataItems.find(item => item.Name === "MpesaReceiptNumber")?.Value;
      const transactionDate = metadataItems.find(item => item.Name === "TransactionDate")?.Value;
      const phoneNumber = metadataItems.find(item => item.Name === "PhoneNumber")?.Value;

      // Find the transaction in our database
      const { data: transactionData, error: transactionError } = await supabase
        .from("mpesa_transactions")
        .select("reference_code")
        .eq("checkout_request_id", CheckoutRequestID)
        .single();

      if (transactionError) {
        console.error("Error finding transaction:", transactionError);
        throw new Error("Transaction not found");
      }

      // Update transaction status
      await supabase
        .from("mpesa_transactions")
        .update({
          status: "completed",
          mpesa_receipt: mpesaReceiptNumber,
          transaction_date: transactionDate,
          payment_details: CallbackMetadata
        })
        .eq("checkout_request_id", CheckoutRequestID);

      // Update ticket status
      await supabase
        .from("tickets")
        .update({
          status: "confirmed",
          payment_id: mpesaReceiptNumber
        })
        .eq("reference_code", transactionData.reference_code);

      // Create notification for user
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("user_id, event_title")
        .eq("reference_code", transactionData.reference_code)
        .single();

      if (!ticketError && ticketData) {
        await supabase
          .from("notifications")
          .insert({
            user_id: ticketData.user_id,
            title: "Payment Confirmed",
            message: `Your payment for ${ticketData.event_title} has been confirmed.`,
            type: "payment",
            resource_type: "ticket",
            read: false
          });
      }
    } else { // Failed
      // Update transaction status
      await supabase
        .from("mpesa_transactions")
        .update({
          status: "failed",
          failure_reason: ResultDesc
        })
        .eq("checkout_request_id", CheckoutRequestID);

      // Find the reference code to update the ticket
      const { data: transactionData, error: transactionError } = await supabase
        .from("mpesa_transactions")
        .select("reference_code")
        .eq("checkout_request_id", CheckoutRequestID)
        .single();

      if (!transactionError && transactionData) {
        // Update ticket status
        await supabase
          .from("tickets")
          .update({
            status: "cancelled"
          })
          .eq("reference_code", transactionData.reference_code);

        // Create notification for user
        const { data: ticketData, error: ticketError } = await supabase
          .from("tickets")
          .select("user_id, event_title")
          .eq("reference_code", transactionData.reference_code)
          .single();

        if (!ticketError && ticketData) {
          await supabase
            .from("notifications")
            .insert({
              user_id: ticketData.user_id,
              title: "Payment Failed",
              message: `Your payment for ${ticketData.event_title} failed: ${ResultDesc}`,
              type: "payment",
              resource_type: "ticket",
              read: false
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing M-Pesa callback:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Failed to process callback" }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
