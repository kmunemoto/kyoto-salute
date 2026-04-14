import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all customers with LINE linked
    const { data: customers } = await supabase
      .from("profiles")
      .select("user_id, display_name, line_user_id")
      .not("line_user_id", "is", null);

    if (!customers || customers.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no customers with LINE" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const msStr = prevMonth.toISOString().slice(0, 10);
    const meStr = prevMonthEnd.toISOString().slice(0, 10);
    const monthLabel = `${prevMonth.getFullYear()}年${prevMonth.getMonth() + 1}月`;

    const results = [];

    for (const customer of customers) {
      if (!customer.line_user_id) continue;

      // Get booking count
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", customer.user_id)
        .gte("booking_date", msStr)
        .lte("booking_date", meStr + "T23:59:59")
        .neq("status", "キャンセル済み");

      // Get weight change
      const { data: measurements } = await supabase
        .from("user_measurements")
        .select("weight")
        .eq("user_id", customer.user_id)
        .gte("measured_date", msStr)
        .lte("measured_date", meStr)
        .order("measured_date", { ascending: true });

      let weightLine = "";
      if (measurements && measurements.length >= 2) {
        const first = measurements[0].weight;
        const last = measurements[measurements.length - 1].weight;
        if (first != null && last != null) {
          const diff = (last - first).toFixed(1);
          weightLine = `\n体重変化：${diff > "0" ? "+" : ""}${diff}kg`;
        }
      }

      const message = `${monthLabel}のトレーニングレポートが届きました📊\n\n来店回数：${bookingCount || 0}回${weightLine}\n\nアプリのホーム画面から詳しいレポートをご覧ください！`;

      // Send via send-line-message
      const res = await fetch(`${supabaseUrl}/functions/v1/send-line-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          line_user_id: customer.line_user_id,
          message,
        }),
      });

      results.push({
        user_id: customer.user_id,
        success: res.ok,
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("monthly-report-notification error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
