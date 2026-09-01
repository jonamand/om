import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { amount, externalId, description, returnUrl, cancelUrl, metadata } = await req.json();

    if (!amount || !externalId || !description || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, externalId, description, returnUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("KPAY_API_KEY");
    const secretKey = Deno.env.get("KPAY_SECRET_KEY");

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const baseUrl = "https://admin.kpay.site";

    const body: Record<string, unknown> = {
      amount: Math.round(amount),
      externalId,
      returnUrl,
      description,
    };

    if (cancelUrl) body.cancelUrl = cancelUrl;
    if (metadata) body.metadata = metadata;

    const response = await fetch(`${baseUrl}/api/v1/payments/init`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "X-Secret-Key": secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || "Payment initialization failed" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
