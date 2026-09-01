import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const webhookSecret = Deno.env.get("KPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-kpay-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify HMAC-SHA256 signature on raw body
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const expected = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const event = JSON.parse(rawBody);

    if (
      typeof event.paymentId !== "string" ||
      typeof event.externalId !== "string" ||
      typeof event.status !== "string" ||
      typeof event.amount !== "number" ||
      !["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"].includes(event.status)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid payment event" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Only process payment events
    if (!event.event || !event.event.startsWith("payment.")) {
      return new Response(
        JSON.stringify({ received: true, skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Idempotently update order + payment record via SECURITY DEFINER function
    const { error } = await supabase.rpc("update_order_from_payment", {
      p_kpay_id: event.paymentId,
      p_external_id: event.externalId,
      p_status: event.status,
      p_amount: event.amount,
      p_currency: event.currency || null,
      p_provider: event.provider || null,
      p_country: event.country || null,
      p_phone_number: event.phoneNumber || null,
      p_reference: event.reference || null,
      p_provider_reference: event.providerReference || null,
      p_completed_at: event.completedAt || null,
      p_failed_at: event.failedAt || null,
      p_failure_reason: event.failureReason || null,
    });

    if (error) {
      console.error("RPC error:", error.message);
      return new Response(
        JSON.stringify({ error: "Payment event could not be processed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ received: true, processed: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
