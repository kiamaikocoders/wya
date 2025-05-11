
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// MPesa API credentials
const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY") || "";
const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET") || "";
const shortcode = Deno.env.get("MPESA_SHORTCODE") || "";
const passkey = Deno.env.get("MPESA_PASSKEY") || "";
const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { phoneNumber, amount, referenceCode, description } = await req.json();

    if (!phoneNumber || !amount || !referenceCode) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required parameters" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Format phone number (remove leading 0 or +254 and add 254)
    let formattedPhone = phoneNumber.toString().replace(/^0|^\+254/, "");
    if (formattedPhone.length === 9) {
      formattedPhone = "254" + formattedPhone;
    }

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:T\.Z]/g, "").slice(0, 14);
    
    // Generate password
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    // Get access token
    const tokenResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
        },
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Initiate STK Push
    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: referenceCode,
          TransactionDesc: description || "WYA Ticket Purchase",
        }),
      }
    );

    const stkData = await stkResponse.json();

    // Log the transaction attempt
    await supabase.from("mpesa_transactions").insert({
      phone: formattedPhone,
      amount,
      reference_code: referenceCode,
      checkout_request_id: stkData.CheckoutRequestID,
      merchant_request_id: stkData.MerchantRequestID,
      status: "pending"
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment initiated successfully",
        data: {
          checkoutRequestId: stkData.CheckoutRequestID,
          merchantRequestId: stkData.MerchantRequestID,
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error processing M-Pesa payment:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Failed to process payment" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
